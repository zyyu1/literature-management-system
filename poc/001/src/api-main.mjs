// Standalone safe-API process (used for multi-process tests).
// Configuration comes ONLY from environment variables set by the local test
// harness with SYNTHETIC values. Upstream must be loopback (enforced by adapter).
import { createWebDavAdapter } from './webdav-adapter.mjs';
import { createSafeApi } from './safe-api.mjs';

const env = process.env;
for (const k of ['POC_UPSTREAM_URL', 'POC_UPSTREAM_USER', 'POC_UPSTREAM_PASS', 'POC_API_TOKEN', 'POC_NAMESPACE']) {
  if (!env[k]) { console.error(`missing ${k}`); process.exit(2); }
}
const adapter = createWebDavAdapter({
  baseUrl: env.POC_UPSTREAM_URL,
  username: env.POC_UPSTREAM_USER,
  password: env.POC_UPSTREAM_PASS,
  timeoutMs: Number(env.POC_TIMEOUT_MS ?? 2000),
});
const api = createSafeApi({
  adapter,
  namespace: env.POC_NAMESPACE,
  apiTokens: [env.POC_API_TOKEN],
  log: (e) => process.stderr.write(JSON.stringify(e) + '\n'),
});
const { port } = await api.start();
process.stdout.write(`LISTENING ${port}\n`);
process.on('SIGTERM', async () => { await api.stop(); process.exit(0); });
