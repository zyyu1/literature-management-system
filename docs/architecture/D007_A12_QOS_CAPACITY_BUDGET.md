# D007-A12 — Vendor-Neutral QoS, Performance, Capacity and Cost-Alert Budget

**Decision:** **D007-A12 Option B APPROVED**, 2026-11-23 (Europe/Berlin).  
**State:** **CAPACITY/QOS DESIGN ONLY — NO MEASUREMENTS, LOAD TESTS, PRODUCTION SLOS OR SERVICE DEPLOYMENTS APPROVED**.  
**Inputs:** [D007-A2 three modeling scenarios and costs](D007_A2_PROVIDER_COST_EVALUATION.md), [A3 conditional platform preference](D007_A3_CONDITIONAL_PROVIDER_PREFERENCE.md), [A4 authentication/session](D007_A4_AUTH_SESSION_SECURITY.md), [A5 confirmed/conflict/failure/unknown API semantics](D007_A5_API_CONTRACT.md), [A6 storage/backup truth](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7 privacy/retention](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A8 Zotero read-only API and device launch](D007_A8_ZOTERO_INTEGRATION.md), [A9 independent QA/fixtures](D007_A9_QA_FRAMEWORK.md), [A10 future work-package gates](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), and [A11 operations/incident response](D007_A11_OPERATIONS_RUNBOOK.md).  
**Frozen scope:** [Module 002 frozen UI / 26 U6 tests](../ui/002/DESIGN_APPROVED.md) remains unchanged; [POC-001 REMEDIATION-01](../handoffs/POC-001/REMEDIATION_01.md) remains on its original approved local branch/base/allowlist without rebase. Earlier independent QA on `65e14afc81e6de37ba5fac90c2937a27876c5614` was **LOCAL_STAGE PARTIAL**, new SHA re-QA still separate. POC-001-ACCESS-02 for real Nutstore **NOT AUTHORIZED**.  
**Out of scope:** no speed/performance promise, production SLO contract, selected cloud provider/service size, paid plan/domain, test code, synthetic load execution, real account/library/PDF use, UI modification, backend deployment, telemetry service, changes to POC-001 or merger of PR #2.

## 1. Decision distinction: workload model, design target, observed performance

Each future capacity claim must be tagged with one of the following independently auditable evidence states:

| State | Permissible statement | Not permissible |
| --- | --- | --- |
| `MODEL_INPUT` | A2's assumed monthly request count, egress and Worker CPU cost factors | “Users generated this traffic” or “instance can handle these peaks” |
| `DERIVED_AVERAGE` | Arithmetic average rate from a specified 30-day model | Inferred concurrent sessions, burst arrival distribution or measured request latency |
| `TARGET_PROPOSED` | Candidate performance and availability metric definition, testing method and later approval gate | Unapproved numeric p95/p99/SLO/RTO/RPO as binding commitment |
| `SYNTHETIC_LOCAL_OBSERVED` | Actual later approved mock/isolated test at exact SHA and fixed load profile | Real Nutstore CAS, actual Cloudflare/Render performance, external API SLA |
| `PROVIDER_TEST_OBSERVED` | Later separately authorized provider/account tier test at exact SHA, region, network and fixtures | Global all-device SLA or proof of restored user data from an isolated mock |
| `INDEPENDENT_QA_ACCEPTED` | Independently reproduced result then **separately accepted by Design** within explicit stage | Automatic merge/release, production performance guarantee |

**Priority is safety > integrity > truthful state > accessibility > responsiveness > cost optimization**. Under load, reject/throttle safely and retain drafts rather than return a false `Saved`, overwrite another device or blindly replay an `UNKNOWN` write. A UX timeout is a response-time observation, **not** evidence of whether a dispatched mutation committed.

## 2. A2 scenarios reproduced exactly; arithmetic is not a performance benchmark

A2 assumes a 30-day accounting month (2,592,000 s), dynamic **safe-API requests only** and aggregate **API outbound** bytes/traffic. Cloudflare static Pages requests are excluded. Worker mean CPU assumptions exist **only for the A2 billing comparison**, not for browser response time or any Node.js tier sizing.

