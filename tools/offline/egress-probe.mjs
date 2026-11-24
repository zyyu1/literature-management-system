// D007-A54 egress probe. Exit 0 only if loopback works AND every external attempt is refused.
import net from 'node:net';
import dns from 'node:dns/promises';
const out = [];
const tryConnect = (host, port) => new Promise((res) => {
  const s = net.connect({ host, port, timeout: 3000 });
  s.on('connect', () => { s.destroy(); res('CONNECTED'); });
  s.on('timeout', () => { s.destroy(); res('TIMEOUT'); });
  s.on('error', (e) => res(e.code || 'ERROR'));
});
const srv = net.createServer((c) => c.end()).listen(0, '127.0.0.1');
await new Promise((r) => srv.once('listening', r));
const lo = await tryConnect('127.0.0.1', srv.address().port);
srv.close();
out.push(['loopback 127.0.0.1', lo]);
for (const [h, p] of [['1.1.1.1', 443], ['8.8.8.8', 53], ['140.82.112.3', 443]]) out.push([`${h}:${p}`, await tryConnect(h, p)]);
let d; try { await dns.lookup('github.com'); d = 'RESOLVED'; } catch (e) { d = e.code || 'ERROR'; }
out.push(['dns github.com', d]);
for (const [k, v] of out) console.log(`${k.padEnd(22)} ${v}`);
const ok = lo === 'CONNECTED' && out.slice(1).every(([, v]) => v !== 'CONNECTED' && v !== 'RESOLVED');
console.log(ok ? 'EGRESS_PROBE=PASS (loopback ok, external denied)' : 'EGRESS_PROBE=FAIL');
process.exit(ok ? 0 : 1);
