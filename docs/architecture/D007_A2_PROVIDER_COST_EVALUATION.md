# D007-A2 — Cloud Platform Candidates, Cost Scenarios and Risk Evaluation (APPROVED Option B)

**Decision:** D007-A2 Option B approved by user, 2026-11-23 (Europe/Berlin).  
**Status:** **EVALUATION APPROVED / NO HOSTING SUPPLIER SELECTED, NO DEPLOYMENT, PURCHASE, CLOUD ACCOUNT OR BILLING AUTHORIZED**.  
**Upstream architecture:** [D007-A1 split static frontend + separately deployable authenticated lightweight API](D007_A1_LOGICAL_DEPLOYMENT.md), not modified.  
**POC:** [POC-001 scope](../handoffs/POC-001/DESIGN_APPROVED.md) and [ACCESS-01 policy](../handoffs/POC-001/ACCESS_POLICY.md) remain controlling and unchanged. This comparison does not authorize any live WebDAV or Zotero access.  
**Pricing checked:** 2026-11-23 against the primary-provider references in §9. USD and EUR **are not combined or converted** because foreign-exchange assumptions and taxes/actual billing have not been selected. No costs have been incurred.

## 1. Candidate short list: same frontend, independently deployable API

| Candidate | Frontend | Independent safe API | Region/data residency (NOT guaranteed compliance) | Vendor-specific caveat |
| --- | --- | --- | --- | --- |
| **CF-W** — Cloudflare Pages + Workers | Pages static CDN | Separate Workers service/function; per-request serverless, secrets and HTTP fetch | Global edge by default; dedicated Regional Services/Data Localization configuration may restrict execution but **Workers code and secrets can still be deployed globally** and outgoing subrequests are not automatically regionalized. Strict EU-only requirement needs product/config/legal assessment and price check | 128 MiB Worker memory, Free 10ms CPU/invocation and 100k daily requests; Paid 5min max CPU/invocation, 10,000 subrequests/request default; environment Node compatibility and WebDAV conditional headers require actual tests |
| **CF-R** — Cloudflare Pages + Render API | Pages static CDN | Separate Node.js web service/container; Render Hobby workspace and paid compute tier | Render lists **Frankfurt, Germany** as a selectable API region. Static Pages remains on global Cloudflare CDN; logging, backups, secrets and outbound Zotero/Nutstore services need independent data-flow review | Starter 0.5 CPU/512 MiB may be too small for concurrency; plan changes and outbound egress meter can increase costs. No inherent backend concurrency/atomic writes |
| **CF-H** — Cloudflare Pages + Hetzner Cloud VPS API | Pages static CDN | Independently operated VPS-hosted TLS reverse proxy + Node API | Select **Falkenstein or Nuremberg (Germany)** for the VPS; this is a region choice for the API machine, **not** a claim all CDN, Zotero, Nutstore or logs remain in the EU | Must operate OS updates, firewall, TLS, secret rotation, backup/restore and incidents. Hetzner lists EU locations; shared vCPU stock and sizing not guaranteed |

**Important:** D007-A1 requires logical deployment separation, **not different providers**. All three candidates preserve independent static frontend and API artifacts. None of them supplies strong consistency for Nutstore files automatically; a Worker, Render instance or VPS lock is not proof of distributed atomic storage.

## 2. Official platform tariffs and quota/limit assumptions

| Cost or limit | CF-W | CF-R | CF-H |
| --- | --- | --- | --- |
| Static frontend | Cloudflare Pages static-asset requests free/unlimited at published tariff, subject to build/file limits | Same | Same |
| Base API plan used in model | Cloudflare Workers **Paid $5/mo** minimum account charge, **10 million billable Worker requests/mo + $0.30 per extra million; 30 million CPU-ms/mo + $0.02 per extra million CPU-ms** | Render Hobby workspace **$0 plan fee** + paid web service **0.5c–512 MB $7/mo**, higher **1c–2 GB $25/mo**; note 512 MiB capacity is not independently tested | Hetzner **Germany** CX23 **€5.49/mo**, CX33 **€8.49/mo**, CX43 **€15.99/mo** excluding VAT and IPv4 (official June 2026 adjustment, German location) |
| Variable usage modeled | API requests + Worker CPU-ms; static assets excluded, no additional paid Workers egress charge at published tariff | Hobby includes **5 GB outbound bandwidth/mo**, extra **$0.15/GB**; traffic includes outbound service requests to upstreams and responses to browsers | Public primary IPv4 **€0.50/mo** (IPv6 free); Hetzner Cloud backup option **20% of server monthly fee** for 7 rotating slots; EU cloud traffic generally >=20 TB included; overage/extra snapshots unspecified |
| Not captured in model | Data Localization Suite/Regional Services price and compliance, KV/DO/storage add-ons, custom security features, future logs pricing | Pro/Scale workspace upgrades, SSD, additional domains, runtime peak scaling, logging/monitoring, extras | Extra admin hours, offsite/app-consistent backup beyond basic VM snapshot, paid monitoring, traffic overage, reverse proxy/TLS tooling |
| Security / session support | Workers secrets bindings, custom validation and explicit auth still required; CORS is not auth | Render environment variables/secret files, HTTPS and Frankfurt selection; per-user auth and secret rotation still need design | Cloud OS/process secret storage, firewall, Linux hardening, cert renewals and operations fully self-managed |
| Critical compatibility proof | HTTP(S) fetch, ETag/If-Match forwarding and WebDAV status behavior in **real Worker runtime**; 128 MiB/CPU/connection behavior | Full Node.js HTTP/WebDAV client, TLS, proxy, timeout/stream and concurrent requests on **actual selected service tier** | Node.js WebDAV client, TLS, host pinning, uptime/recovery under selected OS and size; no assumption of atomic remote WebDAV writes |