| Scenario from A2 | API requests / 30-day month | A2 API outbound / month | A2 mean Worker CPU per request (model only) | Computed *uniform monthly mean* requests/sec | Interpretation |
| --- | ---: | ---: | ---: | ---: | --- |
| **S1 — light personal** | **20,000** | **0.5 GB** | **4 ms** | **0.0077 req/s** | Low-volume model; even “one researcher” can cause fast bursts during import or autosave |
| **S2 — regular personal** | **300,000** | **5 GB** | **6 ms** | **0.1157 req/s** | Higher interactive activity; no implied number of active users/devices |
| **S3 — stress/growth** | **12,000,000** | **80 GB** | **10 ms** | **4.6296 req/s** | **Cost stress hypothesis**, not a personal-user forecast or proof one instance survives a peak |

**Rate formula:** `averageRps = monthlyApiRequests / (30 * 24 * 60 * 60)`. These decimals are mathematical averages **only**. A 0.1157 req/s monthly mean could coexist with 100 simultaneous requests at one instant; neither maximum requests/sec, concurrent writers, WebDAV operation count, cache-hit rate nor burst duration can be deduced from the A2 monthly numbers. GB are A2 rounded billing units, not measured payload histograms.

**Sizing evidence still missing:** traffic time series (arrival process), multi-tab/mobile autosave fan-out, import/annotation picker pagination, per-request outbound subrequests and payload distributions, network RTT, TLS handshake, storage contention, CPU time versus wall time, memory high-water mark, active Session store overhead, disk/log/backup footprint, and actual cloud tier settings.

## 3. Workload specification to be filled before any load execution

A future separately approved workload profile must define for **S1, S2 and S3** all of:

- **Operation mix:** percentages and actual rates of auth/session, Project/List/Detail reads, canonical Zotero metadata reads, Research Note Save Now/autosave, global ReadingStatus, Project Important and Association mutations, Key Quote Add/Relink, batch Unlink, and read-only Personal Workspace calls. No mix or frequency is silently chosen by A12.
- **Client arrival envelope:** sustained rate, ramp, short burst peak, burst duration and recovery/saturation window, scheduled background activity **only if future authorized**, clients/tabs/devices, distinct principals, and concurrent **independent writers to the same note/version** versus parallel reads. A single monthly mean is insufficient.
- **Data/payload:** representative synthetic three-Project/multi-library dataset, five-field Markdown with Unicode/LaTeX, multiple fake attachments/annotations without PDF bytes, Key Quote history depth, page sizes and independent external-response stubs with fixed seeds and hashes.
- **Environment:** exact implementation SHA, CPU/memory limits, selected runtime region, service instance/concurrency, session-state backend, simulated or permitted real WebDAV/Zotero, network mode, clock, browser/OS, cache state (cold/warm) and build/release version.
- **Failure schedule:** independently dispatched duplicate operation ID, stale `If-Match`, delayed remote commit after timeout, 401/403/409/412/429, `Backoff`, 5xx, network disconnect, revoked session, upstream quota exhaustion, corrupted backup manifest and unsupported real-provider atomicity.
- **Evidence:** raw sanitized request event records retained only under later approved policy, measured distribution counts and errors, client and server monotonic durations, protected operation outcome ledger if independently proven, resource usage and billing observation, independent QA report at exact SHA.

Any test using real Nutstore, Zotero, user files, or physical device launches needs **separate** consent and scope. A12 does not authorize tests even with synthetic fixtures.

## 4. Performance/availability SLI definitions and future SLO decision method

