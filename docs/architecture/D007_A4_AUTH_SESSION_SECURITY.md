# D007-A4 — API-managed Authentication, Session and Cross-Origin Security Contract

**Decision:** D007-A4, **Option B**, approved by the user on **2026-11-23 (Europe/Berlin)**.  
**Decision type:** **DESIGN APPROVED — provider-neutral security and interaction contract only**.  
**Scope:** D007-A1 independent static frontend + lightweight secure API, D007-A3 conditional supplier ranking and frozen Module 002 user experience.  
**Not authorized:** choosing identity/hosting vendor, OAuth deployment, cloud accounts, domains, billing, live Nutstore/Zotero access, production user accounts, implementation code, CI/QA pass, or any expansion of the POC-001 isolated synthetic execution scope.  
**Conformance evidence:** NOT RUN. Exact browser/auth infrastructure and session-store architecture are still unselected.

## 1. Approved login and trust model (Option B)

The browser holds **only an opaque, API-issued, host-bound protected session cookie**, not a WebDAV password, Zotero credential, access token in `localStorage`, or a reusable session bearer embedded in frontend JavaScript. The independently deployable **API is responsible for creating, validating, rotating, revoking and expiring** sessions after authenticating a user via an approved identity proof. API middleware and each protected handler enforce authentication and **resource/operation-level authorization**. The frontend renders login/logout and session-expired UX; it cannot decide access rights.

The underlying **identity proof mechanism is not selected by this decision**: a later approved identity option might use a standards-based provider/OIDC exchange handled server-side, or an equivalently reviewed mechanism. Do **not** implement ad hoc password storage, assume a particular hosted identity provider, or conflate login with authorization. Authorization is scoped to the actual user, Zotero library permissions, website Projects, canonical-paper associations, global note status/quote ownership and read-only integration clients.

```text
Browser on approved HTTPS app origin
  | login user flow → independently authorized identity verification
  | authenticated API requests (session cookie auto-attached by browser)
  v
HTTPS independent API at a separately authorized origin
  | issue/verify/rotate/revoke opaque session ID
  | CSRF + Origin/Fetch Metadata + CORS and request-shape checks
  | enforce server-side user / Project / object / operation permissions
  | fail closed on session store, remote-identity, revision or scope uncertainty
  +--> Zotero Web API (separately authorized integration and upstream credentials)
  +--> Website-owned data adapter (candidate Nutstore only if POC passes)
  
Personal Workspace client → separate authenticated READ-ONLY API contract
  (no browser session sharing, no write privileges, no secret-bearing deep links)
```

## 2. Session cookie and server-side session lifecycle

| Boundary | Normative approved rule | Remaining implementation/proof choice |
| --- | --- | --- |
| Cookie confidentiality | Opaque unpredictable identifier generated with cryptographic randomness; `HttpOnly`, `Secure`, `Path=/`, and a narrowly appropriate `SameSite` attribute. Prefer a `__Host-` **host-only** cookie on API origin (no `Domain`, secure, root path). Browser JS cannot read/modify the cookie. Do not put usernames, Zotero access tokens, WebDAV secrets or note text in it. | Cookie name, precise lifetime and session-signing/ID persistence library pending |
| Same-site default | Prefer an **HTTPS same-site arrangement**, e.g. two approved subdomains under one registrable domain, with the session cookie **host-only to the API hostname**. `SameSite=Lax` is an initial candidate for this topology and must be penetration/browser-tested; `Strict` may be reviewed if functional redirects permit. *Same-site is not the same as same-origin*, so cross-origin API calls still need explicit CORS and fetch credentials policy. | No domain registration, DNS config, cross-origin reverse proxy or identity vendor selected |
| Cross-site exception | Browser on default `.pages.dev` ↔ API `.onrender.com` is **cross-site**; cookie-based session may need `SameSite=None; Secure`, but third-party cookie restrictions can block it (especially Safari/iOS). Do not depend on `None` as a guaranteed workaround or weaken CSRF. Prefer later approved same-site custom-domain or same-origin routing design; otherwise return for a new Design decision and explicit device-proof gates. | Actual domain/route, Safari ITP and Firefox/Chrome/Android policy to validate |
| Session record | Session IDs map server-side to authenticated identity, creation/expiry, revocation and minimal device/session metadata. Cache-only, per-instance memory, browser storage and the **unproven Nutstore WebDAV account** cannot be assumed to provide authoritative multi-instance session state. | A separately reviewed stable, revocable, secure session-state mechanism; does not automatically authorize Redis, KV, DB or provider |
| Rotation and expiry | Issue a fresh session after login; rotate after authentication/privilege elevation or suspected fixation; invalidate old identifiers. Set explicit bounded **idle** and **absolute** expiry, server-enforced on every request, not merely cookie max age. Fail closed after expiration, revocation or unavailable authoritative session record. | Numeric idle/absolute limits, reauthentication policy and any remember-device mode require later security selection and tests |
| Logout and device control | Current-device logout immediately invalidates its session server-side; user may list/identify and revoke other active-device sessions after suitable reauthentication, with minimal privacy-safe metadata. Revoked sessions must be rejected across API instances without waiting for browser cookie expiry. | Session-store reliability, remote revoke latency, all-device vs one-device UX and concurrent in-flight write semantics require testing |
| Error/recovery | `401` (not authenticated), `403` (authenticated but not authorized), CSRF rejection and transient `5xx` receive distinct, neutral user-facing feedback; never reveal whether another user's private object exists. On re-login, preserve unsynced local note drafts through the existing guarded recovery UX, not automatic resubmission or false Saved. | Precise error envelope versioning deferred to D007-A5 |