Official documents indicate Workers Paid usage is billed by requests and CPU, not by network waiting wall time, but CPU-heavy parsing can still add cost. Free Workers is excluded from the comparative baseline: the 10-ms CPU and daily free cap are unsuitable as an **assumed** default for reliable API behavior; this is a planning choice, not a statement that Free cannot work.

**Cloudflare residency warning:** Regional Services can constrain edge request processing for configured hostnames, but official docs explicitly say Workers code and secrets can be deployed globally and outgoing subrequests are not necessarily covered. **Do not advertise “EU-only storage/processing” from this evaluation.** Render Frankfurt or Hetzner Germany determines API compute placement, not the location of Cloudflare CDN, Zotero, Nutstore, telemetry or downstream data flows.

## 3. Three reproducible synthetic usage scenarios

These are **NOT observed users or measured POC workloads**. “API calls” means dynamic requests reaching the safe API only; static Cloudflare Pages/CDN requests excluded. Egress is **API outbound traffic** (not GB stored in WebDAV). Requests are aggregated monthly; peak rate, concurrency, wall time and upstream rate limits require separate testing. 30-day billing approximated by full monthly subscriptions, 12 equal months/year.

| Scenario | API requests/month | Mean Worker CPU per request | API outbound GB/month | Render assumed size | Hetzner assumed size | Purpose |
| --- | ---: | ---: | ---: | --- | --- | --- |
| **S1 — light personal** | 20,000 | 4 ms | 0.5 GB | 0.5c / 512 MB ($7) | CX23 | Low volume, single researcher |
| **S2 — regular personal** | 300,000 | 6 ms | 5 GB | 0.5c / 512 MB ($7) | CX33 | Higher save/search activity; tier selection is a conservative illustrative assumption |
| **S3 — stress/growth** | 12,000,000 | 10 ms | 80 GB | 1c / 2 GB ($25) | CX43 | Extreme safety/billing sensitivity, **not** a forecast for one user |

**Caution:** Applying 12 million/month to a single personal deployment is deliberately a stress test for cost scaling, not a likely user count. Neither the Render instance sizes nor Hetzner shared-vCPU plans are certified to handle those peaks. Quotas and autoscaling remain to verify.

## 4. Modeled infrastructure cash costs (monthly + annual)

| Candidate | S1 month | S1 year | S2 month | S2 year | S3 month | S3 year | How calculated |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| **CF-W (USD)** | **$5.00** | **$60.00** | **$5.00** | **$60.00** | **$7.40** | **$88.80** | $5 base + max(0, calls − 10m)/1m × $0.30 + max(0, calls × mean CPU-ms − 30m)/1m × $0.02 |
| **CF-R (USD)** | **$7.00** | **$84.00** | **$7.00** | **$84.00** | **$36.25** | **$435.00** | Selected instance $7/$25 + max(0, API outbound GB − 5) × $0.15 (Hobby) |
| **CF-H (EUR)** | **€7.09** | **€85.06** | **€10.69** | **€128.26** | **€19.69** | **€236.26** | DE CX23/CX33/CX43 + €0.50 IPv4 + 20% VM-backup surcharge; calculations use unrounded totals then round display |

Workers S3 explicitly: $5 + (12m−10m)/1m×$0.30 = $0.60 request overage; CPU 12m×10ms=120m CPU-ms, (120m−30m)/1m×$0.02=$1.80 CPU overage; total **$7.40/mo**. Render S3: $25 + (80−5)GB×$0.15 = **$36.25/mo**.