| Measure (candidate SLI) | Measurement contract | Numeric target and evidence state |
| --- | --- | --- |
| **Client navigation / time to usable page** | Per Page type (Projects Home, Literature, Research Note, Key Quote), device/browser/network class; separate initial load vs warm navigation, rendering/interaction blockers, accessibility/focus; consider LCP/INP/CLS with specified browser measurement methodology | Thresholds for LCP/INP/CLS and page-ready p50/p95 **UNDECIDED**; frozen UI behavior cannot be traded away for speed |
| **API request latency p50/p95/p99** | End-to-end client-observed elapsed time and independent API-server span; by **GET vs mutation**, route family, `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN`, cache status and test environment. Include slow/timeouts as failures or censored measurements; never discard them to improve percentile | p50/p95/p99 **defined but no threshold or sample/window minimum chosen**; p95 is the 95th percentile of a declared cohort, not “95% requests confirmed” |
| **Write acknowledgment latency** | Time from user's write intent to **verified authoritative persistence outcome**, not time to show spinner/HTTP 202; track accepted-but-unverified and time to user-visible safe state separately | No deadline guarantee while Nutstore CAS/ledger is unproven; a slow truthful UNKNOWN is safer than a fast false Saved |
| **Conflict and UNKNOWN rate** | Denominators are all authorized mutation **attempts** at the original operation identity, distinct from HTTP request attempts. Track `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN` as disjoint outcomes **only if reconciliation ledger is proven** | No acceptable production UNKNOWN percentage chosen. Conflict may be a correct safety refusal under two-writer race, not automatically an availability failure |
| **Read-service availability** | Successful authenticated, authorized data reads divided by eligible read intents over explicitly chosen observation windows; 401/403 due to correct security policy tracked separately (not a service error) | Monthly/weekly denominator, exclusion policy and SLO **UNDECIDED**; safe read-only fallback must not leak stale private data |
| **Write-service availability** | Eligible mutation intents that achieve **authoritatively `CONFIRMED`** within a later defined response/recovery bound; unsupported/unknown states separately exposed and included in completeness reporting | **No 99.x% promise**. Rate limiting/conflict under correct safety constraints is reported, not mislabeled universal outage |
| **Client session/CSRF/auth** | Revocation recognized across instances, unauthorized access denied, credentialed CORS exact-origin checks and error-time recovery; not a latency-only success | Security requirements are **hard pass/fail**, not adjustable numeric SLOs |
| **Zotero same-device handoff** | L1 launched App, L2 correct PDF open, L3 original annotation focused **separately** by OS/browser/Zotero version and Stored/Linked attachment type | A8 M1..M8 **NOT RUN**, no universal device success or timing target; an emitted URI is not proof |
| **Backups / recovery** | Consistent, encrypted/authorized restore-certified snapshots, independently verified restoration with correct source history/deletion anti-resurrection | Snapshot validity, RPO/RTO **NOT PROVEN**; hashing one file does not satisfy backup SLO |

**Measurement plan:** pre-register numerator/denominator, start/end timestamps, client+server boundaries, timeouts and censored samples, nearest-rank/declared quantile method, per-environment/operation cohorts, observation window, fixture profile and minimum sample size (numeric size **TBD**). Report count, cohort, p50, p95, p99, errors, UNKNOWN, successful persisted outcomes and missing/uncertain measurements together. The right latency metric for a confirmed write cannot exclude slow lost acknowledgments merely because the server never returned a `200`.

**Design → calibrated target approval:** collect local synthetic baseline only after authorization; independently QA exact SHA; then separately approved provider/region experiments; compare worst-case write correctness and credible samples; **user/Design explicitly approves numeric SLO thresholds and error budgets** before any release promise. Synthetic results cannot set an external provider guarantee by fiat.

## 5. Concurrency, backpressure and request-budget design

