# POC-001 REMEDIATION-08 — Independent G3 QA Plan (D007-A30, NOT_RUN)

**Authority:** User-approved D007-A30 Option A; R08 is LOCAL/SYNTHETIC ONLY, no real host or credentials. This is a plan, not proof. Read [A30 G1](../../architecture/D007_A30_R08_LOCAL_READINESS_G1_AUTHORIZATION.md), [R08 Execution](REMEDIATION_08.md), [A29 matrix](ACCESS02_PRECHECK_MATRIX.md) and [A28 local G4](../../architecture/D007_A28_POC001_G4_LOCAL_DISPOSITION.md).

## Independent reviewer and exact-SHA preflight

**Must be a separately opened QA session/window** independent of Execution, fresh full clone, own temporary CA/HTTPS stand-in, HTTP recording proxy and fault/mutation copies outside repo. A same-Execution-session sub-agent is NOT an independent G3. QA may only write a direct factual PR #2 QA comment; no code edits, push, merge or secret/real account. Stop with `G3_INDEPENDENCE_PENDING` if unavailable.

Verify exact remote PR #2 HEAD and clean detached local HEAD after Execution reports the **new** full 40-character SHA; original branch `exec/POC-001-webdav-feasibility` and immutable base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; R08 start `ace7b1e610529c1f139dc06371d9f531ccf0e28b` is ancestor; original merge-base unchanged, 0 merge commits, no rebase/force-push. Compare **every incremental changed file** to A30 strict whitelist, cumulative to `poc/001/**` + `docs/handoffs/POC-001/QA_HANDOFF.md`. Verify source SHA diffs: only `webdav-adapter.mjs`, `util.mjs` and `safe-api.mjs` allowed; forbidden `api-main`, mock and existing test changes ⇒ FAIL/STOP. If first remote auth/preflight fails STOP and restart preflight after access; do not reuse historical A28 QA-1 exception.

## Mandatory independent case matrix

| ID | Independent probes and PASS oracle |
| --- | --- |
| **R08-TLS-01** | Test-only ephemeral CA/localhost-or-IP SAN, strict HTTPS validation on loopback, exact peer, 0 secret leakage; original local HTTP positive control remains PASS |
| **R08-TLS-02** | Wrong CA, untrusted/expired/SAN-mismatched cert and redirect/downgrade fail closed; peer can receive handshake but **no authenticated application request/Authorization** to invalid peer. No insecure TLS bypass |
| **R08-NET-03** | IPv4/IPv6 non-loopback, arbitrary hostname, localhost resolved outside loopback, forbidden port/origin/URL or cross-host redirect; refuse without external egress |
| **R08-PATH-04** | Dot segments, encoded/double-encoded separators, foreign paths, path-query confusion and cross-run namespace escapes rejected; valid synthetic Note paths still work |
| **R08-Q4-05** | Two fake principals, cap 2 each/global 4; slow/aborted upload with test 1000ms absolute deadline releases pending slot **before any dispatch**, 0 PUT, 0 late commit; conservative handling if dispatch uncertain, 1MB body limit, 429/refusals and opId fingerprint mismatch |
| **R08-Q5-06** | Applied-but-unconfirmed Fence, lost ACK, bad/weak/missing ETag, GET read-back failure, sibling and restart: UNKNOWN/indeterminate remain nonterminal, no hidden replay, no unsafe eviction; operator quarantine/STOP only |
| **R08-CAP-07** | Full end-to-end minimal fixture N=1665 => 9998 XML elements; N=1666 => 10004; positive count/bundle if supported, negative 503 export_incomplete with **no partial 200/record GET/write**; bytes/time/peak RSS and fixture provenance recorded, no universal limit |
| **R08-BUD-08** | Synthetic rolling 100-request/30min accounting inclusive auth/readback/cleanup, 20 fake files, 1MiB each/20MiB total, two writers, cleanup capacity reserved, fail-before-exceed; no provider calls |
| **R08-REG-09** | Individually run POC01–07 / R01–R08, check, full suite ×5 **if claimed**, mutation-check with M1–M51 preserved, secret-scan original base, `npm ls --all` empty, all actual exits and counts |
| **R08-SCOPE-10** | No forbidden file, secret, external egress, CI/package/UI change; 114-byte resourcetype-only PROPFIND unchanged and no bodyless/allprop retries; prior CAS/UNKNOWN safety preserved |

Independently create disposable mutations (not rely only on repository driver): disabled TLS verification, host/target bypass, Q4 deadline bypass/late PUT, Q5 false terminal/replay, over-cap partial export. Confirm each is killed by its *intended security assertion*, not syntax/setup errors or unrelated failure. All M1–M51 must remain effective, with meaningful added R08 mutants and honest actual totals; do not predict M-count beforehand.

For malformed certificate tests, reject application HTTP and Authorization; do **not** claim zero TCP/TLS packets when a TLS handshake is required. The QA-generated private key and certificates stay in temporary storage; delete safely and report only non-sensitive metadata. Node/OpenSSL availability must be reported; missing required tooling ⇒ NOT_RUN/STOP, not pass. Confirm endpoint policy continues **non-loopback hard deny** regardless of HTTPS feature.

## Evidence and verdict

Independently report exact Git SHA, source/tree diff, own test tools, fixture digest, Node/OS/hardware, exits, timings/RSS, valid and adversarial request traces, source/secret checks, all P0/P1/P2/INFO plus NOT_RUN and provider limitations. Distinguish old A28 153/153×5 from actual R08 counts. A25 119 isolated resource-run evidence cannot be presented as freshly rerun without a fresh run.

Required verdict: `R08 LOCAL_STAGE PASS / PARTIAL / FAIL`; `G3 INDEPENDENCE VERIFIED / PENDING`; `OVERALL POC-001 BLOCKED_REAL_SERVICE`. When all required local cases pass, recommend `PASS_LOCAL_CANDIDATE_FOR_D007_A31` **only**. QA cannot close P2-R05-2, Q1e/Q4/Q5, or authorize G4/G5/G6/G7. Post direct QA PR #2 Conversation comment at exact head, then **QA STOP**. Execution relays report unchanged to Design. All real Nutstore/WebDAV/TLS/CAS/ETag/MKCOL/quotas NOT_RUN and G6 ACCESS-02 BLOCKED.