**These values are provider cash-cost floors under the stated model, NOT all-inclusive TCO or vendor quotations.** No FX conversion; the Hetzner EUR total cannot be ranked dollar-for-dollar against the USD totals without a separately chosen date/rate. Also excluded: subscription for second Nutstore account, Zotero-related paid services if any, domain/DNS, third-party auth, extra Cloudflare EU localization, taxes/VAT, external backups, logs, data processing, migration, monitoring, incidents and cloud billing/account setup. The website does not store PDF bytes, so do not inflate website storage by a copied-PDF assumption.

## 5. Human operations cost and total-cost-of-ownership (TCO) sensitivity

Illustrative **shadow labor rate = €25 per operator hour**, **not a cash payment or user wage**, assuming one person maintains the service. Labor estimates are a separate heuristic, not a vendor charge. Work includes upgrades, backup verification, key rotation and troubleshooting; zero-hour ops should not be assumed.

| Scenario | CF-W hours / € monthly (yearly) | CF-R hours / € monthly (yearly) | CF-H hours / € monthly (yearly) |
| --- | --- | --- | --- |
| S1 | 1 h / €25 (€300) | 1 h / €25 (€300) | 3 h / €75 (€900) |
| S2 | 2 h / €50 (€600) | 2 h / €50 (€600) | 5 h / €125 (€1,500) |
| S3 | 6 h / €150 (€1,800) | 6 h / €150 (€1,800) | 10 h / €250 (€3,000) |

**TCO representation without mixing currency:**
- **CF-W:** S1 `$5/mo + €25/mo modeled labor`; S2 `$5 + €50`; S3 `$7.40 + €150`, **plus unpriced shared dependencies**.
- **CF-R:** S1 `$7 + €25`; S2 `$7 + €50`; S3 `$36.25 + €150`, **plus unpriced shared dependencies**.
- **CF-H:** S1 `€7.09 + €75 = €82.09/mo`; S2 `€10.69 + €125 = €135.69/mo`; S3 `€19.69 + €250 = €269.69/mo`, **plus unpriced shared dependencies**.
Annual totals follow the monthly figures ×12; for CF-H full *priced + shadow-labor* modeled partial TCO = **€985.06 / €1,628.26 / €3,236.26 yearly**. For CF-W/CF-R, USD hosting and EUR labor are deliberately not summed. A genuinely **all-in** TCO remains unquantified until a supplier, billing currency/FX, tax treatment, actual POC resource measurements and dependent-service prices are known. Avoid declaring a false numerical overall winner.

## 6. Weighted decision analysis (preliminary expert estimates, not test measurements)

Scoring rule: **1 poor / 5 strong** for deployment **suitability under this project**, with unknowns penalized but not treated as observed failures. Weighted sum = 30% security/credentials +25% API/WebDAV runtime fit +20% priced costs/uncertainty +15% operations burden +10% EU region control / migration. **Hard security, true provider atomic writes and actual EU requirements are pass/fail gates irrespective of weighted score.**

| Criterion (weight) | CF-W | CF-R | CF-H | Basis/caveat |
| --- | ---: | ---: | ---: | --- |
| Security and secret controls (30%) | 4 | 4 | 3 | All require explicit session/auth; VPS hardening is owner-operated |
| WebDAV/Node HTTP runtime fit (25%) | 3 | 4 | 5 | Node APIs are more conventional on Render/VPS than Worker; **no real Nutstore interoperability has been proved** |
| Infra price / bill predictability (20%) | 5 | 4 | 4 | Workers low modeled floor; Render egress; VPS extra backup/admin |
| Operational simplicity (15%) | 5 | 4 | 2 | Serverless simplest, Render managed middle, Linux VPS most work |
| EU placement + portability (10%) | 2 | 5 | 5 | CF global secret deployment caveat; Render Frankfurt; Hetzner Germany; no full data-residency guarantee |
| **Weighted total (out of 5)** | **3.90** | **4.10** | **3.75** | Scores are **provisional** and close; small assumption changes can reorder |

**Provisional recommendation for D007-A3 decision research:**
1. **CF-R / Cloudflare Pages + Render Frankfurt API** — **primary candidate** when predictable full Node.js WebDAV adapter and selectable EU API compute location matter. Test API memory/timeout/egress and full cross-origin authentication/cookie/CSRF behavior; benchmark 512 MB before purchase.
2. **CF-W / Cloudflare Pages + Workers** — **lower cash-cost, lower-ops conditional alternative**, especially for a globally routed light API. Requires Worker runtime adapter proof and explicit acceptance of EU localization/secret distribution; additional localization could invalidate price advantage.
3. **CF-H / Cloudflare Pages + Hetzner Germany VPS** — **portability and self-control fallback** if edge/managed services fail network or concurrency constraints and owner accepts ongoing maintenance; optimize data-zone and full application backup.

