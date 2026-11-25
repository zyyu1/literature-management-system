// D007-A60 — test-only cross-platform egress precondition (shared by the WP-01 and WP-02 suites).
// Read-only, fail-closed, Node builtins only, no product imports and no machine/network changes.
//
// Linux: keep the A54/A55 requirement that the kernel namespace exposes nothing but `lo` and that
// no proxy variable is inherited.
// Windows: use read-only, built-in Windows networking queries (Get-NetAdapter -IncludeHidden,
// Get-NetIPInterface, Get-NetIPAddress, Get-NetRoute) and accept ONLY a fully proven offline state:
// every non-loopback interface must be unavailable (adapter not Up, media not Connected, IP
// interface Disconnected), and no usable interface may carry any non-loopback address or default
// route. Anything ambiguous, inconsistent, empty, malformed, slow or unsupported fails closed.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

export const SUPPORTED_PLATFORMS = Object.freeze(['linux', 'win32']);
export const EXPECTED_NODE_VERSION = 'v22.23.5';
export const EXPECTED_ARCH = 'x64';
export const DEFAULT_QUERY_TIMEOUT_MS = 8000;

const PROXY_NAMES = Object.freeze(['http_proxy', 'https_proxy', 'all_proxy']);

function fail(reason) {
  throw new Error(`EGRESS_PRECONDITION_FAILED: ${reason}`);
}
function isPositiveInt(v) {
  return Number.isInteger(v) && v > 0;
}
function isLoopbackAddress(ip) {
  return ip === '127.0.0.1' || ip === '::1' || /^127\./.test(ip);
}
// Windows reports IPv6 link-local addresses with a zone suffix (fe80::1%16); strip only a numeric
// zone, otherwise classify as malformed and fail closed.
function normalizeIp(ip) {
  if (typeof ip !== 'string') return null;
  const zoned = ip.match(/^(.*)%(\d+)$/);
  const bare = zoned ? zoned[1] : ip;
  return net.isIP(bare) === 0 ? null : bare;
}
function asArray(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

// Pure policy: OS/runtime gate.
export function evaluatePlatform({ platform, version, arch }) {
  if (!SUPPORTED_PLATFORMS.includes(platform)) return 'UNSUPPORTED_PLATFORM';
  if (version !== EXPECTED_NODE_VERSION) return 'UNSUPPORTED_NODE_VERSION';
  if (arch !== EXPECTED_ARCH) return 'UNSUPPORTED_ARCH';
  return null;
}

// Pure policy: inherited proxy variables are refused (names are case-insensitive on Windows).
export function evaluateProxyEnv(env) {
  const names = Object.keys(env || {}).map((k) => k.toLowerCase());
  return names.some((k) => PROXY_NAMES.includes(k)) ? 'PROXY_ENV' : null;
}

// Pure policy: Linux keeps the original A54/A55 interface requirement.
export function evaluateLinuxInterfaceNames(names) {
  if (!Array.isArray(names)) return { ok: false, reason: 'INVENTORY_MALFORMED' };
  if (names.length === 1 && names[0] === 'lo') return { ok: true, reason: null, sanitized: { interfaceCount: 1 } };
  return { ok: false, reason: 'LINUX_INTERFACE_SET' };
}

// Pure policy over an already-read inventory. Never performs I/O.
export function evaluateWindowsInventory(inv) {
  if (!inv || typeof inv !== 'object') return { ok: false, reason: 'INVENTORY_MALFORMED' };
  const { adapters, ipInterfaces, addresses, defaultRoutes } = inv;
  if (!Array.isArray(adapters) || !Array.isArray(ipInterfaces) || !Array.isArray(addresses) || !Array.isArray(defaultRoutes)) {
    return { ok: false, reason: 'INVENTORY_MALFORMED' };
  }
  if (adapters.length === 0 || ipInterfaces.length === 0 || addresses.length === 0) {
    return { ok: false, reason: 'INVENTORY_EMPTY' };
  }

  const adapterByIndex = new Map();
  for (const a of adapters) {
    if (!a || !isPositiveInt(a.ifIndex) || typeof a.status !== 'string' || !a.status
      || typeof a.media !== 'string' || !a.media) return { ok: false, reason: 'INVENTORY_MALFORMED' };
    if (adapterByIndex.has(a.ifIndex)) return { ok: false, reason: 'INVENTORY_AMBIGUOUS' };
    adapterByIndex.set(a.ifIndex, a);
  }

  const ipByIndex = new Map();
  for (const row of ipInterfaces) {
    if (!row || !isPositiveInt(row.ifIndex) || (row.family !== 'IPv4' && row.family !== 'IPv6')
      || (row.state !== 'Connected' && row.state !== 'Disconnected')) return { ok: false, reason: 'INVENTORY_MALFORMED' };
    const key = `${row.ifIndex}/${row.family}`;
    if (ipByIndex.has(key)) return { ok: false, reason: 'INVENTORY_AMBIGUOUS' };
    ipByIndex.set(key, row);
  }

  const addrByIndex = new Map();
  const normalizedAddresses = [];
  for (const a of addresses) {
    if (!a || !isPositiveInt(a.ifIndex)) return { ok: false, reason: 'INVENTORY_MALFORMED' };
    const ip = normalizeIp(a.ip);
    if (!ip) return { ok: false, reason: 'INVENTORY_MALFORMED' };
    normalizedAddresses.push({ ifIndex: a.ifIndex, ip });
    if (!addrByIndex.has(a.ifIndex)) addrByIndex.set(a.ifIndex, []);
    addrByIndex.get(a.ifIndex).push(ip);
  }
  if (!normalizedAddresses.some((a) => isLoopbackAddress(a.ip))) return { ok: false, reason: 'NO_LOOPBACK' };

  const loopbackIndexes = new Set();
  for (const [index, ips] of addrByIndex.entries()) {
    if (ips.every((ip) => isLoopbackAddress(ip))) loopbackIndexes.add(index);
  }

  // Every non-loopback address must be linked to a known adapter and a known IP interface.
  for (const a of normalizedAddresses) {
    if (isLoopbackAddress(a.ip)) continue;
    if (!adapterByIndex.has(a.ifIndex)) return { ok: false, reason: 'UNKNOWN_LINKAGE' };
    const rows = [...ipByIndex.values()].filter((r) => r.ifIndex === a.ifIndex);
    if (rows.length === 0) return { ok: false, reason: 'UNKNOWN_LINKAGE' };
  }
  for (const r of defaultRoutes) {
    if (!r || !isPositiveInt(r.ifIndex) || typeof r.dest !== 'string') return { ok: false, reason: 'INVENTORY_MALFORMED' };
    if (r.dest !== '0.0.0.0/0' && r.dest !== '::/0') return { ok: false, reason: 'INVENTORY_MALFORMED' };
    if (!adapterByIndex.has(r.ifIndex)) return { ok: false, reason: 'UNKNOWN_LINKAGE' };
    if (![...ipByIndex.values()].some((x) => x.ifIndex === r.ifIndex)) return { ok: false, reason: 'UNKNOWN_LINKAGE' };
  }

  const rowsFor = (index) => [...ipByIndex.values()].filter((r) => r.ifIndex === index);
  const usable = (index) => {
    const adapter = adapterByIndex.get(index);
    if (!adapter || adapter.status !== 'Up' || adapter.media !== 'Connected') return false;
    const rows = rowsFor(index);
    return rows.length > 0 && rows.every((r) => r.state === 'Connected');
  };

  let usableInterfaces = 0;
  for (const index of adapterByIndex.keys()) {
    if (loopbackIndexes.has(index)) continue;
    if (!usable(index)) continue;
    usableInterfaces += 1;
    // Any address on a usable non-loopback interface is an active path (LAN, VPN, virtual, IPv6).
    if ((addrByIndex.get(index) || []).length > 0) return { ok: false, reason: 'ACTIVE_PATH' };
  }
  for (const r of defaultRoutes) {
    if (usable(r.ifIndex)) return { ok: false, reason: 'USABLE_DEFAULT_ROUTE' };
  }
  // A connected IP interface on an adapter that is not Up/Connected is contradictory state.
  for (const row of ipByIndex.values()) {
    if (row.state !== 'Connected') continue;
    const index = row.ifIndex;
    if (loopbackIndexes.has(index)) continue;
    if (!adapterByIndex.has(index)) return { ok: false, reason: 'UNKNOWN_LINKAGE' };
    if (!usable(index)) return { ok: false, reason: 'INVENTORY_INCONSISTENT' };
  }
  // A default route on an interface whose IP state is unavailable is accepted only as stale proof.
  for (const r of defaultRoutes) {
    const rows = rowsFor(r.ifIndex);
    if (rows.some((x) => x.state === 'Connected') && !usable(r.ifIndex)) {
      return { ok: false, reason: 'INVENTORY_INCONSISTENT' };
    }
  }

  return {
    ok: true,
    reason: null,
    sanitized: {
      adapterCount: adapters.length,
      ipInterfaceCount: ipInterfaces.length,
      addressCount: addresses.length,
      defaultRouteCount: defaultRoutes.length,
      usableNonLoopbackInterfaces: usableInterfaces,
      staleDefaultRoutes: defaultRoutes.length,
    },
  };
}

const PS_SCRIPT = [
  "$ErrorActionPreference='Stop'",
  "$adapters = @(Get-NetAdapter -IncludeHidden -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ ifIndex=[int]$_.ifIndex; status=[string]$_.Status; media=[string]$_.MediaConnectionState } })",
  "$ipInterfaces = @(Get-NetIPInterface -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ ifIndex=[int]$_.InterfaceIndex; family=[string]$_.AddressFamily; state=[string]$_.ConnectionState } })",
  "$addresses = @(Get-NetIPAddress -AddressFamily IPv4,IPv6 -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ ifIndex=[int]$_.InterfaceIndex; ip=[string]$_.IPAddress } })",
  "$defaultRoutes = @(Get-NetRoute -ErrorAction Stop | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' -or $_.DestinationPrefix -eq '::/0' } | ForEach-Object { [pscustomobject]@{ ifIndex=[int]$_.InterfaceIndex; dest=[string]$_.DestinationPrefix } })",
  "[pscustomobject]@{ adapters=$adapters; ipInterfaces=$ipInterfaces; addresses=$addresses; defaultRoutes=$defaultRoutes } | ConvertTo-Json -Depth 6 -Compress",
].join('; ');

function defaultPowerShellPath() {
  const root = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
  return path.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
}

// Read-only inventory. Resolves an explicit trusted system executable (never PATH), no profile, no
// elevation, bounded timeout. Any failure is returned as a closed reason code.
export function readWindowsInventory(options = {}) {
  const spawn = options.spawnSyncImpl || spawnSync;
  const psPath = options.psPath || defaultPowerShellPath();
  try {
    if (!fs.statSync(psPath).isFile()) return { ok: false, reason: 'POWERSHELL_NOT_FOUND' };
  } catch {
    return { ok: false, reason: 'POWERSHELL_NOT_FOUND' };
  }
  const timeout = options.timeoutMs || DEFAULT_QUERY_TIMEOUT_MS;
  let result;
  try {
    result = spawn(psPath, ['-NoProfile', '-NonInteractive', '-Command', PS_SCRIPT], {
      timeout, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024,
    });
  } catch {
    return { ok: false, reason: 'QUERY_FAILED' };
  }
  if (!result || result.error || result.status !== 0 || typeof result.stdout !== 'string' || result.stdout.trim() === '') {
    return { ok: false, reason: 'QUERY_FAILED' };
  }
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return { ok: false, reason: 'QUERY_MALFORMED' };
  }
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'QUERY_MALFORMED' };
  return {
    ok: true,
    reason: null,
    inventory: {
      adapters: asArray(parsed.adapters),
      ipInterfaces: asArray(parsed.ipInterfaces),
      addresses: asArray(parsed.addresses),
      defaultRoutes: asArray(parsed.defaultRoutes),
    },
  };
}

// Assertion used by the suites. Throws EGRESS_PRECONDITION_FAILED with a stable reason code.
export function assertPlatformEgressPrecondition() {
  const platformReason = evaluatePlatform({ platform: process.platform, version: process.version, arch: process.arch });
  if (platformReason) fail(platformReason);
  const proxyReason = evaluateProxyEnv(process.env);
  if (proxyReason) fail(proxyReason);

  if (process.platform === 'linux') {
    const linux = evaluateLinuxInterfaceNames(Object.keys(os.networkInterfaces()));
    if (!linux.ok) fail(linux.reason);
    return {
      ok: true, platform: 'linux', method: 'linux-lo-only',
      node: process.version, arch: process.arch, sanitized: linux.sanitized,
    };
  }

  const read = readWindowsInventory();
  if (!read.ok) fail(read.reason);
  const verdict = evaluateWindowsInventory(read.inventory);
  if (!verdict.ok) fail(verdict.reason);
  return {
    ok: true, platform: 'win32', method: 'windows-offline-interval',
    node: process.version, arch: process.arch, sanitized: verdict.sanitized,
  };
}