1. **Separate admission queues** for reads, resource-revision-guarded writes, Zotero metadata reads, optional recovery/verify (only if reliable ledger exists), and future background operations (not authorized). Restrict per-principal/per-Project and per-upstream host; prevent one Collection import, autosave burst or batch operation from starving a note Save/Logout/revocation. Concrete queue sizes and concurrent request caps are **UNDECIDED**.
2. **Resource-level concurrent writes:** two devices editing same global five-field Note require authoritative storage CAS or equivalent proven guard, `428` missing/ `412` stale precondition and honest conflict UX. Project Important is Project×Paper scoped, not global. A single-instance mutex is **not cross-process atomicity**.
3. **Idempotency and UNKNOWN:** operation IDs and an in-process cache alone do not ensure globally at-most-once or safe replay after restart. For a potentially dispatched request with lost acknowledgment, retain last confirmed revision and unsynced draft, do not retry without a proven durable operation result/fence. Saturation-induced timeouts **must not** change `UNKNOWN` to `DEFINITE_FAILURE`.
4. **Controlled backpressure:** when overloaded, throttle/queue only within a later proven memory budget and visible status, or reject **before dispatch** with an honest rate-limit response (e.g. 429 with appropriate retry guidance for *safe fresh intents*), never emit `Saved` or silently drop queued writes. A `429` received *after possible upstream dispatch* cannot prove no commit; guard by operation state.
5. **Zotero API:** A8 references official read-only Web API `Backoff`, `429`/`Retry-After`, `Link` paging and recommendation of generally **at most 4 concurrent Zotero calls** (source guidance, not an independently measured SLO or an approval to call APIs). Use a bounded, cancelable user-triggered request scheduler; no aggressive polling or all-library mirroring. Credentials and annotation contents stay server-side/authorized.
6. **Candidate second Nutstore WebDAV:** production concurrency, quota and ETag behavior **UNKNOWN** until real provider testing under separately approved ACCESS-02. [POC-001 ACCESS-01](../handoffs/POC-001/ACCESS_POLICY.md) specifies **at most 100 requests per rolling 30 minutes, 20 disposable files, 1 MiB per file, within a per-run directory** for that future test account **only**. **Do not transfer this test-account cap as a production service quota**, and never use A12 to consume the budget now. 401/429, unsafe TLS/host, failed CAS and unverified state trigger STOP under POC security.
7. **Independent per-upstream budgets:** allow future owner-approved caps for Zotero reads, WebDAV operations, API client requests, Session log/revocation and backups; model API requests vs upstream subrequests distinctly. A user action can trigger multiple upstream requests, so A2 monthly API count does not equal Nutstore/Zotero billable/limit count.
8. **Graceful degradation:** allow only proven safe reads/cached *properly authorized* metadata and export of unsynced drafts as approved by frozen UI. If writes cannot safely complete, display blocked/UNKNOWN honestly. Do not secretly degrade to last-write-wins, weaker authentication, unsafe storage, PDF mirroring or broken Android deep links to achieve an SLO.

## 6. Mobile responsiveness, accessibility and attachment behavior

| Budget dimension | Required future profile and proof |
| --- | --- |
| Mobile navigation and rendering | Separate iPhone Safari, iPad Safari, Android Chrome/available alternative and Windows/macOS browsers, on specified device models, OS, viewport, connection shape and throttling. Record page-ready, interactivity, LCP/INP/CLS, keyboard focus/IME and reading experience under exact frozen UI states |
| Data/page size | Bound payload and loaded record count by API/page type, support pagination and safe cache isolation; test a 3-Project/multi-paper fake library and larger manual Collection; actual payload KB limits **TBD**, no implicit truncate/lossy Markdown |
| Editor responsiveness | Measure five-field Markdown keystroke/preview and large-text IME composition, autosave queue behavior and offline/unknown draft safety separately. No background silent discard or artificial Save spinner counted as confirmation |
| Deep-link launch | Report API/local UI response separately from L1 app handoff, L2 PDF and L3 annotation; actual device may require Zotero client file sync/on-demand downloads. No website PDF copy or inferred Android support |
| Device energy/network | Record API requests per explicit UI action, mobile network egress and upstream fan-out under fake fixtures; avoid needless polling and busy-loop resume. No battery-life claim without device evidence |
| Accessibility | Keyboard, screen-reader, safe-area, high zoom, error announcements and focus recovery must remain correct even under throttling, fallback or offline. Performance tuning cannot remove frozen UI confirmations |