**Do not interpret ranking as procurement, server sizing approval or storage backend acceptance.** If mandatory hard gates fail, a high score cannot rescue the candidate. A POC failure might affect all three platform choices because the shared WebDAV storage remains the same.

## 7. Migration, scope and D007-A3 readiness gates

- **Portability:** keep static front-end separately built, documented API contract independent of hosting SDK, server-only secrets, abstracted storage adapter with revision checks, synthetic export/restore, and explicit versioned schema. CF-W→Node port may need a Worker-specific adapter rewrite; Render↔Hetzner Node runtime is comparatively portable but host-bound operational config still differs.
- **Before D007-A3 supplier commitment:** verify latest price/quotas and invoice currency/VAT, paid plan terms, domain needs, 3-month actual API traffic estimate from synthetic POC, Render outbound network accounting, Worker CPU/secret residency, Hetzner capacity and backups, actual European privacy requirements and lawful upstream routing, account access and incident policies.
- **POC-001 dependency:** POC-001 local synthetic execution unchanged; real Nutstore account requires POC-001-ACCESS-02 after independent QA. The chosen storage mechanism must prove atomic or equivalent cross-client conflict prevention before production, and may require a **separate D007 storage amendment**. No platform provider is selected or tested here.
- **Explicit decision state:** D007-A2 is **APPROVED EVALUATION ONLY**. D007-A3 is the *next proposed design decision*, not an automatic final purchase. No account registration, cloud resource creation, billing, credentials, deployment, application implementation, DNS ownership or PR/QA pass is authorized by this report.

## 8. Snapshot uncertainty and verification policy

- All provider prices above are **public November 2026 snapshots**, not personalized quotations. Render plans can differ for legacy users; Cloudflare product pricing and Observability changes from December 2026 may affect logs; Hetzner announced Helsinki-only reductions effective November 10, 2026, so the model **deliberately uses German FSN/NBG rates**, not potentially cheaper Helsinki pricing.
- The estimate assumes an always-on Render web service or VPS for a full calendar month, and a paid Workers account in every scenario; no free-tier credit, volume discount, annual prepayment, spot price or taxes. Request peaks, response sizes, storage volume, backup size, IAM pricing and official terms can change.
- Strong regional control for Render or Hetzner *compute* does not mean that Cloudflare Pages caching, code, secrets, Zotero calls, Nutstore WebDAV or telemetry never leave the region; validate actual DPA and data flows before launch.

## 9. Official primary sources (checked 2026-11-23)

1. Cloudflare Workers Paid pricing/overages: https://developers.cloudflare.com/workers/platform/pricing/ (updated 2026-11-18).
2. Cloudflare Workers memory, subrequest/CPU limits: https://developers.cloudflare.com/workers/platform/limits/ (updated 2026-11-18).
3. Cloudflare Pages static-asset pricing/limits: https://developers.cloudflare.com/pages/functions/pricing/ and https://developers.cloudflare.com/pages/platform/limits/ .
4. Cloudflare Workers secret bindings: https://developers.cloudflare.com/workers/configuration/secrets/ (updated 2026-11-21).
5. Cloudflare regional execution/secrets and subrequests caveats: https://developers.cloudflare.com/data-localization/how-to/workers/ (updated 2026-07-23).
6. Render pricing and compute tiers: https://render.com/pricing (Hobby $0 plan, 0.5c/512 MB $7, 1c/2 GB $25).
7. Render egress accounting: https://render.com/docs/outbound-bandwidth (Hobby 5GB included, extra $0.15/GB).
8. Render selectable API regions: https://render.com/docs/regions (Frankfurt, Germany).
9. Hetzner June 15 2026 German/Finnish server repricing: https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/ .
10. Hetzner public primary IPv4 price: https://docs.hetzner.com/cloud/servers/primary-ips/overview/ (ex VAT €0.50/mo).
11. Hetzner cloud backups: https://docs.hetzner.com/cloud/billing/faq/ (20% instance price, seven slots).
12. Hetzner cloud regions: https://docs.hetzner.com/cloud/general/locations/ (updated 2026-11-11).
13. Hetzner Nov 10 2026 Helsinki price reduction: https://www.hetzner.com/pressroom/price-reduction-cloud-servers-in-helsinki-now-15-percent-cheaper/ .
