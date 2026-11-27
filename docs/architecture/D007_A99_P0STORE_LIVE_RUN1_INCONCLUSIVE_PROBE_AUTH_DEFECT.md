# D007-A99 — P0-STORE live run 1: INCONCLUSIVE, root cause = probe auth-identity defect (no provider evidence)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@ab2ef6d1208e049cfdcfb5454a7de38fb3a3d772`. Acted on an explicit user poll.

## 1. Facts (Management56 `ab2ef6d`, relaying the user's local artifacts)
- Run under approval `P0STORE-ACCESS-02-20261127-6a59ce9`, exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`, operator = user, runbook rev 2. Preflight matched the approval: host `dav.jianguoyun.com:443`, prefix `/dav/LMS-P0STORE/d7ee7d4cceb2fcc882fcb3b62e9836ee/`, Node v22.23.5 x64.
- `verdict=INCONCLUSIVE`, `rule=INCONCLUSIVE_BEFORE_L6_COMPLETE`, `stop=UNEXPECTED_401@L0`. 3 requests (OPTIONS and 2× PROPFIND on the probe parent), all 401; `bytesSent=0`, no redirects, no writes, cleanup 0. A secret scan of the console file found nothing. The artifacts are still on the user's machine and not yet in Git.
- **The approval is consumed.** No further live run is authorized.

## 2. Root cause (Design's own analysis at exact `6a59ce9`)
`src/secret.mjs:43–44` builds the header as `Basic base64("probe:" + password)`, with the user name **hard-coded to `probe`**. Nutstore WebDAV requires the **account e-mail** as the user name and the app password as the password, so a 401 was certain whatever the account state. The A90 design, the R3 spec, the Phase 2 checklist (U1–U7) and the G2/G3/G4 reviews all missed that the live identity needs a real user name. This is **Design's fault (spec omission)**; Execution and QA built and tested exactly what they were given.

## 3. Ruling
- The run verdict **INCONCLUSIVE** stands, as the A90 §6 rules require. It is classified **`PROBE_DEFECT_AUTH_IDENTITY`**, so it gives **zero evidence about Nutstore** (not GO, not NO-GO). The P0-STORE route verdict is still open.
- Bounds were kept: the requests went only to the pinned host and namespace, 3 of 88 were used, nothing was written and no secret leaked. The gating worked as designed.
- The user should still revoke the app password (U6) and confirm that `/LMS-P0STORE/` holds no run folder (none is expected, because MKCOL was never reached).

## 4. Proposed fix (R4, pending DEC-42)
1. The user name comes from a second run-time env var, `P0STORE_WEBDAV_USER`. The plan names it (`credentialUserEnvVar`).
2. The value must be a plain e-mail of at most 254 characters, with no control characters and no `:`.
3. It is treated as personal data: redacted from trace, console and errors in clear and base64 form, and never written to Git.
4. The preflight prints only `user=<redacted, n chars>`. A missing or malformed value is refused with `CREDENTIAL_USER_MISSING` / `_MALFORMED`, with zero transport.
5. A new STOP reason `AUTH_REJECTED@L0` maps a first-request 401/403 to INCONCLUSIVE with the classification `AUTH`. It stops immediately after the first 401 (1 request, not 3).
6. Tests are updated, including the redaction canary for the user name. The `probe:` constant and every test that asserts it are listed as allowed changes.
7. Exact-SHA G2 → G3 → G4 as for R3. After that, a new user DEC with a new approval id is needed for a single new live run with a freshly generated app password, and the runbook is updated (rev 3: one more masked line for the user name).

## 5. DEC-42 outcome
The user chose **A: do the R4 fix**. The spec is [R4_AUTH_IDENTITY](../handoffs/P0-STORE/R4_AUTH_IDENTITY.md). It amends §4 item 5: the existing rule `UNEXPECTED_401` is kept and stops on the first 401/403 in live mode. Board R55 dispatches R4 to Execution, first-pass G2 only.
