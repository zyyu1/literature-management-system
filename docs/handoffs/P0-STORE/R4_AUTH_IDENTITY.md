# P0-STORE R4 — live auth identity fix (spec; DEC-42 = A)

Authority: [A99](../../architecture/D007_A99_P0STORE_LIVE_RUN1_INCONCLUSIVE_PROBE_AUTH_DEFECT.md). Base: PR #9 exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef` on branch `exec/P0STORE-nutstore-probe-r1`. Normal (non-force) commits on that branch only. **No live request, no real credential, no real e-mail address anywhere** (tests use synthetic values such as `probe-user@example.invalid`).

## 1. Required behaviour
1. **User name from the run-time environment, live mode only.** Live plans must carry `credentialUserEnvVar: "P0STORE_WEBDAV_USER"`. Local/mock plans may omit the field and keep the fixed synthetic user `probe`, so the frozen `support/harness.mjs` and `plans/example-plan.json` stay byte-identical. The closed plan schema accepts this one new key. A live plan without it is refused at load with `PLAN_REJECTED`.
2. **Validation before any secret read or transport.** The value must be 3–254 characters and match `^[^\s:@]+@[^\s:@]+\.[^\s:@]+$`, with no control characters and no `:`.
   - Failures give `CREDENTIAL_USER_MISSING` (unset or empty) or `CREDENTIAL_USER_MALFORMED`.
   - Either failure means zero transport calls and an empty trace.
   - The new check sits in the R3 gate order directly before the password check.
3. **Redaction.** The user name is personal data and is treated like the secret: `Secret.contains` / `redact` cover the clear user name, the clear `user:password` pair, its base64 form and the Basic header. The trace, console output, preflight summary, errors and `result` never contain the user name. The preflight prints only `user=<redacted, N chars>`.
4. **Header.** `Basic base64(<user>:<password>)` in live mode; the local/mock behaviour is unchanged.
5. **Early stop on authentication failure.** In live mode the **first** 401 or 403 response ends the run at once with the existing rule `UNEXPECTED_401` (403 → `UNEXPECTED_403` if that rule already exists, otherwise `UNEXPECTED_401`). No further request is sent, not even cleanup, because nothing was created. The verdict stays INCONCLUSIVE by the R2 rules. This amends A99 §4 item 5: no new rule name is introduced. Mock behaviour for a 401 in other steps is unchanged unless a test below states otherwise.
6. Everything else in R3 (the 7 gate conditions, pinned host, approval regex, runId, Node pin, budget) is unchanged.

## 2. Allowed changes (exhaustive)
`src/secret.mjs`, `src/plan.mjs`, `src/runner.mjs`, `src/trace.mjs` (only if redaction needs it), `plans/live-nutstore-plan.json` (add the one key only), `README.md`, `scripts/verify-candidate-scope.mjs`, `scripts/mutation-check.mjs`, and the tests `test/p1-01-plan-loader`, `p1-05-secret`, `p1-10-stop`, `p1-12-live-inert`, `p1-15-live-gating`. A new `test/p1-16-auth-identity.test.mjs` may be added. **Any other file needs a Design amendment first.** Byte-frozen: `support/*`, `plans/example-plan.json`, `src/gate.mjs`, `src/oracle.mjs`, `src/verdict.mjs`, `test/p1-02…04,06…09,11,13,14`.

## 3. Required tests (in addition to the existing 85, which must still pass)
- U-01 a live plan without `credentialUserEnvVar` is refused.
- U-02 user env missing → `CREDENTIAL_USER_MISSING`; U-03 user env empty → the same code; U-04 user env malformed (including `:`, a space, no `@`, more than 254 characters) → `CREDENTIAL_USER_MALFORMED`. Each of U-02…U-04 has zero transport, an empty trace and a poisoned password env that is never read.
- U-05 with the stub transport and all conditions satisfied, the Authorization header decodes to exactly `probe-user@example.invalid:<synthetic password>`.
- U-06 a canary user name and password are absent from the trace, console, preflight, result and error strings, in clear, `user:pass` and base64 forms.
- U-07 the stub returns 401 on the first request → exactly 1 transport call, verdict INCONCLUSIVE, stop `UNEXPECTED_401@L0`.
- U-08 local/mock runs still use `probe` and match the frozen harness.
- U-09 at least 3 new committed mutants (hard-coded user name; user name not redacted; no early stop on 401) are killed.

## 4. Evidence and gates
1. Execution posts first-pass **G2** on PR #9 at the final exact HEAD, itemized per DEC-27:
   - commit list and the diff limited to §2;
   - byte proof against `6a59ce9` for every frozen file;
   - syntax, suite, upstream and audit results;
   - U-01…U-09;
   - the A59 Windows offline interval with pinned Node v22.23.5.
2. Execution also attaches the run-1 redacted files `p0store-live-trace.jsonl` and `p0store-live-console.txt` from `C:\lms-p0store-live\`, which the user provides, to PR #9 as one comment or attachment. Before attaching, re-scan them for any password, e-mail address or `Authorization`; on any hit, do not attach and tell Design.
3. Design rules G2; then independent targeted G3; then G4.
4. Only after G4: runbook rev 3 (one extra masked line for the user name), followed by a new user DEC with a new approval id.
