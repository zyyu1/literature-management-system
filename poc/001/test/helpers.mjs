// Test harness for POC-001 LOCAL MOCK runs. All credentials are generated
// per run (random synthetic), never read from disk, never real.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createMockWebDav } from '../src/mock-webdav.mjs';
import { createWebDavAdapter } from '../src/webdav-adapter.mjs';
import { createSafeApi } from '../src/safe-api.mjs';
import { createClient } from '../src/client.mjs';
import { literatureId } from '../src/note-codec.mjs';
import { randomId } from '../src/util.mjs';

export const SRC = (f) => fileURLToPath(new URL(`../src/${f}`, import.meta.url));
export const HELPER = (f) => fileURLToPath(new URL(`./${f}`, import.meta.url));

export function syntheticSecrets() {
  return {
    davUser: `synthetic-user-${randomId(4)}`,
    davPass: `SYNTH-PASS-${randomId(12)}`,
    apiToken: `synthetic-token-${randomId(16)}`,
  };
}

export async function startStack({ namespace = 'poc-ns-a', timeoutMs = 800, maxLedgerEntries, extraTokens = 0 } = {}) {
  const secrets = syntheticSecrets();
  secrets.extraTokens = Array.from({ length: extraTokens }, () => `synthetic-token-${randomId(16)}`);
  const mock = createMockWebDav({ username: secrets.davUser, password: secrets.davPass });
  const dav = await mock.start();
  const logs = [];
  const adapter = createWebDavAdapter({ baseUrl: `${dav.url}/lms-poc`, username: secrets.davUser, password: secrets.davPass, timeoutMs });
  // base collection for the fixed basePath
  mock.collections.add('/lms-poc');
  const apiTokens = [secrets.apiToken, ...secrets.extraTokens];
  const api = createSafeApi({ adapter, namespace, apiTokens, allowedOrigins: ['http://127.0.0.1:5173'], log: (e) => logs.push(e), maxLedgerEntries });
  const apiInfo = await api.start();
  const client = createClient({ apiUrl: apiInfo.url, token: secrets.apiToken });
  const extraClients = secrets.extraTokens.map((token) => createClient({ apiUrl: apiInfo.url, token }));
  const instances = [api];
  return {
    secrets, mock, dav, adapter, api, apiUrl: apiInfo.url, client, extraClients, logs, namespace,
    /** Another independent API instance (fresh in-memory ledger) on the same storage, e.g. to simulate a restart. */
    async newInstance({ adapterOverride } = {}) {
      const a = adapterOverride ?? createWebDavAdapter({ baseUrl: `${dav.url}/lms-poc`, username: secrets.davUser, password: secrets.davPass, timeoutMs });
      const inst = createSafeApi({ adapter: a, namespace, apiTokens });
      const info = await inst.start();
      instances.push(inst);
      return { api: inst, url: info.url, client: createClient({ apiUrl: info.url, token: secrets.apiToken }) };
    },
    async stop() { for (const i of instances) await i.stop(); await mock.stop(); },
  };
}

/** Mock WebDAV + N independent safe-API processes + one independent client process per API. */
export async function startMultiProcessStack({ apis = 2, namespace = 'poc-ns-multi' } = {}) {
  const secrets = syntheticSecrets();
  const mock = createMockWebDav({ username: secrets.davUser, password: secrets.davPass });
  const dav = await mock.start();
  mock.collections.add('/lms-poc');
  const apiProcs = [];
  const clients = [];
  for (let i = 0; i < apis; i++) {
    const p = await spawnApiProcess({ davUrl: dav.url, secrets, namespace });
    apiProcs.push(p);
    clients.push(await spawnClientProcess({ apiUrl: p.url, token: secrets.apiToken, name: `client-${String.fromCharCode(65 + i)}` }));
  }
  return {
    secrets, mock, dav, apiProcs, clients, namespace,
    async stop() {
      for (const c of clients) await c.stop();
      for (const p of apiProcs) await p.stop();
      await mock.stop();
    },
  };
}

/** Separate OS process running the safe API, pointed at the shared mock. */
export async function spawnApiProcess({ davUrl, secrets, namespace, timeoutMs = 800 }) {
  const child = spawn(process.execPath, [SRC('api-main.mjs')], {
    env: {
      PATH: process.env.PATH,
      POC_UPSTREAM_URL: `${davUrl}/lms-poc`,
      POC_UPSTREAM_USER: secrets.davUser,
      POC_UPSTREAM_PASS: secrets.davPass,
      POC_API_TOKEN: secrets.apiToken,
      POC_NAMESPACE: namespace,
      POC_TIMEOUT_MS: String(timeoutMs),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stderr = [];
  child.stderr.on('data', (d) => stderr.push(d.toString()));
  const rl = readline.createInterface({ input: child.stdout });
  const [line] = await once(rl, 'line');
  const port = Number(/LISTENING (\d+)/.exec(line)[1]);
  return { child, url: `http://127.0.0.1:${port}`, stderr, async stop() { child.kill('SIGTERM'); await once(child, 'exit'); } };
}

/** Separate OS process acting as an independent client (own memory, own fetch stack). */
export async function spawnClientProcess({ apiUrl, token, name }) {
  const child = spawn(process.execPath, [HELPER('client-proc.mjs')], {
    env: { PATH: process.env.PATH, API_URL: apiUrl, API_TOKEN: token, CLIENT_NAME: name },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const rl = readline.createInterface({ input: child.stdout });
  const waiting = [];
  rl.on('line', (l) => waiting.shift()?.(JSON.parse(l)));
  return {
    pid: child.pid,
    send(cmd) { return new Promise((r) => { waiting.push(r); child.stdin.write(JSON.stringify(cmd) + '\n'); }); },
    async stop() { child.stdin.end(); await once(child, 'exit'); },
  };
}

let counter = 0;
/** Synthetic 8-char Zotero-shaped key; prefix 'S' marks it synthetic. */
export function syntheticItemKey(n = counter++) {
  return 'S' + n.toString(36).toUpperCase().padStart(7, '0');
}

/** Fully synthetic note: Unicode/Chinese, emoji, math, code, CRLF, NFD vs NFC, long text. */
export function syntheticNote(libraryId = 9000001, key = syntheticItemKey(), variant = 0) {
  const id = literatureId(libraryId, key);
  return {
    literatureId: id,
    question: `合成研究问题 #${variant}：如何在不确定性下学习策略？ 🤖 (synthetic, not real research)`,
    arguments: `## 小节标题在字段内\n- 论点 A：$\\pi^* = \\arg\\max_\\pi \\mathbb{E}[R]$\n- 论点 B\r\nCRLF line\r\n<!-- lms:field question bytes=1 --> marker look-alike\n${'长文本'.repeat(2000)}`,
    methods: '```python\nprint("合成代码块")\n```\n$$\\int_0^1 x^2\\,dx = \\tfrac13$$\n\tTab\tseparated',
    contributions: `NFC: \u00e9 vs NFD: e\u0301 · zero-width:[\u200b] · RTL: \u05e9\u05dc\u05d5\u05dd · surrogate: 𝔼`,
    limitations: variant % 2 ? '' : 'Trailing spaces   \nand no final newline',
  };
}
