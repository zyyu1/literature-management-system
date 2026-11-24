// REMEDIATION-08 (D007-A30) — TEST-ONLY local TLS fixtures. LOCAL / SYNTHETIC ONLY.
// Generates throw-away ECDSA P-256 CAs and server certificates with the system OpenSSL CLI inside a fresh
// os.tmpdir() directory, reads the PEM material into memory and deletes the directory before returning.
// No key or certificate is ever written into the repository, the evidence or a log. Nothing here talks to
// anything but 127.0.0.1. If the OpenSSL CLI is missing the TLS cases cannot run (they must not be skipped
// silently): `tlsFixtureAvailability()` reports it and the R08 tests fail with TLS_FIXTURE_UNAVAILABLE.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import https from 'node:https';
import crypto from 'node:crypto';

export function tlsFixtureAvailability() {
  const r = spawnSync('openssl', ['version'], { encoding: 'utf8' });
  return r.status === 0 ? { ok: true, openssl: r.stdout.trim(), nodeOpenssl: process.versions.openssl } : { ok: false, reason: 'TLS_FIXTURE_UNAVAILABLE: openssl CLI not found' };
}

function ossl(dir, args, input) {
  const r = spawnSync('openssl', args, { cwd: dir, encoding: 'utf8', input });
  if (r.status !== 0) throw new Error(`TLS_FIXTURE_UNAVAILABLE: openssl ${args[0]} failed: ${(r.stderr || '').split('\n')[0]}`);
  return r.stdout;
}

const GOOD_SAN = 'subjectAltName=IP:127.0.0.1,DNS:localhost,IP:::1';