Session invalidation must not incorrectly treat an **already dispatched** mutation as canceled or failed; on ambiguous acknowledgment, preserve **UNKNOWN / verify authoritative state** with original request identity, source history and draft safeguards. Re-authentication alone must not replay a previously sent destructive request.

## 3. CSRF, CORS, Origin and browser security

1. **CSRF protection required independently of SameSite:** all state-changing cookie-authenticated operations (including logout, unlink, batch writes, note Save Now/autosave, quote Relink and administrative session revoke) require a session-bound anti-CSRF token (synchronizer or reviewed signed double-submit scheme) delivered only to the authorized frontend and validated server-side. Validate `Origin` or appropriately `Referer` with a strict list and use Fetch Metadata (`Sec-Fetch-*`) to reject unsolicited cross-site requests when supported; header absence on supported legacy clients follows a documented fail-closed/reviewed policy. Do not treat `SameSite` or CORS as sole CSRF control.
2. **Credentialed CORS:** allow **exactly enumerated HTTPS frontend origins** (scheme, host and port), not wildcard origins or broad subdomain patterns; do not reflect arbitrary request `Origin`. For authorized cross-origin responses with cookies, send an exact `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`, proper `Vary: Origin`, narrow methods/headers, and correctly handle preflight. Frontend uses credentials-aware requests only to the intended API; CORS controls browser readability, **not** backend authorization. Unapproved origin/host/redirect receives no credentialed access.
3. **CSP and output security:** frontend uses a restrictive Content Security Policy, contextual output escaping, safe Markdown rendering/sanitization, no inline/unreviewed third-party scripts and no secrets in HTML, bundles, URLs, browser logs, error payloads, referrers or analytics. Review XSS because a same-site compromised sibling origin can undermine SameSite-only assumptions. HTTPS, modern headers and strict redirect origins are required; exact CSP directives remain platform/test dependent.
4. **Endpoint hardening:** API verifies content type, method, CSRF token, session, resource rights, input shape, file path and limits at runtime; reject unsafe redirects, untrusted arbitrary remote URLs/SSRF, overly permissive CORS, unbounded request bodies and sensitive debug endpoints. Use separated rate limits and privacy-preserving audit. Authentication and resource authorization must cover read **and** write endpoints, with no IDOR via guessed Project/paper/source IDs.

## 4. Resource-level permission and data authority matrix

| Resource/request | Who may access | Server rule |
| --- | --- | --- |
| Website Projects, memberships/associations, Project-scoped Important | Authenticated authorized owner/member as later product policy permits | Check caller identity and Project membership + write scope **per request**, not frontend-hidden controls |
| Canonical literature global three-state Reading Status and shared five-field Research Note | Authenticated user with rights to that Zotero/library item's global website-owned record | Resolve canonical paper ID, deny cross-user/cross-library data leaks, enforce whole-note revision and acknowledged write semantics |
| Quote excerpt, comment and source association/history | Same authorized user/resource boundary, explicit guarded Relink | Write only website-owned association on confirmed revision-safe persistence; never mutate original Zotero PDF/highlight |
| Zotero bibliographic/annotation upstream data | API acting on user's **separately authorized** Zotero identity/scopes; user-triggered device links as supported | Minimum permissions; secure token handling; no unsolicited library export or browser token leak; actual API ability unverified |
| Candidate second Nutstore account | **No current live permission**; future approved server-side adapter only | No browser WebDAV access. POC-001 local-only permission remains unchanged; real credentials/access BLOCKED until ACCESS-02 |
| Session listing/revoke | Current authenticated principal, optionally fresh identity proof before sensitive revocation | No other user's sessions; revoke authoritative state, redact device identifiers/audit logs |
| **Personal Workspace D006** | Separately authenticated client restricted to owner's intended projected metadata | **Read-only** projection and deep link only: no note, Important, quote, Project mutation, user session impersonation or account-wide export; deny all write verbs and unauthorized object selectors |