A12 does not amend any Module 002 layout or interaction rule, and no real Zotero app/file has been opened. Device performance targets and actual app-platform compatibility remain **NOT RUN**.

## 7. Resource envelopes: design sizing to validate, not a SKU commitment

**Proposed per-component budget record** (all numerical limits TBD):

| Component | Resource/capacity to track | Validation evidence prerequisite |
| --- | --- | --- |
| Static Pages frontend | JS/CSS asset bytes per route, hydration/initialization CPU, first-load vs warm cache, request count, mobile data load | Authorized browser synthetic profilers on pinned device/network; no promise that Pages cache behavior is uniform |
| Secure API process | CPU time per action, peak RSS/heap, event-loop queue/delay, request and connection concurrency, session validation, authZ and response sizes | Actual isolated Node/Worker runtime under separately approved sandbox/provider, not A2 worker-billing CPU assumptions |
| Zotero adapter | Requests per user-triggered lookup, pages to completion, concurrency/Backoff, upstream 401/403/429, transfer bytes | API mock then separately approved scoped Zotero user/group library; no credential or real data yet |
| WebDAV candidate data adapter | File/object and operation count, PUT/PROPFIND/GET/DELETE subrequests, request duration, TLS, ETag/If-Match, concurrent writes and unknown acknowledgments | POC local synthetic re-QA and, only after ACCESS-02, real Nutstore protocol tests; not proven today |
| Durable session/operation store | Live sessions, revocations, TTL and capacity for a **proven** durable dedupe/operation ledger, retention and fault handling | Backend identity store not selected; do not invent Redis/KV/DB or assume a global in-memory Map is durable |
| Backup/restore | Total logical bytes, backup copies, manifest hash work, remote transfer and consistent snapshot fences, restore rehearsal | A6/A7/A11 separate synthetic design, exact SHA and proven provider-safe restore; A2 egress excludes many backup costs |

**A2 resource hypotheses only:** Workers billed 4/6/10 ms mean CPU and assumed request volume; Render 0.5 CPU/512 MiB for S1/S2 and 1 CPU/2 GiB for S3; Hetzner CX23/CX33/CX43. **None of these sizes is a capacity certification.** A3 Render Frankfurt remains a conditional candidate, not selected supplier. Any actual resizing, autoscaling, purchase or new cache/queue/storage service is a separate Design/Execution/Supplier decision.

## 8. Financial budgets and predictive alerts (without invented limits)

- **Keep A2 currencies separate:** modeled API+hosting cash costs (S1/S2/S3) are **Workers $5 / $5 / $7.40 monthly**, **Render $7 / $7 / $36.25 monthly**, and **Hetzner €7.09 / €10.69 / €19.69 monthly** *under A2 assumptions*, excluding real second Nutstore, domain, identity/Session storage, backups, monitoring, staff time, VAT/FX etc. These are **planning cash-cost floors, not all-inclusive TCO or actual bills**.
- **Budget schema (not approved values):** `billingCurrency`, user-approved `monthlyHardCap`, `annualCap`, category caps (API, egress, server, secrets, auth, monitored logs, backups, additional WebDAV account, domain), provider billing tier, alert recipient, cost attribution, VAT and FX assumption. **No budget caps or alert thresholds have been approved**, no billing service connected.
- **Forecast formula:** `projectedMonthCost = observedCostToDate + expectedUsageRemainder * documentedTierPrice` after provider billing data is actually available. A standalone projection is not a bill. Track `projected / approvedCap` ratio **only if the denominator exists**, and split fixed monthly charge, variable per-request/CPU/GB, backup, monitoring and incident costs; no mixed USD+EUR arithmetic without dated FX.
- **Alert policy proposal:** flag missing cost visibility, rapid change in usage mix, expected overrun of a **later user-approved cap**, unexpected paid API, uncontrolled retry storm and regional option fees; choose thresholds/windows/action destinations only after measured profile and user approval. Even after configuration, a budget alert does not by itself authorize cancellation, deletion or provider migration.
- **Rollover scenarios:** when S3 workload threatens caps, prefer explicit throttling / safe read-only and a user decision over unapproved automatic plan upgrades or hidden downgraded security. Do not suppress UNKNOWN acknowledgment or credential leak alerts to reduce cost.

