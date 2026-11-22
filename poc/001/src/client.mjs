// "Browser-like" client: knows ONLY the safe API origin and its own session
// token. It has no WebDAV URL, username or password, and never could.
import crypto from 'node:crypto';

export function createClient({ apiUrl, token }) {
  async function call(method, path, { body, headers = {} } = {}) {
    const res = await fetch(apiUrl + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, headers: Object.fromEntries(res.headers), data };
  }
  return {
    newOperationId: () => crypto.randomUUID(),
    get: (kind, id) => call('GET', `/api/records/${kind}/${id}`),
    markdown: (kind, id) => call('GET', `/api/records/${kind}/${id}/markdown`),
    /** revision: etag string, or '*' to create-only. Always conditional. */
    put: (kind, id, record, revision, operationId = crypto.randomUUID()) =>
      call('PUT', `/api/records/${kind}/${id}`, {
        body: record,
        headers: { 'Operation-Id': operationId, ...(revision === '*' ? { 'If-None-Match': '*' } : { 'If-Match': revision }) },
      }),
    verify: (operationId) => call('GET', `/api/operations/${operationId}`),
    exportAll: () => call('GET', '/api/export'),
    restore: (bundle, targetNamespace) => call('POST', '/api/restore', { body: { bundle, targetNamespace } }),
    raw: call,
  };
}