No raw Zotero token, WebDAV application password, unrestricted upstream URL, global session cookie or write-capable API credential may be shared with Personal Workspace. A deep link conveys **only a navigational identifier** with the destination enforcing authentication/authorization; no session token in query/path/hash.

## 5. Multi-device revocation, unknown writes and privacy

- **Independent device sessions:** desktop, iPad, iPhone and Android may each use a separate revocable session; revoking device A does not silently delete drafts on device B, mutate confirmed note status, or invalidate other sessions unless the user explicitly chooses all-device logout. Session lists expose only necessary, coarse device/activity information.
- **Revocation semantics:** after authoritative revoke/expiration, new protected API requests under the revoked session must receive `401` and no data. Any in-flight mutation with uncertain acknowledgment remains an *operation-state* unknown, not assumed canceled by revoke. It must be reconciled via a newly authorized session without blind retry.
- **Storage dependency:** if the chosen deployment cannot maintain server-side revocation across API instances/process restarts, **STOP**; do not silently replace it with stateless long-lived browser Bearer tokens. A separate decision is needed for specific session-store architecture, data retention and backup.
- **Logs:** record nonsecret correlation IDs, opaque pseudonymous session identifiers (prefer hashed/truncated for diagnostics), error classes and authorization audit, never raw Cookie, CSRF secret, upstream credentials, PDF data or full note content. Revoke/rotate compromised material by separate secure process.

## 6. Browser and security acceptance plan (NOT RUN)

| Test ID | Future verification and expected behavior | Gate |
| --- | --- | --- |
| **A4-01** | Cookie on approved API host is `HttpOnly; Secure`, host-only/no Domain, correct Path/SameSite; not visible to JS or other subdomains | P0 if session exposed or domain-widened without approval |
| **A4-02** | Same-site HTTPS frontend/API separate origins with credentialed CORS, exact allowlist and `Vary: Origin`; preflight and no wildcard with credentials | P0 if untrusted origin gains private data |
| **A4-03** | Deliberate cross-site default Pages↔Render hostname test in Safari/iOS, iPadOS, Android Chrome, Firefox/desktop; no assumed third-party Cookie reliability | BLOCKED until real domain/provider browser setup is authorized |
| **A4-04** | CSRF token+Origin/Fetch Metadata block forged cross-site POST/PUT/PATCH/DELETE, including logout, unlink, note writes and source Relink | P0 if forgery can mutate user data |
| **A4-05** | Unauthenticated/unauthorized Project/paper/quote IDs and Personal Workspace write attempts rejected without object existence leak | P0 if cross-user access or workspace write succeeds |
| **A4-06** | Log in/out, fixation resistance, ID rotation, idle/absolute expiry and server-side one-device/all-device revocation under multiple API instances | P0 if revoked/expired session remains authorized |
| **A4-07** | During login expiry, reauth, revocation, timeout and unknown Saved, preserve unsynced note draft and operation identity; never auto-retry or false Save | P0 for lost/overwritten data or false confirmed save |
| **A4-08** | TLS, secrets/log redaction, CSP/XSS and redirect/SSRF/path restrictions; run keyboard/screen-reader session-expired UX across devices | P0 for secret/data exposure; P1 for blocked critical accessible session flow |

**Evidence required later:** independently authorized implementation/test scope, exact PR SHA, browser/OS/device versions and origin topology, reproducible synthetic fixtures, negative checks, expected vs actual, sanitized logs and independent QA disposition. A design approval is **not** a pass result or an instruction to provision a session store or identity provider.

## 7. Deferred decisions and next step

- Identity provider/OIDC exchange, account lifecycle, initial user provisioning and recovery, session storage and numeric timeout thresholds remain **UNSELECTED**. No provider, key management product, custom domain, TLS certificate, DNS, Redis/SQL/KV session database or billable cloud service is approved by D007-A4.
- Actual Render Frankfurt or Workers host runtime and browser Cookie compatibility remain conditional on D007-A3's gated supplier path and separate POC-001 storage evidence. No cloud/WebDAV live test, account signup, app code or UI change follows automatically.
- **Next proposed independent architecture decision:** **D007-A5 — provider-neutral API contract, endpoint authorization, revision/acknowledgment and error envelope design** for Projects, status, Note and Key Quote; **design-only** without implementing backend or changing POC scope.

## 8. Security reference basis (checked 2026-11-23)

- MDN, HTTP Cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
- MDN, Set-Cookie and host-only cookie prefix: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie
- MDN, credentialed CORS behavior: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- MDN, third-party Cookie constraints: https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies
- OWASP, CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP, Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