**Cost and reliability tradeoff:** A low-cost tier that cannot safely verify remote CAS/session revocation or restore the user's private notes is not acceptable irrespective of its A2 weighted score.

## 9. RPO/RTO, availability and capacity targets: explicit decision method

**RPO (Recovery Point Objective)** = allowed loss window of *confirmed website-owned data* after a disaster; **RTO (Recovery Time Objective)** = time allowed to restore safe core service. Neither metric describes how long an individual API request takes. A cached browser draft does not automatically reduce confirmed-data RPO or create a multi-device backup.

**Method to propose numeric goals later (none decided here):**

1. **Classify data and affected operations:** confirmed five-field Note, per-Project Important/Associations, global ReadingStatus, saved Key Quotes/SourceHistory, per-device unsynced drafts and external Zotero data (authoritative separately). Distinguish “never tolerate confirmed write loss” as an **integrity design aspiration** from proven zero-loss RPO.
2. **Specify user impact and recovery dependency:** acceptable period unable to read/write, expected outage scenarios, browser-offline semantics, last verified snapshot and actual network/provider capacity, manual recovery workload and realistic personal operator availability. Decide whether to prioritize safe read-only service over full writes.
3. **Validate consistent backup frequency and restoration:** no RPO value from mere backup schedule; prove manifest + cross-entity consistent snapshot + anti-resurrection + independently exercised restore to an isolated location and safe cutover/rollback. If provider cannot support this, return to **D007 storage architecture**.
4. **Model incident timelines:** detection, human response, credential rotation, traffic containment, restoring a clean version and verifying authorized data integrity; collect observed end-to-end rehearsal durations before approving any RTO number. Do not assume 24/7 on-call.
5. **Obtain explicit user/Design approval** for concrete RPO/RTO/SLO, availability observation window and error budget after synthetic mock QA **and** separately authorized candidate-provider experiments. Record what cannot be promised and fallback paths. Do not call an unmeasured target an SLA.

**Failure categories:** RPO or restore proof unavailable = `UNVERIFIED/BLOCKED`, not pass. P0 data integrity/cross-user privacy stops production regardless of p95 latency or S3 throughput. A strong read availability value cannot hide failed writes. Future vendor official availability/SLA is independent of actual end-to-end personal system behavior.

## 10. Future independent acceptance / performance experiment design (NOT RUN)

The 16 A12 cases below are **design targets only**, not an addition to the current POC-001 repair scope, the 26 frozen Module 002 UI scenarios or the 60 earlier D007-A4..A8 planned tests.

| ID | Future synthetic and separately approved provider evidence |
| --- | --- |
| **A12-01** | Recompute A2 monthly S1/S2/S3 and uniform-average req/s exactly without translating average into peak; provenance and unit tests |
| **A12-02** | Three recorded future load mixes per scenario, explicit bursts/device count and distinct synthetic read/write resource groups, no real user data |
| **A12-03** | Report API p50/p95/p99 and client-observed latency with sample sizes and timeouts included; no fabricated p95 on a single sample |
| **A12-04** | Confirmed-only write ACK latency and separate UNKNOWN duration; `202` not Saved, 5xx/lost ack not blindly DEFINITE_FAILURE |
| **A12-05** | Two-client stale global Note writer under saturation returns conflict/unknown without lost edits or optimistic Saved |
| **A12-06** | Same operation ID races and API crash/restart show no assumed durable/global dedupe without a proven ledger |
| **A12-07** | Simulated Zotero multi-page API honors `Backoff`, `Retry-After`, bounded concurrency and per-item limits, no background mirror |
| **A12-08** | Synthetic WebDAV burst/proxy errors/401/429 stop safely; POC-001 100/30m/20files/1MiB remote test limit not inferred as production quota |
| **A12-09** | Phone/tablet/desktop browser synthetic loading, large five-field note/IME/keyboard and preview responsiveness per device class without changing frozen UI |
| **A12-10** | Browser app deep-link L1/L2/L3 remain NOT RUN unless physical evidence; URI produced is not an actual PDF-opening success |
| **A12-11** | API CPU/memory/queue and upstream call fan-out measured separately from Worker billing CPU cost-model assumptions |
| **A12-12** | Report read availability and authoritative write availability using declared denominators, including UNKNOWN and correct authorization rejections |
| **A12-13** | Under overload or budget exhaustion, reject early/fail closed or safely read-only; preserve unsynced draft and no automatic unsafe retries |
| **A12-14** | Future cost projection compares currency-specific scenario inputs to **user-approved** budget (if any); no auto-upgrade or phantom invoices |
| **A12-15** | Isolated backup/restore drill measures actual timestamps, consistent snapshot, deleted-Project anti-resurrection and RPO/RTO *only after approved run* |
| **A12-16** | Independent QA pins exact code/fixture/environment SHA and risk disposition; no live provider, cloud service, POC-001 branch or real PDF affected by A12 |

