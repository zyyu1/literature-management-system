# D007-A15 — Single-Owner Identity Bootstrap, MFA, Recovery and Device Revocation

**Decision:** **D007-A15 Option B APPROVED**, user approval **2026-11-23 (Europe/Berlin)**.  
**Authority:** **PROVIDER-NEUTRAL SECURITY ARCHITECTURE ONLY — NOT IMPLEMENTED OR TESTED**. No real Owner identity, password, passkey, MFA factor, recovery address/code, credential, key, account, environment, message, login flow, cloud service, GitHub CI, app or test code may be created by this decision.  
**Dependencies:** [D007-A4 authenticated API/opaque Session/authorization](D007_A4_AUTH_SESSION_SECURITY.md), [D007-A14 schemeful same-site Cookie/Origin/CSRF and optional same-origin proxy](D007_A14_ORIGIN_COOKIE_TOPOLOGY.md), [D007-A13 independent Local/QA/Staging/Production environments](D007_A13_ENVIRONMENT_ISOLATION.md), [D007-A5 mutation/UNKNOWN outcomes](D007_A5_API_CONTRACT.md), [D007-A6 schema/backup](D007_A6_DATA_SCHEMA_RECOVERY.md), [D007-A7 privacy/retention and unsynced drafts](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [D007-A9 QA gates](D007_A9_QA_FRAMEWORK.md), [D007-A10 independently authorized work packages](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), [D007-A11 incident/secrets runbook](D007_A11_OPERATIONS_RUNBOOK.md).
**Immutable boundaries:** [Module 002 UI-FREEZE-01](../ui/002/DESIGN_APPROVED.md) and its 26 planned U6 scenarios **unchanged and NOT RUN**; **no new login/recovery/management UI is authorized**. The independent [POC-001 REMEDIATION-02](../handoffs/POC-001/REMEDIATION_02.md) remains local/mock only, on `exec/POC-001-webdav-feasibility`, original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, original path allowlist and **NO REBASE**; second QA at `2806d9d08dcec78e974703a82a38a696ae76d132` reported `LOCAL_STAGE PARTIAL`. **ACCESS-02 remains BLOCKED; PR #2 not merge-approved**.

## 1. Single-owner identity and immutable ownership boundary

- **Product mode:** one intentionally initialized **Owner** with a durable internal `ownerId` unrelated to email address, Zotero user ID, group ID, cookie value, or device identifier. Changing an email, external IdP subject, MFA factor or login method must **not** create a second Owner or change the owner of website-owned Projects, CanonicalPapers, global five-field ResearchNotes, ReadingStatus, KeyQuotes, SourceHistory and backups.
- **No public sign-up, self-service invite, default admin or second bootstrap.** Visitors must never gain ownership by observing that the owner table is empty, by racing “first to sign up,” by supplying an email, or by controlling frontend configuration. An existing initialized Owner identity is a one-way trust boundary; recovery cannot re-run bootstrap or reset the owner ID.
- **Identity binding:** future selected authenticator/IdP must map authenticated subject → explicit authorized ownerId and separately defined read-only Personal Workspace grant. A login with a valid but *different* external subject or issuer must **deny**, not auto-provision a new Owner. Do not conflate a public Zotero group library with a website account.
- **Authorization remains per request:** A4's server-side object scope and workspace read-only restrictions apply even for a legitimate Owner Session; a separate Workspace read-only principal may read only its explicitly permitted projection and cannot bootstrap, edit, delete, export unrelated data, manage factors or revoke Owner Sessions.
- **Durability prerequisite:** an authoritative multi-instance identity record, authenticator registry and revocation status must eventually be proven. Neither a per-process map nor the POC's unverified WebDAV atomicity is authorization to implement global bootstrap/identity state.

## 2. First-owner bootstrap — closed, single-use, atomic, independently authorized

**State model (conceptual, not a deployed database/API):**
```text
UNPROVISIONED (server not open for public ownership claims)
  -> BOOTSTRAP_AUTHORIZED (explicit operator/user approval,
       installation-scoped one-time out-of-band bootstrap proof)
  -> CLAIM_IN_PROGRESS (server atomically reserves the only owner slot)
  -> OWNER_ACTIVE (strong credential registered, verified recovery
       strategy completed, bootstrap authority permanently burned)
  -> OWNER_RECOVERY_LOCKED / OWNER_SUSPENDED as incident states
  [No transition from OWNER_ACTIVE back to public UNPROVISIONED]
```

**Mandatory ceremony and STOP:**
1. Prior separate **user/Design approval** of the selected identity provider, deployment host, Session-state backend, bootstrap proof distribution, exact administrator/operator and execution scope. No domain, cloud or secret material is selected here.
2. Installation bootstrap proof must be **unpredictable, one-time, narrowly scoped and delivered out of band**, protected from API/log/browser frontend, with expiry and rate-limit rules decided at implementation. Open unauthenticated `/setup`, “first request wins,” seeded default credentials and URL query bootstrap tokens are unacceptable.
3. Server must atomically compare `UNPROVISIONED` with a one-time reserve/commit of owner identity across **simultaneous processes and retries**; exactly one authenticated authorized claim can succeed. If no proven cross-instance atomic primitive exists, **STOP bootstrap / keep service inaccessible**. A frontend button disable or per-instance mutex is insufficient.
4. The new owner identity is not usable for high-value mutations until approved authenticator binding and **independently recoverable access arrangement** have completed; registration interruption must be recoverable only through the original protected, bounded authorization, not through a second public owner claim.
5. Seal bootstrap proof immediately upon successful final activation, deny replay, log only redacted metadata and produce an owner-only security notification through a **later approved** channel. Fail closed on interrupted/duplicate/unknown commit outcome; do not leave “maybe created” states that accept a second owner.
6. There is **no owner deletion/re-initialization** path authorized by A15. Destructive account reset/data migration or replacing an unavailable Owner requires a separate user-approved, independently QA'd recovery/restore design; never silently overwrite the owner's corpus.

## 3. Authentication and MFA candidates — selection deferred

| Candidate | Security properties / appropriate scope | Deferred decision / risk |
| --- | --- | --- |
| **WebAuthn/passkey** (strong *candidate*, not selected) | Phishing-resistant public-key challenge bound to a verified HTTPS RP ID/origin; can support device-bound or synced credentials, and platform/roaming authenticators | Need future review of relying-party ID and A14 app/API origin, authenticator user verification, BE/BS backup state, platform/browser versions and independent backup factor; synced credential ≠ assured recovery if same sync account is compromised or inaccessible |
| **Password + separate MFA** | Widely compatible; TOTP authenticator is a candidate second factor, **not phishing-resistant** and not equivalent to a WebAuthn origin-bound assertion | Provider-backed password policy/secure one-way storage (modern approved KDF, unique salts and suitable work factors if self-managed), bot defenses, TOTP secret storage, clock drift, secret recovery, step-up and device testing; no home-grown password backend chosen |
| **Password + security key / passkey step-up** | Phishing-resistant second proof and independent roaming backup credential can reduce device-loss risk | Require physical-device enrollment/revocation tests and an alternative safe recovery channel; no hardware purchased by this plan |
| **External OIDC/identity service** | Possible outsourced identity proof and login factor management while API keeps its own Session and per-object authorization | Identity provider, issuer/sub mappings, OIDC callback, MFA availability, privacy, billing and account recovery behavior **UNDECIDED**; no automatic permission to rely solely on an IdP email claim |
| **Email/SMS OTP fallback** | May be a recovery communication mechanism under separately reviewed scope | **NOT preferred as sole MFA-bypass**: email takeover, SIM swap and weaker phishing resistance. No automatic transition to email-only on WebAuthn failure |
| **Security questions / default support admin** | **Not acceptable** as a substitute for secure recovery in a single-owner private research service | No “mother's maiden name,” plaintext master password or emergency fixed bypass |

**WebAuthn origin subtlety:** A14's `app.example.com` and `api.example.com` are **same-site but different origins**. The actual WebAuthn registration/assertion ceremony origin, permitted RP ID and server verification of challenge, origin, type, signature, authenticator flags and credential counter/backup signals need a **separate provider/domain implementation decision**. The optional same-origin proxy changes deployment host assumptions and may require new enrollment/compatibility tests. Do not assume sibling subdomains automatically give valid credentials, nor promise all iOS/iPadOS/Android browsers work before real tests.

**Enrollment safety:** after enrolling an initial usable authenticator, future policy should require **a distinct backup recovery capability before the only device can be lost**, with evidence of user acknowledgment. Adding/removing factors, changing credentials/recovery addresses and revoking all Sessions are **high-risk, fresh-auth/step-up operations**. A previously active session alone is not sufficient proof to replace all authenticators.

**Not decided:** passwordless-only vs hybrid policy, mandatory MFA stage, factor count, user-verification policy, cryptographic/KDF parameters, login limit thresholds and lockout duration, passkey sync provider, WebAuthn RP ID, emails/messages, recovery-code count/length/expiration, human support channel or product UI.

## 4. Recovery: threat-resistant, bounded and never a secret backdoor

**Recovery priority:** retain at least one independently secured recovery means **before** relying on a single fragile device. A practical design candidate is an **offline saved single-use recovery code** coupled to an existing verified authenticator or a **second independent qualifying recovery proof**, subject to a later explicit assurance-policy decision. The final flow must be evaluated against NIST SP 800-63B-4's account-recovery rules for whichever assurance level is actually claimed; A15 does **not** certify an AAL or implement NIST compliance.

- **Offline saved codes:** future generation by a cryptographically secure source, no plaintext stored server-side (store securely derived verifier/hash), reveal only during an explicitly protected enrollment ceremony, advise user to store offline and separately from their lost device; one-time atomic consumption/replacement, bounded attempts and recovery notifications. Never embed a code in GitHub, PDF, Note, log or export. If the available persistence cannot atomically consume a code and rotate authenticator state, **STOP; do not offer it as reliable recovery**.
- **Recovery contacts/addresses:** independently verify control and integrity before binding and **before modifying an existing recovery factor**. A recently changed address, same compromised email account, redirected link or untrusted email header is **not sufficient alone** to replace MFA. Use exact approved HTTPS callback/origin; no dynamically constructed reset link from attacker `Host` header. Numeric TTLs, secondary channels and notification behavior to be independently decided/QA'd.
- **Enumeration protection:** public recovery requests yield neutral, consistent responses and bounded abuse controls regardless of Owner existence; do not expose a sole Owner's email, registered methods, active device list, exact lockout state or whether a guessed subject exists. Prefer soft throttling/backoff with safe alternative recovery rather than permanent lockout on attacker-generated attempts.
- **High-risk recovery:** separate `RECOVERY_REQUESTED` → `EVIDENCE_VERIFIED` → `RECOVERY_APPROVED` → `CREDENTIAL_REBOUND` → `SESSIONS_REVOKED` → `OWNER_NOTIFIED`. Verify independent proof **before changing credentials or MFA**; require fresh registration/step-up and invalidate used recovery evidence. Notify existing, still-trusted channels without leaking tokens, provide a dispute/containment path if later implemented.
- **Compromised Owner:** reset password alone is insufficient. Audit previous-factor and recovery-address changes (minimal redacted metadata), revoke suspected credentials, terminate preexisting Sessions, preserve protected records and last-confirmed write state; a stolen long-lived Session cannot be silently treated as proof of ownership.
- **Honest unavailable recovery:** if **all trusted authenticators and valid recovery evidence are lost**, or recovery datastore is corrupted, **do not silently create a bypass** or proclaim recovery guaranteed. Mark `RECOVERY_BLOCKED`, safeguard stored data/backups, require separately authorized identity/backup integrity investigation; manual administrative import/owner replacement cannot be invented here.
- **Scope and expiry:** one-time tokens are tied to exact operation, environment, authorized owner identity, issuance context and verified expiry, with atomic invalidation; resend/rotation and stale challenges cannot create independent valid Owner identities. No concrete lifetime or count is set.

## 5. Session, device, MFA change and loss handling

A4/A14 remain authoritative for browser delivery:
```text
HTTPS frontend (later approved origin)
  -> secure API-managed opaque host-only __Host- Session Cookie:
     HttpOnly; Secure; Path=/; no Domain; SameSite=Lax candidate
  -> server-side Session record (owner/principal, device-scoped opaque ID,
     auth-strength/step-up timestamp, creation/expiry, revoked state)
  -> per-request authorization + CSRF token + exact Origin/CORS/Fetch Metadata
  -> authorized website-owned data only
```
- **Session per device/browser:** one session revocation does not revoke unrelated valid sessions unless explicitly chosen. The Owner may later be permitted to inspect minimally named active sessions and revoke a single/all Session(s) following fresh authentication; this paragraph specifies server/API safety, **not a new frozen UI screen**.
- **Server-authoritative state:** rotate Session ID on initial login, step-up/risk and recovery where applicable; validate idle and absolute expiry plus revocation **on every API instance**. Closing a tab or clearing a host-only cookie is not revoking a server Session; missing session store means **deny protected access**.
- **Lost device:** from an independently trusted remaining factor/recovery path, revoke affected device Session(s) and the **authenticator itself when lost/stolen**, not just the current cookie; check passkey sync provenance and risk of restored backups, then verify rejection. Another still-trusted device may remain active if verified unaffected; for confirmed takeover or credential reset, consider revoke-all and re-enroll trusted factors.
- **Factor change:** reauthenticate using an existing enrolled proof (or a separately reviewed recovery method); check CSRF/Origin, freshness, safe challenge/atomic update, rate limits, confirmation and out-of-band notification. Do not let an already-authenticated Workspace read-only session mutate Owner MFA or disable notifications.
- **Revocation vs pending data writes:** revoking a session blocks **new** authorization, but does **not** prove a previously dispatched Save Now/autosave/Delete/Relink failed or was canceled. Keep protected original `operationId`, resource revisions, `UNKNOWN` and last-authoritatively-confirmed state as D007-A5 demands; **no blind replay** on login/reset/rotation.
- **Draft preservation:** no logout, account recovery, Session expiry, MFA rotation, device revocation, CSRF rejection or browser Cookie change automatically discards local unsynced drafts. The frozen UI-D005.1h/1j exact-snapshot confirmed-save/explicit-discard conditions and local export remain authoritative. **A lost or wiped physical device's browser storage cannot be remotely guaranteed recoverable**; a recovery-code backup is not a Notes backup.
- **Credential changes vs encrypted backups:** do not assume changing a password destroys/re-encrypts or grants access to website data, backup encryption keys or Zotero/Nutstore credentials. Key hierarchy, backup portability and account-removal rules remain separate A6/A7 decisions and future provider evidence.

## 6. Principal/feature access table

| Role/principal | Identity source | Allowed owner/credential operations | Data access boundary |
| --- | --- | --- | --- |
| **Owner authenticated through API** | Single durable `ownerId` after verified login/step-up | Routine own data access; high-risk MFA/recovery/revocation requires fresh proof and original Design/UX authorization | Owner-scoped website Notes, Projects, ReadingStatus, Key Quotes subject to exact resource rules |
| **Personal Workspace read-only grant** | Separate scoped API principal, not an Owner Session clone | **NO** bootstrap, account changes, MFA management, device revoke, cross-system token, state-changing write or restore | Only D007-A4 approved read-only projection and safe deep links; never global read of secrets/Notes by default |
| **Unauthenticated visitor/recovery claimant** | No live Owner Session | Neutral request to start a *future* recovery ceremony; no ownership or factor disclosure | **NO** private Project/Note/Quote/backup access |
| **Local Synthetic/Independent QA** | Per-environment fake principal and mocked factors | Only later approved synthetic tests, not actual Owner bootstrap | Fake fixtures only; cannot access Staging/Production/POC real credentials |
| **Future Staging vs Production Owner** | Distinct issuer, Session namespace, recovery factor store and approved host/RP ID | Cannot use staging credential/session/OTP/recovery code to authenticate Production | Separate isolated synthetic-vs-real data under A13; no production copies in QA |

This is the **single-owner product mode**; it does not invent collaboration/user invitations, delegated editing, bulk account export, helpdesk unlock or a new personal workspace UI. Existing A4 member authorization discussion remains subject to an independent future product decision if collaboration is ever proposed.

## 7. Threat model and STOP taxonomy

| Threat / failure | Entry point | Mandatory defense; failure state |
| --- | --- | --- |
| **First-run owner takeover** | Public setup, zero-user check, concurrent processes and race | One-time out-of-band bootstrap authorization and proven **atomic unique owner claim**, then close permanently. **P0 STOP** on second owner or unauthorized bootstrap |
| **Recovery bypass / MFA downgrade** | Password reset email, stolen inbox, SMS swap, fallback after WebAuthn failure | Independent qualifying recovery proofs; step-up, anti-enumeration, notification and no automatic email-only bypass. P0 on unauthorized factor replacement |
| **Phishing/credential stuffing** | Fake website, brute-force/password reuse | Favor origin-bound authenticators, bounded attempt policy, credential protection; never claim TOTP/email OTP phishing resistance |
| **Stolen/passkey-synced device or cookie** | Device theft, malware, sync-account compromise, session fixation | Separate authenticator vs Session revocation, fresh risk verification, server authoritative store, no browser-visible token. P0 on confirmed unauthorized account access |
| **Cross-environment/session confusion** | Shared auth issuer, Cookie, WebAuthn RP ID, restore of QA secrets | A13 isolation, A14 exact origin/host-only Cookie and proof before promotion; production accepts no test tokens |
| **CSRF/IDOR / read-only Workspace escalation** | Same-site sibling subdomain, forged Origin, foreign ID | CSRF + Origin/Fetch Metadata + object authorization and read-only grant enforcement on API; deny write even if origin same-site |
| **Recovery replay or ledger race** | Simultaneous recovery codes, duplicate bootstrap, crash during rotation | Atomic single-use consume + permanent binding; durable store required; never infer strong atomicity from mock WebDAV |
| **Unknown write during credential rotation** | Network timeout, revoked session, device loss | Preserve original `UNKNOWN`, last confirmed data, local draft, no automatic replay or fabricated Saved |
| **Backup/identity hostage** | All factors lost, damaged credential store, stale backup reintroducing account | Recovery fails closed; independent verified backup/key authority and anti-resurrection; no secret emergency admin backdoor |
| **Private metadata leak** | Audit, reset notifications, exported screenshots, support/debug | Minimize/redact Session/device/recovery metadata and secrets, A7 retention policy undecided; no real content in QA |

**P0 STOP:** unauthorized second Owner, attacker-selected recovery factor, cross-user authorization, stolen Session accepted after confirmed revocation, credential leakage, silent false Save or lost draft due to identity event, production credential in QA.  
**P1 BLOCK:** no reliably atomic bootstrap/code consumption, no safe independently verifiable recovery path, inability to revoke across instances, RP ID/origin incompatibility in a required tested browser, incomplete notifications/lockout recovery for chosen method.  
**P2 REVIEW:** scoped noncritical usability, logging/audit or documentation gaps without data loss or privilege implications. Escalate any P2 with integrity/privacy consequences to P0/P1. No threshold, retention days, or actual failure response measurements are approved.

## 8. Proposed independent QA register — 18 DESIGN ONLY, NOT RUN

| Test ID | Future synthetic and (where authorized) browser/identity-provider verification |
| --- | --- |
| **A15-01** | Two concurrent first-owner claims across separate fake instances: exactly one atomic winner; no public “first visitor” ownership |
| **A15-02** | Unauthorized/default/expired/replayed bootstrap proof or failed incomplete claim: deny; Owner identity not duplicated after restart |
| **A15-03** | Change verified email/IdP subject or Zotero library link: preserve one stable Owner ID and associated Projects/Notes/Quotes |
| **A15-04** | Auth factor candidates WebAuthn/passkey and password+TOTP under fake verifier; check origin/RP ID and challenge/freshness, never claim platform QA from unit result |
| **A15-05** | Secondary authenticator and recovery-path enrollment before last reliable factor removal; step-up and explicit owner verification |
| **A15-06** | Saved offline recovery code single-use hashed verification with simultaneous redemption and crash/restart; no second valid replay |
| **A15-07** | Changed/stolen recovery address, expired reset link, Host-header injection and email-only MFA downgrade are denied |
| **A15-08** | Recovery account existence and registered factor state protected from enumeration; bounded per-account/device attempt policy without permanent attacker-triggered lockout |
| **A15-09** | Reset or lost-MFA recovery steps verify proof before changing factor; notify through independently trusted channel, no automatic Owner re-bootstrap |
| **A15-10** | Compromised password recovery alone cannot leave malicious Session/factor active; revoke and verify old Sessions and proof |
| **A15-11** | Current-device and all-device revoke across two API instances, rotation and expire at server; revoked Cookie rejected immediately |
| **A15-12** | Lost iPhone/iPad/Android/desktop device: authenticator removal distinct from Session revocation; unaffected devices and sync-passkey edge separately classified |
| **A15-13** | Session-host migration under A14 same-site origins vs same-origin proxy preserves CSRF/Origin and never leaks old Cookie/Session |
| **A15-14** | Session expired or credential rotated during dispatched Note write: 401/403/UNKNOWN remain distinct, draft intact, no blind replay |
| **A15-15** | Personal Workspace read-only principal cannot bootstrap, reset MFA, revoke Owner Session, mutate Project/Note/Quote or obtain secrets |
| **A15-16** | Owner/recovery/credential logs and QA screenshots redact email, tokens, codes, Cookie, device identifiers and Research Note text |
| **A15-17** | Local/Independent QA/Staging/Production issuer/keys/recovery codes isolated; fake factor cannot authorize production, no real account used |
| **A15-18** | POC-001 REMEDIATION-02, its original base/allowlist/ACCESS-02 BLOCK and frozen Module 002 26 scenarios unchanged; independent QA must pin full 40-char code SHA |

**Evidence gate:** each test needs separate future execution approval, exact branch/base/HEAD SHA and build digest, fake fixture seed/identity store, allowed host/device matrix, actual commands/exits, negative results, P0/P1/P2 disposition and independent QA report. WebAuthn Android/iPhone/iPad/macOS/Windows/browser and Safari Cookie evidence **NOT RUN**; any current statement about them is a design expectation, not observed compatibility. A4/A14 consent/CSRF requirements remain controlling.

## 9. Public security guidance and deliberate non-certification

- [NIST SP 800-63B-4, authentication and recovery (2025)](https://pages.nist.gov/800-63-4/sp800-63b.html): distinct authenticator enrollment, saved one-time recovery codes, recovery requirements, loss/revocation and recovery notifications; this project **does not claim AAL conformance**.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): reauthentication on risk events, neutral errors and protecting Session state.
- [OWASP Passkey Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Passkey_Security_Cheat_Sheet.html): phishing-resistant WebAuthn, origin/RP ID, synced vs device-bound recovery limitations.
- [OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html): factor-change step-up, recovery no weaker than authentication and lost-device risk.
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html): one-time bounded reset codes, neutral enumeration behavior and recovery from compromise.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): session identity, rotation and authoritative revocation.
- [W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/): RP ID, origin verification and backup/synchronization indicators.

**No actual mechanism, account, factor, password hashing implementation, numeric lockout/recovery expiry, identity provider, OTP sender, verified backup, domain, Session store, callback, UI, backend or cloud resource has been created or selected.**

## 10. Next independent design candidate

**D007-A16 — owner-authorized security-sensitive action policy / step-up and delegated capability boundaries** (risk tiers for Project permanent delete, all-Project unlink, account/MFA reset, research-note bulk export and safe read-only Workspace capabilities). Define authorization freshness, signed intent, confirm scope, operation identity and per-action audit/UNKNOWN behavior **without adding a frozen UI deletion feature or account-management screen**. Design-only; no code, login, secrets, real provider or QA run.

**FINAL DISPOSITION: D007-A15 OPTION B APPROVED AS SINGLE-OWNER IDENTITY/RECOVERY DESIGN ONLY. FROZEN UI AND POC-001 REMEDIATION-02 UNCHANGED. NO AUTH PROVIDER, REAL ACCOUNT/CREDENTIAL, TESTS, APP CODE, MERGE OR DEPLOYMENT.**
