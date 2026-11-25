// D007-A60 / A61 / A62 — test-only cross-platform egress precondition (shared by the WP-01 and
// WP-02 suites). Read-only, fail-closed, Node builtins only, no product imports and no machine or
// network changes.
//
// Linux: keep the A54/A55 requirement that the kernel namespace exposes nothing but `lo` and that
// no proxy variable is inherited.
// Windows: read-only built-in Windows networking queries (Get-NetAdapter -IncludeHidden,
// Get-NetIPInterface, Get-NetIPAddress, Get-NetRoute) through an explicit trusted system executable.
// The classifier accepts ONLY a fully proven offline state and rejects every ambiguous input:
// unknown adapter state pairs, active paths (even without address or default route), contradictory
// adapter/IP state, orphan interfaces/routes, malformed or missing collections, unproven loopback
// identity, non-numeric/invalid IPv6 zones and family mismatches.
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
const REQUIRED_COLLECTIONS = Object.freeze(['adapters', 'ipInterfaces', 'addresses', 'defaultRoutes']);
const STATUS_ACTIVE = 'Up|Connected';
// Every other accepted pair must be an explicitly observed, unambiguous unavailable state.
const STATUS_UNAVAILABLE = new Set(Object.freeze([
  'Disconnected|Disconnected',
  'Disconnected|Unknown',
  'Not Present|Unknown',
]));
// Windows software loopback reports this sentinel MTU on its IP interfaces.
const LOOPBACK_MTU = 4294967295;

function fail(reason) {
  throw new Error(`EGRESS_PRECONDITION_FAILED: ${reason}`);
}
function isPositiveInt(v) {
  return Number.isInteger(v) && v > 0;
}
function isLoopbackAddress(ip) {
  return ip === '127.0.0.1' || ip === '::1' || /^127\./.test(ip);
}

