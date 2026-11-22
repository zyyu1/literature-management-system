// Independent client process: reads one JSON command per stdin line, replies one JSON line.
import readline from 'node:readline';
import { createClient } from '../src/client.mjs';

const client = createClient({ apiUrl: process.env.API_URL, token: process.env.API_TOKEN });
let cachedRevision = null; // this client's own last-seen revision (no push/live sync)

const rl = readline.createInterface({ input: process.stdin });
for await (const line of rl) {
  const cmd = JSON.parse(line);
  let out;
  if (cmd.cmd === 'get') {
    out = await client.get(cmd.kind, cmd.id);
    if (out.status === 200) cachedRevision = out.data.revision;
  } else if (cmd.cmd === 'put') {
    out = await client.put(cmd.kind, cmd.id, cmd.record, cmd.revision ?? cachedRevision, cmd.operationId);
  } else if (cmd.cmd === 'cached') {
    out = { cachedRevision };
  }
  process.stdout.write(JSON.stringify({ pid: process.pid, name: process.env.CLIENT_NAME, ...out }) + '\n');
}
