# D007-A14 — HTTPS Same-Site Origin and Cookie Compatibility Contract

**Decision:** **D007-A14 Option B APPROVED**, user authorization **2026-11-23 (Europe/Berlin)**.  
**Classification:** **BROWSER-ORIGIN / SESSION DELIVERY ARCHITECTURE DESIGN ONLY — NO DOMAIN, DNS, PROXY, COOKIE SERVER, CLOUD ACCOUNT, CODE OR TEST EXECUTED**.  
**Chosen logical direction:** independent static frontend and safe API on **two HTTPS origins sharing one schemeful registrable site**, with a **separately qualified same-origin reverse-proxy fallback** if real browser QA identifies incompatible or unreliable session behavior. Example placeholders: `https://app.example.com`, `https://api.example.com`; **no domain has been selected, registered or provisioned**.  
**Governing decisions:** [D007-A1 frontend/API split](D007_A1_LOGICAL_DEPLOYMENT.md), [D007-A3 conditional hosting](D007_A3_CONDITIONAL_PROVIDER_PREFERENCE.md), [D007-A4 API-managed opaque sessions](D007_A4_AUTH_SESSION_SECURITY.md), [D007-A5 mutation and UNKNOWN contract](D007_A5_API_CONTRACT.md), [D007-A7 draft/privacy lifecycle](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [D007-A9 QA gates](D007_A9_QA_FRAMEWORK.md), [D007-A10 separate execution work packages](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), [D007-A11 operations STOP](D007_A11_OPERATIONS_RUNBOOK.md), [D007-A13 environment and secret isolation](D007_A13_ENVIRONMENT_ISOLATION.md).  
**Frozen UI:** [Module 002 67 decisions, 26 U6 scenarios](../ui/002/DESIGN_APPROVED.md) **unchanged / NOT RUN**.  
**Independent ongoing POC:** [POC-001 REMEDIATION-02](../handoffs/POC-001/REMEDIATION_02.md) is **only local/mock remediation**, same `exec/POC-001-webdav-feasibility` branch, original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, same path allowlist and **NO REBASE**. Second QA at PR #2 `2806d9d08dcec78e974703a82a38a696ae76d132` reported **LOCAL_STAGE PARTIAL**; real Nutstore **ACCESS-02 BLOCKED**, PR #2 not authorized for merge.  
**No authority:** no code execution, actual browser/device test, real login, real cookie/session issued, host/DNS/TLS/proxy configuration, cloud signup, purchase, identity-provider choice, Zotero/Nutstore access or deployment.

## 1. Schemeful same-site is NOT same-origin

An **origin** is scheme + host + port. A **schemeful site** is scheme + registrable domain (with public suffix processing, not naive substring matching), and includes sibling subdomains. These are logically distinct browser security concepts.

| Browser front end | API destination | Origin relation | Site relation | Cookie / request consequence |
| --- | --- | --- | --- | --- |
| `https://app.example.com` | `https://api.example.com` | **Cross-origin** | **Same-site** (both HTTPS under `example.com`) | A host-only API cookie can accompany eligible browser requests to the API **when credentials mode is include**, but response access still requires accurate credentialed **CORS** and CSRF protection |
| `https://app.example.com` | `https://app.example.com/api/...` | **Same-origin** | **Same-site** | Browser default same-origin credential behavior works, with proxy/backend authorization and CSRF controls still required |
| `https://site.pages.dev` | `https://service.onrender.com` | **Cross-origin** | **Cross-site** | `SameSite=Lax` generally will not accompany subresource/fetch requests; `SameSite=None; Secure` might be required but can still be blocked by browser **third-party-cookie prevention** |
| `http://app.example.com` | `https://api.example.com` | Cross-origin | **Cross-site under schemeful rules** | No HTTP production frontend; do not interpret a shared eTLD+1 as sufficient without HTTPS scheme match |
| `https://app.example.com:8443` | `https://api.example.com:443` | Cross-origin | Same-site | Port affects **origin** and exact CORS comparison, not the registrable site; production origins and ports remain unselected |

Examples use reserved illustrative names; **no DNS validation has happened**. CORS is a response access mechanism and must not be represented as the sole authorization or CSRF barrier. Same-site subdomain compromise may still initiate requests with ambient site cookies.

**Decision B boundary:** Prefer HTTPS sibling origins with a controlled registrable domain, but do not claim all browsers, embedded browsers or managed devices will transmit/persist cookies until measured. Do **not** choose a production domain or certificate here. Cross-site provider-default origins are a diagnostic/nonpreferred candidate, **not** a pre-approved production fallback.

## 2. Opaque API-managed, host-only session cookie

**Preferred candidate on direct API origin (illustration only):**

~~~http
Set-Cookie: __Host-lms_session=<opaque-session-id>; Path=/; Secure; HttpOnly; SameSite=Lax
~~~

- Issued by the approved API hostname over verified HTTPS **after an independently authorized login**. The cookie name and lifetime values are illustrative; no real session or identity provider exists.
- **No `Domain`** (host-only), `Path=/`, `Secure`, `HttpOnly`, and the `__Host-` prefix constraints. A cookie from `api.example.com` is sent only to the correct API host, not to `app.example.com` or unrelated sibling domains. Host-only does **not** make other same-site subdomains harmless; XSS/subdomain takeover and same-site request forgery remain distinct risks.
- `SameSite=Lax` is the **first candidate for same-site sibling HTTPS origins**, not a browser-tested decision. `Strict` is a conditional hardening candidate with navigation/login recovery trade-offs; `None; Secure` is **not** the default and does not guarantee cross-site browser support. No general “turn off Safari tracking prevention” instruction or third-party cookie exemption is an accepted fix.
- Session ID is an unpredictable opaque handle mapped to a **server-authoritative** Session record, with real rotation, expiry, per-device revocation and authorization from D007-A4. Do not put Zotero API tokens, WebDAV secrets or Session bearer tokens in static JS, `localStorage`, URLs, PDF deep links, diagnostic logs or exported Markdown.
- **Do not decide numeric `Max-Age` / `Expires` here**. Later decide bounded idle + absolute server expiry (and matching browser retention) under A4/A7, with privacy and independent QA evidence. Clear Cookie using a matching host/name/path in a reviewed flow and **revoke server-side first**; deleting the browser cookie alone is not logout.

**Fallback cookie host changes:** If `https://app.example.com/api` is used for same-origin routing, the browser sees the response as originating on **`app.example.com`**, not `api.example.com`. The `__Host-` cookie is accordingly host-only to `app.example.com`; an API-host-issued cookie must **not** be assumed available or transparently transferable. A future fallback migration must explicitly approve host/name/session continuity, logout/re-authentication policy, CSRF token issuer, origin allowlist, cache and rollback. Preserve local drafts and no blind write replay during migration.

## 3. Credentialed Fetch and exact-origin CORS contract

For the direct **cross-origin / same-site** option, use an explicitly reviewed browser client contract (illustrative):

~~~js
fetch("https://api.example.com/api/v1/papers", {
  method: "GET",
  credentials: "include"
});
~~~

- `credentials: "include"` is necessary for cross-origin cookie transport and eligible `Set-Cookie` processing; it **does not override** `SameSite`, browser privacy rules, server-side auth, an expired Session or an incorrect Cookie host.
- Exact allowlist of approved **scheme + host + port** origins, per environment; send `Access-Control-Allow-Origin: https://app.example.com` (never `*` with credentials), `Access-Control-Allow-Credentials: true`, `Vary: Origin`; validate request `Origin` and response cache policy. No suffix wildcards, broad `*.example.com` trust, dynamic reflection of arbitrary Origin or unreviewed null-origin permission.
- Preflight OPTIONS responses must validate permitted method/headers and exact Origin, but browser preflight requests themselves do **not** carry the application's Cookie credentials as a substitute for auth. Actual method request still requires Session + authorization + CSRF. Do not redirect a preflight to a login page or issue permissive fallback headers for an unauthorized Origin.
- Private Session/Note/Quote/API data: `Cache-Control: no-store` (where appropriate), CDN bypass for private responses and authentication paths, conservative referrer policy and privacy-safe logging. Public static assets may be cached separately without any credentials.
- A cross-origin preflight failure, blocked Cookie, 401/403, 429 or network error is not proof an already dispatched mutation failed. D007-A5 `UNKNOWN` and last-confirmed-data rules remain authoritative.

**Important:** CORS restricts which other origins can read responses in compliant browsers; CORS alone does **not** stop an attacker from causing a state-changing request. A4's CSRF and object-level authorization remain mandatory.

## 4. CSRF, Origin, Fetch Metadata and subdomain threat model

- Require a **session-bound anti-CSRF token** for **all cookie-authenticated unsafe mutations**, including login/logout where applicable, Project archive/delete/Unlink, ReadingStatus/Important, Note save/autosave, Quote Relink and session/device revocation. Use a reviewed synchronizer token or cryptographically bound signed double-submit method; no unauthenticated cross-origin token leakage or token in URLs/logs.
- Validate `Origin` against the exact approved frontend origin for unsafe browser requests, with a deliberately documented trusted-server exception only if needed. Missing/`null`/unapproved Origin and unexpected cross-site `Sec-Fetch-Site` are denied or explicitly escalated; do not automatically trust `same-site` from any sibling subdomain. `Sec-Fetch-Mode`, `Sec-Fetch-Dest` and other Fetch Metadata may supplement, **never replace**, Session-bound CSRF and authorization.
- `Origin`, `Host`, `Forwarded` and `X-Forwarded-*` headers must not be accepted as an arbitrary attacker-controlled description of the trusted deployment. Proxy-trust and canonical external origin are fixed by reviewed config. A DNS rebinding, sibling-subdomain takeover or unapproved CNAME cannot expand the allowlist.
- No state-changing GET or dangerous side effect through read endpoints, preload/prefetch or external navigation; forbid open redirects/SSRF. Separate Zotero `zotero://` destination links from authentication authority, never include Session/Cookie/CSRF tokens in any deep link.
- Require CSP and robust Markdown escaping/sanitization per frozen UI and A4. Same-site policy does not defend against malicious scripts on the frontend itself. Personal Workspace client is a **separately authorized read-only** view; it cannot gain mutation rights by being same-site or forwarding an API origin.
- Any CSRF denial must not delete unsynced local drafts or prematurely mark an in-flight write `DEFINITE_FAILURE` unless server dispatch was provably absent.

**Security STOP:** any authenticated cross-user read/write, forged unsafe action accepted from an unapproved origin, cookie exposed to JS/sibling host, production Origin/Session trusted in QA, or secret in URL/log is P0 under A9/A11.

## 5. Login, logout, Session expiry and UNKNOWN recovery — no UI amendments

| Browser/API event | Required future behavior, preserving Module 002 |
| --- | --- |
| First login | If later approved identity flow succeeds, API creates fresh opaque Session and independent CSRF context. Sign-in method, OIDC redirect/callback and account recovery provider are **not chosen** here; redirect URI must exactly match the environment's canonical origin when decided |
| Refresh / deep link / background return | Browser sends eligible host-bound Cookie to API; server validates Session and owner/project rights each request. Cache cannot substitute for a revoked Session. Do not treat session validity inferred from static frontend rendering |
| Logout on device A | Authenticated unsafe request with CSRF and exact Origin revokes device A **server-side**, clears matching Cookie; device B remains independent unless user explicitly revokes it. A logout response lost on network requires confirmation or safe re-authentication, not an assumption |
| Revoked or idle/absolute expired Session | API distinguishes `401` from authorization `403` and temporary `5xx`/offline. Browser may offer explicit re-login; **no automatic draft discard**, no credential reuse from other environment and no implicit replay of pending writes |
| Note Save Now/autosave in flight when Session changes | Persist original protected `operationId`, note revision and local draft. If dispatch/commit may have occurred, preserve `UNKNOWN` regardless of subsequent `401` or successful re-login; require authoritative safe resolution per A5/POC gates |
| Conflict or foreign Project access | `409/412` maps to conflict/review; true unauthorized access maps to 403 with no leak about another user's object; no hidden last-write-wins or changes to Original Zotero annotation |
| Session/domain topology migration | Reevaluate host-only Cookie issuance, the user's current/revoked Sessions and CSRF tokens, protected local draft lifecycle, provenance and new origin. Migration is a separate later approved release action, not a forced unreviewed global logout |

A4 identity vendor/Session store is still **UNSELECTED**. Cookie/session mechanics above are **normative future tests, not implemented or observed outcomes**.

## 6. Same-origin reverse-proxy fallback: independently qualified option

**Fallback conceptual route:** `https://app.example.com/api/*` terminates HTTPS at an authorized frontend edge/proxy and forwards restricted paths to a separately deployed safe API. The public browser sees a **single origin**, preserving the independently deployable API as a backend component.

Approval prerequisites for any future fallback implementation:
1. **Separate user/Design authorization** for edge/proxy/route service, origin/DNS/TLS, branch and exact file allowlist; no reverse proxy is authorized today.
2. TLS and exact path/method allowlisting from browser to proxy and proxy to API; reject unexpected redirects, avoid HTTPS→HTTP credential downgrade, block open-proxy/SSRF and sanitize forwarded host/origin/proto/client headers. Proxy is not a new unrestricted API endpoint.
3. `Set-Cookie` semantics must be reviewed with the **public same-origin Host**. Maintain `__Host-` no-`Domain` Root Path/Secure/HttpOnly and server Session revocation, but recognize a cookie previously bound to `api.example.com` **cannot simply be sent** to `app.example.com`. Require a separate safe re-authentication/session transition plan.
4. CSRF origin checks now compare against reviewed **same-origin public frontend host**. Exact API authZ, CSRF token, Fetch Metadata, request methods, protected operations and D007-A5 outcomes **must not be relaxed** because CORS may be unnecessary for same-origin browser calls.
5. No proxy caching of authenticated/private API responses; no exposure of backend secrets, raw Note/Quote/annotation contents or Cookie headers to public logs/CDN, and no foreign environment routes.
6. Fallback cutover/rollback must be tested on desktop/mobile browsers, at the same actual artifact SHA/build, including login/logout, Session revoke, draft preservation, in-flight `UNKNOWN`, redirects, cookie host migrations, stale assets and rollback. Any unproven behavior **STOP**; do not silently switch routing after a Cookie error.

**Fallback is a conditional design, not automatically triggered.** No automatic cross-site `SameSite=None` downgrade, browser privacy-disable instruction, or insecure direct-to-provider URL remains an acceptable escape hatch.

## 7. Four-environment origin and credential isolation

| Environment | Logical origin policy | Session/cookie/data policy | Evidence / authority |
| --- | --- | --- | --- |
| **Local Synthetic** | Fixed loopback/mock HTTP only under separately authorized code task; no real Zotero/Nutstore host and no production hostname | Fake principals/sessions and synthetic note/quote data; local insecure-cookie differences are **not** production compatibility evidence | Existing POC-001 local branch is scoped separately; A14 authorizes no new code |
| **Independent QA** | Separate exact fixture/mock origins with denied external egress, no production origin or credential | Independent fake Session namespace, verified build SHA/fixture hash; negative Origin/CORS/CSRF tests | Reviewer exact SHA, stage PASS/PARTIAL/FAIL, no live provider |
| **Staging — FUTURE** | Later approved HTTPS frontend/API origin pair or same-origin proxy, distinct explicit hostname set and proxy config | Test-only data, separate Session issuer/key/cookie host/secret manager from Production; **never restore production Note/PDF/account data into Staging** | Separate environment provisioning, TLS and real-browser permission, independent staging QA |
| **Production — FUTURE** | Later approved HTTPS origin pair/domain, separate exact allowlist, reviewed TLS and authoritative proxies | Real owner data, independent credentials/session/backup/logs only after production consent; **no reusing POC disposable WebDAV account or QA secrets** | D007-A3 final provider decision + A9/A10/A11/A13 gates, separate merge and release authorization |

**Critical subtlety:** different Staging and Production **subdomains of the same registrable domain are still same-site**. Host-only cookies and Origin checks must remain environment-specific; for stronger separation, consider distinct registrable sites at a **future explicit domain decision**, not by falsely assuming prefixes/branches give site isolation. Hostname and public-suffix security reviewed at deployment time.

No domain or TLS certificate, proxy, browser test host, Session database, secret store, staging account, CI, or cloud resource is selected, registered, purchased or deployed by A14.

## 8. Cross-browser and physical-device evidence matrix (all NOT RUN)

Every future test captures **actual OS/version, browser/version, physical versus emulated device, registered-site topology, URL scheme/port, Host-only Cookie attributes in a privacy-safe way, session store mode, exact source/build SHA, test fixtures, result, and independent QA review**. Never record the real Cookie value, user password, Zotero key, PDF or private note.

| Matrix | Device/browser target | Mandatory observations and negative cases | Status |
| --- | --- | --- | --- |
| **B14-M1** | Windows desktop: Chrome + Edge + Firefox | Cross-origin same-site credentials and CORS preflight, cache behavior, login/logout, unauthorized Origin, Session revoke and in-flight Note write | **NOT RUN** |
| **B14-M2** | macOS: Safari + Chrome + Firefox | Same-site host-only cookie, normal/private mode, navigation and background restore, login redirects and blocked third-party-cookie default-host comparison | **NOT RUN** |
| **B14-M3** | iPhone: Safari + available alternative browser, explicit iOS and app/browser version | Login, refresh, return from background, privacy settings/ITP behavior, blocked third-party cookies, draft preservation after reauth | **NOT RUN** |
| **B14-M4** | iPad: Safari + available alternative browser, explicit iPadOS version | Multi-tab/keyboard and IME, focus, browser background eviction, logout and in-flight `UNKNOWN`, host-only cookie eligibility | **NOT RUN** |
| **B14-M5** | Android phone: Chrome + Firefox where available | Login, redirects, SameSite mode, exact Origin, session state across pause/resume, no cross-site `None` assumption | **NOT RUN** |
| **B14-M6** | Android tablet: Chrome + available browser | Separate device Session, revoke versus other-device draft, site/origin, logout and fallback to same-origin proxy | **NOT RUN** |
| **B14-M7** | Direct same-site versus same-origin proxy on each supported platform | Compare Lax host-only API origin cookie with proxy-host cookie; no silent Cookie migration; CSP/CORS/CSRF and logout still secure | **NOT RUN** |
| **B14-M8** | QA/Staging/Production logical boundary simulation and later authorized real host QA | CORS wildcard, null Origin, sibling-subdomain forgery, blocked Cookie, replayed/expired/revoked Session, unapproved proxy/host and foreign tenant | **NOT RUN** |

**Browser limitations:** WebKit has documented full third-party-cookie blocking; `SameSite=None; Secure` is not a guarantee that unrelated-site provider-default deployments will work in Safari. Same-site sibling origins are not a third-party-cookie scenario just because they are cross-origin; browser version, tracking rules, site classification, user settings, redirects and actual hostnames must still be tested. Desktop evidence cannot stand in for mobile or for independently installed Zotero native app handoff (A8 L1/L2/L3 is a **different** test).

## 9. Planned independent A14 test register — 16 DESIGN-ONLY, all NOT RUN

| ID | Future synthetic and separately authorized browser/provider acceptance |
| --- | --- |
| **A14-01** | Explicit schemeful site vs origin computation, exact scheme/host/port and public-suffix rules, including different ports and HTTP/HTTPS split |
| **A14-02** | API response sets `__Host-` no Domain, root Path, Secure/HttpOnly and candidate SameSite=Lax; no JS/sibling-domain access to Cookie |
| **A14-03** | Direct cross-origin same-site Fetch sends eligible cookie only with explicit `credentials: include`; correct CORS response and `Vary: Origin` |
| **A14-04** | Preflight and actual request reject wildcard/null/unapproved Origin and unapproved methods/headers; credentials+CORS never wildcard |
| **A14-05** | Session-bound CSRF and exact Origin/Fetch Metadata reject forged sibling-site/subdomain and cross-site requests despite SameSite |
| **A14-06** | Login, logout, Session fixation rotation, current/all-device revoke and expired/invalid Session; server authoritative invalidation |
| **A14-07** | Cookie blocked/expired during Save Now/autosave leaves local draft, last confirmed revision and dispatched `UNKNOWN` intact without blind replay |
| **A14-08** | 401 vs 403 vs offline/5xx/UNKNOWN user-facing states and redacted logs do not leak private resources, credentials or draft data |
| **A14-09** | Safari iOS/iPadOS and macOS tracking/third-party-cookie restrictions tested against direct same-site and default unrelated-site cross-origin variants |
| **A14-10** | Windows Chrome/Edge/Firefox cross-origin login/logout, CORS, CSRF, refresh and cookie host; exact versions and real outcomes |
| **A14-11** | iPhone/iPad iOS/iPadOS Safari + secondary browser background/return, private mode, IME/focus and session recovery without draft loss |
| **A14-12** | Android phone/tablet Chrome + available browser, Session persistence, revocation and honest fallback under unsupported browser behavior |
| **A14-13** | Same-origin proxy route enforces exact method/path/Origin, no unauthorized forwarding/redirect/SSRF, no private CDN caching |
| **A14-14** | Direct API-host cookie vs proxy frontend-host `__Host-` migration/re-login and compatibility-safe rollback; no assumed transparent cookie transfer |
| **A14-15** | Independent QA/Local mock/Staging/Production origin/cookie/issuer/secret isolation, read-only Personal Workspace, cross-environment attack cases |
| **A14-16** | Independent evidence with full 40-char SHA, environment/fixture and browser matrix; no modification of frozen 26 U6 tests, original POC-001 REMEDIATION-02 or live access permissions |

**Count:** 16 A14 requirement-test designs and 8 B14-M device/topology groups, all **NOT RUN**. None alters Module 002 **26 frozen UI tests**, D007-A4..A8 **60 previously planned tests**, or the independently reviewed POC-001-REMEDIATION-02 branch; no extra POC regression work is authorized by this design.

## 10. Security STOP, open decisions and source verification

**P0 STOP:** Cross-user/foreign-project access, Session cookie transmitted to wrong host or exposed in static JS/logs/URL, unauthorized state-changing request, CSRF bypass, forced unsafe redirect or secret leak, false `Saved`/lost draft, production Session/credential accessible in nonproduction, or illicit use of live Zotero/Nutstore.  
**P1/BLOCK:** Inability to revoke Session reliably across API instances, repeated mobile authentication loss without safe UX, inconsistent proxy Cookie issuance, broken safe browser requests, incomplete independent origin tests for the intended supported platform.  
**No silent fallback:** if B fails device QA, request separate Design approval to implement and review same-origin routing; do **not** weaken SameSite/CSRF/CORS, auto-enable insecure cross-site bearer tokens or treat app deep-link failures as Cookie failures.

**Not decided:** actual domain, DNS provider, TLS certificate or proxy provider, app/API hostname, identity provider/OIDC redirects, Session store or Cookie expiry numbers, browser support version floor, actual availability thresholds, hosting account/region/budget, frontend/API code and release.

**Public reference register** (research checked 2026-11-23; no real account/data):
- [MDN — Fetch credentials and SameSite](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [MDN — Set-Cookie, host-only, __Host- and SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).
- [MDN — CORS and credentialed requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).
- [MDN — Fetch Metadata / Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Fetch_metadata).
- [OWASP — CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- [WebKit — Full Third-Party Cookie Blocking](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/).

**Next independent candidate: D007-A15 — identity bootstrapping, owner-account recovery and multi-device revocation policy**, provider-neutral and preserving A4's opaque Session, with MFA/recovery and backup access safeguards before any user account or credential is created. Design only; no auth provider selection or implementation.

**FINAL DISPOSITION: D007-A14 OPTION B APPROVED AS DESIGN ONLY. NO DOMAIN, DNS, PROXY, CREDENTIALS, CLOUD SERVICE, ACTUAL COOKIE SESSION, TEST CODE, DEVICE QA, APP CODE, MERGE, POC CHANGE OR DEPLOYMENT.**
