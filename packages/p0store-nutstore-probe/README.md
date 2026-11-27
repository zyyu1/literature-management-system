# P0-STORE Phase 1 / Phase 3 live-readiness — Nutstore WebDAV probe runner

**Status: LOCAL_MOCK_ONLY / PHASE_3_LIVE_READINESS_OFFLINE_TESTED / NO_LIVE_ACCESS_EXERCISED.**
This package is the Phase 1 readiness slice of D007-A90: a bounded WebDAV experiment runner plus a
loopback HTTPS mock proof. It does not create an account, does not read or hold a real credential, does
not contact a real provider, does not contain real data and cannot be used for a live run in this
state. The readiness verdict this slice can support is `PRE_G6_LOCAL_READY` only; G6/G7 are not
authorized.

Authority (read-only, not copied into this package; they are **not present in the Base tree** — they
were added later on `main` and must be read from there):

- D007-A90 route design, especially §3 Phase 1, §4 run sheet, §5 STOP, §6 verdict.
- P0-STORE `DESIGN.md` (the binding Phase 1 design) and `QA_INSTRUCTION.md`.

Execution point: immutable Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`, branch
`exec/P0STORE-nutstore-probe-r1`. Node exactly **v22.23.5 x64**, built-ins only, no dependencies, no
lockfile, no CI.

## Phase 3 is a separate decision

A live run is never implied by this package. Phase 3 needs its own explicit user ACCESS-02/G6 approval
naming the exact probe commit SHA, the exact host, the run namespace and the operator, and the
credential is injected into the process environment by the user at run time. R3 makes that future run
*possible*; it performs no live request, sets no real credential and contacts no real host.

The live path is reachable only when all seven run-time checks pass, in order, before any secret read,
gate, socket or child process:

1. CLI `--live`;
2. plan `mode:"live"`, `protocol:"https:"`, the one pinned host, port 443, `probeParent`
   `/dav/LMS-P0STORE/`, runtime `pathPrefix` `/dav/LMS-P0STORE/<runId>/`, `pinnedCaFile:null`;
3. CLI `--approval <id>` matching `^P0STORE-ACCESS-02-\d{8}-[A-Za-z0-9]{4,16}$`; the committed live
   plan has `accessApprovalId:null`, so it can never self-authorize;
4. a fresh 32-hex `runId` from 16 random bytes; a plan-supplied run id is refused;
5. `P0STORE_WEBDAV_PASSWORD` present and non-empty — the value is not read until checks 1–4 pass;
6. Node exactly `v22.23.5` x64, otherwise `NODE_RUNTIME_MISMATCH` (test-stubbable, never
   environment-selectable);
7. every failure has its own reason code, produces zero transport calls and zero trace events, and
   `PHASE1_LIVE_ENABLED` is no longer consulted (retained only as a frozen-harness compatibility
   export).

Before the first request the CLI prints a redacted `P0STORE_PREFLIGHT` line (host, port, resolved
prefix, run id, approval id, budget, caps, Node version/arch) and any refusal exits non-zero. The
approval id is copied into the redacted trace header. No environment variable, flag or waiver can skip
a check. P1-12/P1-15 exercise the refusal matrix and the all-satisfied path with an injected counting
transport: no socket is created, no test names a real host, and no real credential exists.

## Components

| File | Role |
| --- | --- |
| `src/plan.mjs` | Closed-schema frozen-plan loader: L0–L12, per-step id/methods/synthetic target/expected oracle/request estimate, host+port+path-prefix pinning, file manifest (the only write/delete allowlist), budget, caps, timing. Unknown keys, extra/duplicate/missing/reordered steps, forbidden verbs, over-cap budgets and non-loopback test plans are rejected with dedicated codes. Live mode accepts only the one pinned host for `mode:"live"`, with a runtime `{runId}` placeholder, `runId:null`, and no committed approval id. |
| `src/gate.mjs` | The only network path. `https:` only; pinned host/port/prefix; verbs `PROPFIND` (Depth 0/1 only), `GET`, `HEAD`, `PUT`, `OPTIONS`, `MKCOL` (the single run directory only) and per-file `DELETE`; canonical path; manifest-only writes; conditional-write requirement; rolling 30-minute budget of 100 with 12 pre-reserved cleanup slots; 20 files / 1 MiB per file / 20 MiB total / 2 writers; strict TLS; redirect never followed; zero egress on refusal. |
| `src/secret.mjs` | The credential is read only at run time from the one environment variable named by the plan; it is redacted for every serialisation and refused when missing/empty/oversized/malformed, before a gate or socket exists. |
| `src/runner.mjs` | Executes L0–L12. L6 is a real cross-process race (two OS child processes per round, file barrier, both PIDs recorded). L8 sends the body, destroys the socket and resolves only from authoritative GET/PROPFIND, never by retry. STOP handling cleans up only certain identities and quarantines the rest. R3 live authorization (`authorizeLiveRun`) runs all seven checks in order before the secret read; the resolved live plan gets a fresh run id and a redacted pre-flight print. |
| `src/oracle.mjs` | Pure per-step PASS/FAIL/UNRESOLVABLE classification plus anomaly recording (weak validator, delayed visibility, unresolvable late ACK). |
| `src/verdict.mjs` | A90 §6 / A92 four-verdict rules (GO / PARTIAL / INCONCLUSIVE / NO-GO) with fixed precedence and root-cause-first `REASON@STEP` reasons. |
| `src/trace.mjs` | Redacted JSONL trace: method, path template + synthetic id, status, validator hash prefix, body SHA-256, duration and budget counters only. Headers, concrete paths, host names and bodies never enter it, and a line that would contain the credential is refused. |
| `support/mock-webdav.mjs` | TEST-ONLY loopback HTTPS WebDAV mock with 11 personalities and request/byte counters. |
| `support/harness.mjs` | TEST-ONLY harness. It evaluates the frozen A62 egress precondition at module load, before any test body, socket or child. |
| `plans/example-plan.json` | The frozen local example plan: loopback placeholder host `127.0.0.1`, fake run id, fake file ids, 13 steps. |
| `plans/live-nutstore-plan.json` | The committed live-readiness plan: the one pinned live host, port 443, `/dav/LMS-P0STORE/` parent, `{runId}` placeholders, `runId:null`, `accessApprovalId:null`, no pinned CA. It never runs live in this slice. |
| `scripts/mutation-check.mjs` | Guards first, copies the package + the one frozen dependency into a scratch tree outside the repository, applies one exact mutation per mutant and requires a named failing test. |
| `scripts/verify-candidate-scope.mjs` | Separate read-only candidate audit; not discovered by `node --test`. |

## Frozen plans

The local example plan uses only `127.0.0.1` / `localhost` / `::1` placeholders. Tests replace only
the ephemeral mock **port**; host, prefix, budget, caps, timing, file manifest and step table stay
frozen. The separate live-readiness plan names the one pinned host and port 443, uses the
`/dav/LMS-P0STORE/` parent and `{runId}` path placeholders, carries `runId:null` and
`accessApprovalId:null`, and has no pinned CA. It is byte-frozen and never executed live in this slice.

| Item | Value |
| --- | --- |
| Steps | L0–L12, exactly once, in order |
| Per-step fields | `id`, `methods` (a non-empty subset of the verbs that step may use; several steps need more than one verb), `target`, `oracle`, `requests`, `cleanupRequests` |
| Planned attempts | 89 (83 normal + 6 cleanup DELETEs) |
| Budget | rolling 30 min, `maxRequests` 100, `reservedCleanup` 12 → 88 non-reserved |
| Caps | ≤20 files, ≤1 MiB/file, ≤20 MiB total, ≤2 writers |
| Files | 8 manifest entries, all synthetic JSON under the run prefix |
| Run id | local fake id; live 32-hex id generated at run time from 16 random bytes |
| Read-after-write | 0 ms / 2000 ms / 10000 ms |

A refused request consumes no budget and creates no socket; the gate validates the whole request
(including method shape, canonical path, manifest membership, conditional header and body caps) before
`budget.tryAcquire()` and before the transport is invoked. `gate.stats.egress` counts transport
invocations and is asserted to be zero in the negative tests.

Only a `DELETE` carrying the explicit `cleanup: true` intent draws from the 12 pre-reserved cleanup
slots. L7's stale conditional `DELETE` is an experiment, not cleanup, and therefore counts against the
normal budget; the six L12 per-file cleanup deletes use the reserve. This keeps the plan's
`cleanupRequests: 6` and the runtime cleanup counter identical.

## Mock personalities (TEST-ONLY)

`strong`, `weak-etag`, `lost-update`, `create-overwrite`, `stale-read`, `late-ack`,
`unresolvable-ack`, `throttle`, `server-error`, `redirect`, `bad-cert`.

TLS material is generated at test time with the host `openssl` CLI into `os.tmpdir()`: a test CA, a
correct server certificate (`SAN IP:127.0.0.1, DNS:localhost`), a wrong-CA certificate, a wrong-CN
certificate and an expired certificate. These certificates are never trusted outside these tests; the
tests pass the generated CA to the gate explicitly and never write one into the repository. The mock
binds `127.0.0.1:0` only.

The `late-ack` and `unresolvable-ack` personalities engage only on the probe's synthetic `S-LATE`
payload, so the rest of L0–L12 keeps baseline semantics. That is server-side test behaviour keyed by
request content, not a probe runtime flag. `bad-cert` is the server's TLS material, not a handler
switch.

## Verdict rules (A90 §6, amended by A92/DEC-37)

Four verdicts, fixed precedence. `rule` names the deciding clause; `reasons` are root-cause first, in
run order, formatted `<REASON>@<STEP>` (for example `STALE_READ_VISIBILITY@L2` before
`STOP_CLEANUP_UNVERIFIED@L12`). Duplicate root causes keep their earliest step.

1. **NO-GO** (`NO_GO_EVIDENCE`) on any lost update (L5/L6), create-only overwrite (L2), stale
   conditional delete (L7), accepted invalid precondition, or acknowledged-winner bytes not surviving.
2. **INCONCLUSIVE** (`INCONCLUSIVE_BEFORE_L6_COMPLETE`) when the run STOPs or an outcome becomes
   unresolvable before L6 completed all five race rounds, without NO-GO evidence: no CAS conclusion is
   possible and a new approval would be needed to repeat.
3. **PARTIAL** (`PARTIAL_LIMITING_CONDITION`) when L6 completed all five rounds but a limiting
   condition remains: weak-only validator, delayed/stale visibility, unresolvable late ACK, cleanup
   that cannot be verified, another failing step, or a later STOP.
4. **GO** (`GO_ALL_CRITERIA_PASSED`) only when every step passed, L2/L5/L6/L7 prove CAS, L3 is
   immediately visible with a strong validator, L6 has 5/5 confirmed exactly-one-winner rounds, L8 is
   determinable 3/3, L11 hashes are equal, L12 verified an empty namespace and no STOP or anomaly was
   recorded.

| Personality | Verdict | First reason |
| --- | --- | --- |
| `strong`, `late-ack` | GO | — |
| `weak-etag` | PARTIAL | `WEAK_VALIDATOR@L3` |
| `stale-read` | PARTIAL | `STALE_READ_VISIBILITY@L2` (the earliest read-back observation; L12 cleanup STOP follows) |
| `lost-update` | NO-GO | `NO_GO_STALE_WRITE_ACCEPTED@L5` |
| `create-overwrite` | NO-GO | `NO_GO_CREATE_OVERWRITE@L2` |
| `unresolvable-ack` | PARTIAL | `UNRESOLVABLE_LATE_ACK@L8` |
| `throttle`, `server-error`, `redirect`, `bad-cert` | INCONCLUSIVE | `STOP_<RULE>@L0` |

STOP follows §5: abort, then per-file cleanup only for identities whose creation and latest validator
are certain; an uncertain identity is quarantined and never deleted. No STOP path retries a request.
`429`, unexpected `401`, repeated `5xx`, redirects, TLS/host anomalies, budget exhaustion and any path
outside the pinned namespace stop immediately.

## Deliberate implementations of ambiguous points

1. **No collection DELETE.** The gate permits per-file `DELETE` only, and the design's L12 says
   "delete run dir". Per-file-only is the stricter safety rule, so L12 deletes every probe file, then
   proves the run directory has zero children and is retained (empty). It never issues a `DELETE`
   against the run directory or any other collection.
2. **L11 "fresh sub-namespace".** The gate permits exactly one `MKCOL` (the run directory), so the
   restore target is a fresh set of unique file names inside the run directory with
   `If-None-Match: *`; hashes are compared against the exported sources.
3. **L9 attempt count.** L9 has four attempts: a network `PUT` into a missing collection (409), a
   network `GET` of an absent file (404), and two locally refused attempts (oversized body, path
   outside the namespace) that produce zero egress. The plan conservatively charges 4; the run still
   stays inside 88 non-reserved requests.
4. **L4 identical-byte rewrite.** The mock changes the validator on every write; the runner records
   whether it changed. Either recorded behaviour is acceptable under A90 §4 as long as it is
   consistent.
5. **L8 abort timing.** L8 destroys the socket only after the body has been flushed (`finish`) plus
   the frozen `abortAfterBodyDelayMs` (250 ms), so the server's commit is a genuine post-body event
   on loopback; the probe still never waits for a response and never retries. Resolution is a fresh
   authoritative GET plus PROPFIND over the same file.
6. **Trace templates.** File requests log the frozen path template plus the synthetic file id.
   Non-file targets log the fixed labels `{run-directory}` and `{probe-parent}`; no host or concrete
   path is ever traced.

## Exact commands

Node exactly `v22.23.5` x64 (the pinned executable in this checkout is
`runtime/node-v22.23.5-win-x64/node.exe`; `node` below means that executable). All suites must run
inside the accepted offline interval: on a connected host the frozen A62 guard fails closed with
`EGRESS_PRECONDITION_FAILED` before any socket or child exists. That is expected and is not a suite
result.

```powershell
cd packages/p0store-nutstore-probe
Get-ChildItem -Recurse -Filter *.mjs | ForEach-Object { node --check $_.FullName }   # every package .mjs
node --test                                                                          # guard + P1-01..P1-15
node scripts/mutation-check.mjs                                                      # guard + 22 named mutants
node scripts/verify-candidate-scope.mjs                                              # read-only candidate audit
```

`node --test` is not run online. The mutation driver and the audit are not part of `node --test` and
are not discovered by it.

## Programmatic use (test-only)

QA and the local tests drive the same exported surface without the CLI:

```js
import { runProbe } from './src/runner.mjs';
import { validatePlan } from './src/plan.mjs';
import fs from 'node:fs';