**QA data contract:** full tested 40-char SHA, approved base/branch/path allowlist, fixture hash, synthetic/provider truth flag, OS/browser/runtime/instance/network profile, actual commands/exits, latency histograms with sample count, CPU/memory/egress/request counts, retries/timeout/UNKNOWN traces, achieved vs target (only where target user-approved), P0/P1/P2 issues, redacted evidence and independent QA + Design disposition. A “test planned” entry remains `NOT RUN`.

## 11. Hard STOP conditions and governance

- **Immediate STOP:** confirmed false Saved/Deleted, unexpected unguarded stale overwrite, duplicate unsafe mutation due to concurrent writer/operation ID, cross-user access, unsynced note loss, credential/PDF/annotation leak, unauthorized upstream calls or inability to revoke sessions.
- **Block provider/release:** any unsafe WebDAV CAS, unproven backend operation ledger used as fact, non-restorable backups, unbounded quota/egress, unknown privacy/data-region issues or resource tier not independently capacity tested. Do not turn unknown evidence into “meets SLO”.
- **POC-001:** original local REMEDIATION-01 governs remediation; independent original QA **LOCAL_STAGE PARTIAL**; later re-QA on new exact head is required. **No rebase, merge or ACCESS-02** authority emerges from A12. No real Nutstore requests.
- **Zotero/Devices:** no real Zotero auth, library import, mobile Zotero handoff or PDF bytes. Stored versus linked attachment and iOS/Android behavior remain D007-A8 device-test gates.
- **Design-only release:** D007-A12 approves *measurement definitions and scenario planning*, not numeric SLO targets, service purchase, selected Render/Workers/Hetzner SKU, identity/backup store, alert dispatch, migration, QA execution or deployment.
- **Future G0–G7:** bounded execution, exact-SHA independent QA, Design acceptance, separate merge, real provider access and release are distinct user-gated events under D007-A9/A10. A12 creates no auto-promotions.

## 12. Next independent design decision

**D007-A13 — environment separation and configuration/secret-promotion boundaries**: select a **provider-neutral separation policy** for local synthetic development, independent QA/staging and later production environments; define safe fixtures vs real secrets, per-environment identity/Session/source boundaries, non-production data handling and reviewable promotion/rollback gates. This is an architectural decision that can be made without creating accounts, buying a domain, selecting auth/session vendors or deploying.

**FINAL DISPOSITION:** **D007-A12 OPTION B APPROVED AS QoS/CAPACITY DESIGN ONLY**. **S1/S2/S3 = ASSUMPTIONS, NOT MEASURED THROUGHPUT; P95/SLO/RPO/RTO/ALERT NUMBERS UNDECIDED; 16 A12 TESTS NOT RUN; POC-001/FROZEN UI UNCHANGED; NO CODE/LOAD TEST/ACCOUNT/DEPLOYMENT.**