// Strict IP normalisation. A zone is legal only as a single numeric suffix on a valid IPv6
// address; non-numeric, empty, multiple or IPv4 zones are malformed and never normalised away.
export function normalizeIp(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  if (raw.includes('%')) {
    const parts = raw.split('%');
    if (parts.length !== 2) return null;
    const [bare, zone] = parts;
    if (!/^\d+$/.test(zone)) return null;
    if (net.isIP(bare) !== 6) return null;
    return { ip: bare, family: 'IPv6' };
  }
  const family = net.isIP(raw);
  if (family === 4) return { ip: raw, family: 'IPv4' };
  if (family === 6) return { ip: raw, family: 'IPv6' };
  return null;
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
  if (!inv || typeof inv !== 'object' || Array.isArray(inv)) return { ok: false, reason: 'INVENTORY_MALFORMED' };
  for (const key of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(inv[key])) return { ok: false, reason: 'INVENTORY_MALFORMED' };
  }
  const { adapters, ipInterfaces, addresses, defaultRoutes } = inv;
  if (adapters.length === 0 || ipInterfaces.length === 0 || addresses.length === 0) {
    return { ok: false, reason: 'INVENTORY_EMPTY' };
  }

  const adapterByIndex = new Map();
  for (const a of adapters) {
    if (!a || !isPositiveInt(a.ifIndex) || typeof a.status !== 'string' || !a.status
      || typeof a.media !== 'string' || !a.media
      || typeof a.physicalMediaType !== 'string' || !a.physicalMediaType
      || typeof a.virtual !== 'boolean' || typeof a.hardwareInterface !== 'boolean'
      || typeof a.connectorPresent !== 'boolean'
      || !Number.isInteger(a.ndisPhysicalMedium) || a.ndisPhysicalMedium < 0) {
      return { ok: false, reason: 'INVENTORY_MALFORMED' };
    }
    if (adapterByIndex.has(a.ifIndex)) return { ok: false, reason: 'INVENTORY_AMBIGUOUS' };
    adapterByIndex.set(a.ifIndex, a);
  }

  // Positive OS identity for a non-IP hidden pseudo adapter (for example the WAN Miniports):
  // virtual, non-hardware, no connector, unspecified physical medium. This profile can never be
  // mistaken for a physical Ethernet/Wi-Fi path; it is accepted only when it also has no IP
  // interface rows, no address and no default route (so it cannot carry IP traffic).
  const isPseudoNonIpAdapter = (a) => a.virtual === true
    && a.hardwareInterface === false
    && a.connectorPresent === false
    && a.ndisPhysicalMedium === 0
    && a.physicalMediaType === 'Unspecified';

  const ipByKey = new Map();
  for (const row of ipInterfaces) {
    if (!row || !isPositiveInt(row.ifIndex) || (row.family !== 'IPv4' && row.family !== 'IPv6')
      || (row.state !== 'Connected' && row.state !== 'Disconnected')
      || !isPositiveInt(row.nlMtu)) return { ok: false, reason: 'INVENTORY_MALFORMED' };
    const key = `${row.ifIndex}/${row.family}`;
    if (ipByKey.has(key)) return { ok: false, reason: 'INVENTORY_AMBIGUOUS' };
    ipByKey.set(key, row);
  }
  const rowsFor = (index) => [...ipByKey.values()].filter((r) => r.ifIndex === index);

  const normalizedAddresses = [];
  for (const a of addresses) {
    if (!a || !isPositiveInt(a.ifIndex)) return { ok: false, reason: 'INVENTORY_MALFORMED' };
    const parsed = normalizeIp(a.ip);
    if (!parsed) return { ok: false, reason: 'INVENTORY_MALFORMED' };
    normalizedAddresses.push({ ifIndex: a.ifIndex, ip: parsed.ip, family: parsed.family });
  }

  const normalizedRoutes = [];
  for (const r of defaultRoutes) {
    if (!r || !isPositiveInt(r.ifIndex) || typeof r.dest !== 'string') return { ok: false, reason: 'INVENTORY_MALFORMED' };
    const family = r.dest === '0.0.0.0/0' ? 'IPv4' : r.dest === '::/0' ? 'IPv6' : null;
    if (!family) return { ok: false, reason: 'INVENTORY_MALFORMED' };
    normalizedRoutes.push({ ifIndex: r.ifIndex, family });
  }

  // Positive loopback identity: a real OS loopback interface is the index that is absent from
  // Get-NetAdapter, carries IPv4 127.0.0.1 with a Connected IPv4 row and the loopback sentinel MTU.
  const loopCandidates = new Set();
  for (const a of normalizedAddresses) {
    if (a.ip !== '127.0.0.1') continue;
    const row = ipByKey.get(`${a.ifIndex}/IPv4`);
    if (!row || row.state !== 'Connected') return { ok: false, reason: 'LOOPBACK_MISMATCH' };
    if (row.nlMtu !== LOOPBACK_MTU) return { ok: false, reason: 'LOOPBACK_MISMATCH' };
    if (adapterByIndex.has(a.ifIndex)) return { ok: false, reason: 'LOOPBACK_MISMATCH' };
    loopCandidates.add(a.ifIndex);
  }
  if (loopCandidates.size === 0) return { ok: false, reason: 'NO_LOOPBACK' };
  if (loopCandidates.size > 1) return { ok: false, reason: 'AMBIGUOUS_LOOPBACK' };
  const loopIndex = [...loopCandidates][0];
  for (const a of normalizedAddresses) {
    if (a.ifIndex !== loopIndex) {
      if (a.ip === '::1') return { ok: false, reason: 'LOOPBACK_MISMATCH' };
      continue;
    }
    if (!isLoopbackAddress(a.ip)) return { ok: false, reason: 'LOOPBACK_MISMATCH' };
  }
  for (const r of normalizedRoutes) {
    if (r.ifIndex === loopIndex) return { ok: false, reason: 'ROUTE_ON_LOOPBACK' };
  }

  // Family linkage: every address and default route must have a matching IP interface row.
  for (const a of normalizedAddresses) {
    if (!ipByKey.has(`${a.ifIndex}/${a.family}`)) return { ok: false, reason: 'FAMILY_LINKAGE' };
  }
  for (const r of normalizedRoutes) {
    if (!ipByKey.has(`${r.ifIndex}/${r.family}`)) return { ok: false, reason: 'FAMILY_LINKAGE' };
  }

  // Orphan IP rows: every IP interface must belong to a known adapter or the proven loopback.
  for (const row of ipInterfaces) {
    if (row.ifIndex === loopIndex) continue;
    if (!adapterByIndex.has(row.ifIndex)) return { ok: false, reason: 'ORPHAN_IP_ROW' };
  }

  // Adapter states: only an explicit allowlist is accepted; active paths are always refused, even
  // without an address or a default route; unavailable adapters must have no Connected IP row.
  let pseudoNonIpAdapters = 0;
  for (const adapter of adapters) {
    const pair = `${adapter.status}|${adapter.media}`;
    const rows = rowsFor(adapter.ifIndex);
    if (pair === STATUS_ACTIVE) {
      if (rows.length === 0) {
        if (isPseudoNonIpAdapter(adapter)) { pseudoNonIpAdapters += 1; continue; }
        return { ok: false, reason: 'ACTIVE_WITHOUT_IP_ROWS' };
      }
      if (!rows.every((r) => r.state === 'Connected')) return { ok: false, reason: 'INVENTORY_INCONSISTENT' };
      return { ok: false, reason: 'ACTIVE_PATH' };
    }
    if (!STATUS_UNAVAILABLE.has(pair)) return { ok: false, reason: 'UNKNOWN_ADAPTER_STATE' };
    if (rows.some((r) => r.state === 'Connected')) return { ok: false, reason: 'INVENTORY_INCONSISTENT' };
  }

  // Stale addresses and default routes are accepted only on positively unavailable adapters whose
  // matching-family rows exist and are all Disconnected.
  for (const a of normalizedAddresses) {
    if (a.ifIndex === loopIndex) continue;
    if (!adapterByIndex.has(a.ifIndex)) return { ok: false, reason: 'UNKNOWN_LINKAGE' };
  }
  for (const r of normalizedRoutes) {
    if (!adapterByIndex.has(r.ifIndex)) return { ok: false, reason: 'UNKNOWN_LINKAGE' };
    const rows = rowsFor(r.ifIndex);
    if (rows.length === 0) return { ok: false, reason: 'STALE_ROUTE_WITHOUT_PROOF' };
    if (rows.some((x) => x.state === 'Connected')) return { ok: false, reason: 'USABLE_DEFAULT_ROUTE' };
  }

  const states = {};
  for (const adapter of adapters) {
    const pair = `${adapter.status}|${adapter.media}`;
    states[pair] = (states[pair] || 0) + 1;
  }
  return {
    ok: true,
    reason: null,
    sanitized: {
      adapterCount: adapters.length,
      ipInterfaceCount: ipInterfaces.length,
      addressCount: addresses.length,
      defaultRouteCount: defaultRoutes.length,
      adapterStates: states,
      pseudoNonIpAdapters,
      loopbackIndex: loopIndex,
      staleDefaultRoutes: normalizedRoutes.length,
    },
  };
}