/** All material lives in memory; the temp directory is removed before this function returns. */
export function generateTlsFixtures() {
  const avail = tlsFixtureAvailability();
  if (!avail.ok) throw new Error(avail.reason);
  const dir = mkdtempSync(join(tmpdir(), 'lms-r08-tls-'));
  try {
    const key = (name) => ossl(dir, ['genpkey', '-algorithm', 'EC', '-pkeyopt', 'ec_paramgen_curve:P-256', '-out', `${name}.key`]);
    const ca = (name, cn) => {
      key(name);
      ossl(dir, ['req', '-x509', '-new', '-key', `${name}.key`, '-subj', `/CN=${cn}`, '-days', '2', '-sha256',
        '-addext', 'basicConstraints=critical,CA:TRUE', '-addext', 'keyUsage=critical,keyCertSign,cRLSign', '-out', `${name}.crt`]);
    };
    const leaf = (name, caName, san) => {
      key(name);
      ossl(dir, ['req', '-new', '-key', `${name}.key`, '-subj', `/CN=lms-r08-${name}`, '-out', `${name}.csr`]);
      writeFileSync(join(dir, `${name}.ext`), `${san}\nbasicConstraints=CA:FALSE\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth\n`);
      ossl(dir, ['x509', '-req', '-in', `${name}.csr`, '-CA', `${caName}.crt`, '-CAkey', `${caName}.key`, '-CAcreateserial',
        '-days', '2', '-sha256', '-extfile', `${name}.ext`, '-out', `${name}.crt`]);
    };
    // Expired leaf signed by the GOOD CA: `openssl ca` is the only OpenSSL 3.0 CLI that sets arbitrary dates.
    const expiredLeaf = (name, caName) => {
      key(name);
      ossl(dir, ['req', '-new', '-key', `${name}.key`, '-subj', `/CN=lms-r08-${name}`, '-out', `${name}.csr`]);
      writeFileSync(join(dir, 'index.txt'), '');
      writeFileSync(join(dir, 'serial'), '1000\n');
      writeFileSync(join(dir, 'ca.cnf'), [
        '[ca]', 'default_ca=d', '[d]', 'dir=.', 'database=index.txt', 'serial=serial', 'new_certs_dir=.',
        `certificate=${caName}.crt`, `private_key=${caName}.key`, 'default_md=sha256', 'policy=p', 'unique_subject=no', 'copy_extensions=none',
        'x509_extensions=x', '[p]', 'commonName=supplied', '[x]', GOOD_SAN.replace('=', ' = '), 'basicConstraints=CA:FALSE', 'extendedKeyUsage=serverAuth', '',
      ].join('\n'));
      ossl(dir, ['ca', '-batch', '-config', 'ca.cnf', '-notext', '-in', `${name}.csr`, '-startdate', '20200101000000Z', '-enddate', '20200102000000Z', '-out', `${name}.crt`]);
    };
    ca('ca-good', 'LMS R08 synthetic test CA (good)');
    ca('ca-other', 'LMS R08 synthetic test CA (other)');
    leaf('srv-good', 'ca-good', GOOD_SAN);
    leaf('srv-wrong-ca', 'ca-other', GOOD_SAN);
    leaf('srv-wrong-san', 'ca-good', 'subjectAltName=DNS:wrong-name.invalid');
    expiredLeaf('srv-expired', 'ca-good');
    // Self-signed leaf carrying the right SAN: untrusted because no CA vouches for it.
    key('srv-self');
    ossl(dir, ['req', '-x509', '-new', '-key', 'srv-self.key', '-subj', '/CN=lms-r08-self', '-days', '2', '-sha256', '-addext', GOOD_SAN, '-out', 'srv-self.crt']);
    const rd = (f) => readFileSync(join(dir, f), 'utf8');
    const pair = (n) => ({ key: rd(`${n}.key`), cert: rd(`${n}.crt`) });
    const out = {
      caGood: rd('ca-good.crt'),
      caOther: rd('ca-other.crt'),
      good: pair('srv-good'),
      wrongCa: pair('srv-wrong-ca'),
      wrongSan: pair('srv-wrong-san'),
      expired: pair('srv-expired'),
      selfSigned: pair('srv-self'),
    };
    // Non-sensitive metadata only (for evidence): subject, validity, SAN, fingerprint — never key material.
    out.metadata = Object.fromEntries(['good', 'wrongCa', 'wrongSan', 'expired', 'selfSigned'].map((n) => {
      const c = new crypto.X509Certificate(out[n].cert);
      return [n, { subject: c.subject, issuer: c.issuer, validFrom: c.validFrom, validTo: c.validTo, san: c.subjectAltName, sha256: c.fingerprint256 }];
    }));
    out.tool = avail;
    return out;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * TLS-terminating loopback front for the in-repo mock: decrypts and forwards to `backendPort`.
 * Counts TCP accepts, failed handshakes and decrypted application bytes, so a test can prove that an
 * invalid peer received a TLS handshake but NO application request (no request line, no Authorization).
 */
export async function startTlsFront({ key, cert, backendPort }) {
  const stats = { tcp: 0, handshakes: 0, clientErrors: 0, appBytes: 0, firstLines: [] };
  const sockets = new Set();
  const server = tls.createServer({ key, cert, minVersion: 'TLSv1.2' }, (clear) => {
    stats.handshakes++;
    sockets.add(clear);
    const up = net.connect(backendPort, '127.0.0.1');
    sockets.add(up);
    clear.on('data', (d) => {
      if (stats.appBytes === 0) stats.firstLines.push(d.toString('latin1').split('\r\n')[0]);
      stats.appBytes += d.length;
    });
    clear.pipe(up).pipe(clear);
    const end = () => { clear.destroy(); up.destroy(); };
    clear.on('error', end); up.on('error', end); clear.on('close', end); up.on('close', end);
  });
  server.on('connection', (s) => { stats.tcp++; sockets.add(s); });
  server.on('tlsClientError', () => { stats.clientErrors++; });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return {
    port: server.address().port,
    stats,
    async stop() { for (const s of sockets) s.destroy(); await new Promise((r) => server.close(r)); },
  };
}

/** HTTPS server with a VALID certificate that answers every request with a redirect (downgrade / cross-host). */
export async function startRedirector({ key, cert, location, status = 307 }) {
  const seen = [];
  const server = https.createServer({ key, cert }, (req, res) => {
    seen.push({ method: req.method, url: req.url, hasAuthorization: !!req.headers.authorization });
    req.resume();
    res.writeHead(status, { Location: location, 'Content-Length': 0 });
    res.end();
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { port: server.address().port, seen, async stop() { server.closeAllConnections(); await new Promise((r) => server.close(r)); } };
}