const plan = validatePlan({ ...JSON.parse(fs.readFileSync('plans/example-plan.json', 'utf8')), port: mockPort });
const result = await runProbe({ plan, ca: testCaPem, env: process.env, traceFilePath: null });
// result.refused / result.code / result.verdict / result.rule / result.reasons / result.steps /
// result.stop / result.cleanup / result.quarantine / result.budget / result.gateStats / result.trace
```

`ca` is a TEST-ONLY CA injection for the loopback mock; production live mode uses the system roots or
`plan.pinnedCaFile`. `createGate({ ..., transport })` is likewise TEST-ONLY and is refused unless
`allowTestHooks: true` is also passed; production callers never pass either. The probe sends HTTP
Basic authentication with the fixed synthetic user name `probe` and the runtime credential as the
password; a test mock can validate exactly that. `traceFilePath` is optional and must point into a
writable directory (the runner does not create it).

## Tests

| File | Coverage |
| --- | --- |
| `test/p1-01-plan-loader.test.mjs` | P1-01 closed schema, steps, verbs, budgets, caps, pinning |
| `test/p1-02-gate-pinning.test.mjs` | P1-02 host/port/prefix pinning, verb allowlist, canonical paths, manifest, zero egress |
| `test/p1-03-tls-redirect-stop.test.mjs` | P1-03 wrong CA/CN/expired, redirect STOP before follow; early STOP is INCONCLUSIVE |
| `test/p1-04-budget-caps.test.mjs` | P1-04 rolling window, reserved slots, delegated budgets, caps, writers |
| `test/p1-05-secret.test.mjs` | P1-05 redaction, missing secret, no trace/log/error/URL leakage |
| `test/p1-06-strong-go.test.mjs` | P1-06 full strong run → GO, budget ≤ 88 + 6, empty namespace |
| `test/p1-07-no-go.test.mjs` | P1-07 lost-update and create-overwrite → NO-GO + STOP |
| `test/p1-08-partial.test.mjs` | P1-08 weak-etag and stale-read → PARTIAL with root-cause reason order |
| `test/p1-09-late-ack.test.mjs` | P1-09 late-ack 3/3; unresolvable → `UNRESOLVABLE_LATE_ACK@L8` → PARTIAL |
| `test/p1-10-stop.test.mjs` | P1-10 early STOP → INCONCLUSIVE; later STOP → PARTIAL; uncertain cleanup quarantined |
| `test/p1-11-race.test.mjs` | P1-11 two PIDs, barrier, 5 rounds, one winner, no GO with 4/5 |
| `test/p1-12-live-inert.test.mjs` | P1-12 rewritten live-gating matrix: seven conditions, wrong hosts/port/prefix, zero transport, secret-not-read, exact real-host literal scan |
| `test/p1-13-upstream.test.mjs` | P1-13 strict upstream TAP (67/44 nested/103/91) and 94 pinned Base blobs |
| `test/p1-14-inconclusive.test.mjs` | P1-14 11-personality verdict matrix, reason order, synthetic precedence cases |
| `test/p1-15-live-gating.test.mjs` | P1-15 all-conditions stub transport: pre-flight, fresh run id, pinned target, canary scan; mutation-target refusal cases |

Every test imports `support/harness.mjs` first (P1-13 imports the frozen A62 guard directly and calls
it at module load). Every socket is loopback-only. P1-13 spawns the four upstream suites with
`--test-concurrency=1` (same files, titles and counts) because the frozen upstream guards have no
cross-process lock and several simultaneous PowerShell inventory queries can exceed the frozen 8 s
query timeout under load.

## Mutation driver

`scripts/mutation-check.mjs` first runs the frozen A62 egress precondition, then copies this package
plus `wp-01-synthetic-auth-api/support/platform-precondition.mjs` into a scratch tree **outside the
repository**. It runs the union baseline once, then one exact mutation per mutant and requires a named
failing test (a crash or timeout is classified separately and is not "killed"). It prints
`MUTATION_SUMMARY killed=N/N` and exits non-zero unless every mutant is killed. Twenty-two mutants:

| Id | Mutation |
| --- | --- |
| M01 | skip host/port pinning from the plan (hardcoded origin port) |
| M02 | follow a 3xx Location with a second transport call |
| M03 | disable TLS certificate verification |
| M04 | allow recursive/root DELETE (drop the Depth guard) |
| M05 | skip the pre-reserved cleanup budget |
| M06 | log credential material (trace redaction/refusal disabled) |
| M07 | treat a rejected 412 create as success |
| M08 | treat a missing 412 as success (lost update undetected) |
| M09 | blind retry after an unresolvable late ACK |
| M10 | treat an UNRESOLVABLE late ACK as a PASS |
| M11 | record a single process for both race writers |
| M12 | verdict GO despite one lost race round |
| M13 | delete a file whose identity is uncertain |
| M14 | map an early STOP to PARTIAL instead of INCONCLUSIVE |
| M15 | map INCONCLUSIVE to GO despite L6 not completing all rounds |
| M16 | place a later STOP reason before the root cause (reverse reason order) |
| M17 | accept a missing CLI approval |
| M18 | accept a mismatched or malformed CLI approval |
| M19 | accept a different live host |
| M20 | accept a live prefix outside the allowed parent |
| M21 | skip the exact Node runtime check |
| M22 | read the credential before authorization checks complete |

## Candidate scope and count-neutral negatives

`scripts/verify-candidate-scope.mjs` pins Base
`663556bc68dc0472f2f392f09ca4bee7c668d2f5`, 275 Base paths, exactly 31 whitelisted additions (30
package paths plus `docs/handoffs/P0-STORE/QA_HANDOFF.md`) and 306 HEAD paths, proves single-parent
linear history, byte- and mode-identical Base paths at HEAD, the 94-file protected inventory
(WP-01..04 packages, both fixtures, `tools/offline`), a clean checkout and a worktree equal to HEAD.
It accepts no argument or switch that re-targets or relaxes it.

Every negative is **count-neutral**: per-path checks run before any count check and each negative has
its own dedicated reason, so a modified Base path, an added path that replaces an approved one, a
modified protected blob, an untracked file, a mode change or a symlink fails with
`BASE_PATH_MODIFIED_OR_DELETED`, `UNEXPECTED_ADDED_PATH`, `PROTECTED_*`, `UNEXPECTED_WORKTREE_PATH`,
`BASE_PATH_MODE_CHANGED_AT_HEAD` or `WORKTREE_NON_REGULAR_PATH` respectively — never with a generic
path-count mismatch. The same rule governs plan and gate negatives: one dedicated code per condition.

## Not covered (NOT_COVERED) and NOT_RUN

- No real provider, real account, real credential, real data, real host or live request. Phase 3 is a
  separate user authorization.
- No Phase 2 account/credential work, no persistence, backup completeness, SLA, performance,
  browser/TLS UI behaviour or production claim.
- No Linux run in this slice (NOT_RUN); the Windows offline interval is the target environment.
- No request may leave loopback in Phase 1; the mock is the only server.