const PS_SCRIPT = [
  "$ErrorActionPreference='Stop'",
  "$adapters = @(Get-NetAdapter -IncludeHidden -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ ifIndex=[int]$_.ifIndex; status=[string]$_.Status; media=[string]$_.MediaConnectionState; physicalMediaType=[string]$_.PhysicalMediaType; virtual=[bool]$_.Virtual; hardwareInterface=[bool]$_.HardwareInterface; connectorPresent=[bool]$_.ConnectorPresent; ndisPhysicalMedium=[int]$_.NdisPhysicalMedium } })",
  "$ipInterfaces = @(Get-NetIPInterface -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ ifIndex=[int]$_.InterfaceIndex; family=[string]$_.AddressFamily; state=[string]$_.ConnectionState; nlMtu=[double]$_.NlMtu } })",
  "$addresses = @(Get-NetIPAddress -AddressFamily IPv4,IPv6 -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ ifIndex=[int]$_.InterfaceIndex; ip=[string]$_.IPAddress } })",
  "$defaultRoutes = @(Get-NetRoute -ErrorAction Stop | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' -or $_.DestinationPrefix -eq '::/0' } | ForEach-Object { [pscustomobject]@{ ifIndex=[int]$_.InterfaceIndex; dest=[string]$_.DestinationPrefix } })",
  "[pscustomobject]@{ adapters=$adapters; ipInterfaces=$ipInterfaces; addresses=$addresses; defaultRoutes=$defaultRoutes } | ConvertTo-Json -Depth 6 -Compress",
].join('; ');

function defaultPowerShellPath() {
  const root = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
  return path.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
}

// Read-only inventory. Resolves an explicit trusted system executable (never PATH), no profile, no
// elevation, bounded timeout. Required collections are never coerced: a missing/null/non-array
// collection is an incomplete or malformed query, not an empty list.
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
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'QUERY_MALFORMED' };
  for (const key of REQUIRED_COLLECTIONS) {
    if (!Object.hasOwn(parsed, key)) return { ok: false, reason: 'QUERY_INCOMPLETE' };
    if (!Array.isArray(parsed[key])) return { ok: false, reason: 'QUERY_INCOMPLETE' };
  }
  return {
    ok: true,
    reason: null,
    inventory: {
      adapters: parsed.adapters,
      ipInterfaces: parsed.ipInterfaces,
      addresses: parsed.addresses,
      defaultRoutes: parsed.defaultRoutes,
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
