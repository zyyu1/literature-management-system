# D007-A18 — Provider-Neutral Software Supply-Chain, Reproducible Build and Release Provenance Contract

**Decision:** **D007-A18 Option B APPROVED**, 2026-11-23 (Europe/Berlin).
**Authority:** **SUPPLY-CHAIN ARCHITECTURE AND GOVERNANCE DESIGN ONLY. NOT IMPLEMENTED, NOT SCANNED, NOT BUILD-ATTESTED, NOT TESTED.**
**Goal:** control third-party OSS/dependencies, transitives, licenses, malicious package updates, reproducible build inputs, SBOM, CI privilege boundaries, artifact integrity, upgrade/withdrawal procedures and exact-SHA independent QA and release rollback decisions without selecting a CI/cloud provider.
**Upstream:** [D007-A9 QA/traceability gates](D007_A9_QA_FRAMEWORK.md), [D007-A10 work package sequencing](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), [D007-A13 environment isolation, artifact promotion and secret constraints](D007_A13_ENVIRONMENT_ISOLATION.md), [D007-A17 data/backup key hierarchy](D007_A17_KEY_HIERARCHY_BACKUP_ENCRYPTION.md), [D007-A11 incident response](D007_A11_OPERATIONS_RUNBOOK.md), [D007-A5 trustworthy mutation outcomes](D007_A5_API_CONTRACT.md), [D007-A14 HTTPS browser origin/Cookie contract](D007_A14_ORIGIN_COOKIE_TOPOLOGY.md), [D007-A16 sensitive operations](D007_A16_SENSITIVE_ACTION_AUTHORIZATION.md).
**FROZEN:** [Module 002 approved UI](../ui/002/DESIGN_APPROVED.md) **67 decisions and 26 original U6 cases NOT RUN**, no changes. [POC-001 REMEDIATION-02](../handoffs/POC-001/REMEDIATION_02.md) remains the **sole original local-only repair authorization** on `exec/POC-001-webdav-feasibility`, base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, original path allowlist, **NO REBASE**; most recent independently re-QA'd head `2806d9d08dcec78e974703a82a38a696ae76d132` **LOCAL_STAGE PARTIAL**, new exact SHA re-QA pending, PR #2 **not merge-authorized**, real Nutstore **ACCESS-02 BLOCKED**.
**Not authorized:** no `.github/workflows` modifications, CI runner, workflow, security scanner, dependency addition/upgrade, lockfile update, package install, SBOM/artifact/signature actually generated, secrets/keys/credentials, test run, live account, GitHub deployment, cloud billing, build, app code, frozen UI or POC branch change.

## 1. Trust boundaries: source SHA ≠ dependency inventory ≠ build provenance ≠ independent acceptance

```text
UNTRUSTED INPUTS: source PR, upstream package/registry, OCI image,
build actions/plugins, PR comments, build scripts and cache, external metadata
  ↓ user/Design authorizes exact work package, path and repository base
REVIEWED SOURCE: exact 40-character Git commit, changed paths, lockfile diff
  ↓ isolated install/build, declared tools/flags/OS/registry, pinned source tree
BUILD ARTIFACTS: immutable frontend bundle + secure API package
  ↓ independently computed cryptographic artifact digests, machine-readable SBOM
PROVENANCE: subject digest + source + materials + builder identity + recipe
  ↓ independently verified integrity and trusted builder policy
INDEPENDENT QA: tests exact source SHA and artifact digest + fixture/environment
  ↓ Design adjudicates risks and separately approves merge / staged promotion
PRODUCTION (FUTURE): same verified artifact digest, isolated prod config and keys
```

These are **separate assertions**: a commit hash says which tree was reviewed but not what dependencies were fetched; a lockfile can be poisoned; an SBOM is a component inventory, not a clean-code certificate; a hash detects changed bytes only relative to a trusted expected digest; a signature proves a signer assertion only if signer identity, certificate/trust root and scope are verified; SLSA provenance does **not** prove application correctness or release suitability. Rebuilding from the same commit under different lockfile/runtime/tools can yield different artifacts. Any changed source/lockfile/build recipe, builder, fetched materials or artifact digest invalidates the old approval scope until re-reviewed.

**Scope firebreak:** Document commits on `main` are independent from the fixed POC-001 PR #2 original base. They **must never rebase or merge main into that PR** to “adopt” A18, nor silently expand its allowed paths. Existing POC QA 54/54 x5 **applies only to its reviewed SHA/mock semantics**, not new apps, dependencies or real Nutstore.

## 2. OSS introduction gate: mandatory review before adding a package or reusing a GitHub project

**No dependency is selected or approved by A18.** The future implementing window first searches GitHub/open-source candidates **before writing from scratch** and records **three distinct candidates** against the user's consistent five-factor rubric; evaluate reuse versus rewrite/secondary development, change cost, security and product license obligations. Stars alone are popularity, not safety.

| Review dimension | Required evidence, not a numerical default |
| --- | --- |
| **1. GitHub Stars / usage** | Repository URL, recorded star count and observation date, package/registry identity, maintainer/project identity; stars never replace integrity/security assessment |
| **2. Maintenance recency** | Latest substantive release/commit and issue/security response with dates; recent commits do not prove safe release engineering, and stale does not automatically mean vulnerable |
| **3. License and obligations** | Canonical SPDX expression (including exceptions), actual upstream LICENSE files, transitive and dual licenses, notice/attribution/source-disclosure/network-copyleft obligations, unknown licenses as **BLOCK_PENDING_REVIEW**; do not assume MIT, Apache-2.0, GPL or AGPL can be interchanged without product-specific legal review |
| **4. Technical stack/fit** | Browser/Node/Worker runtime fit, server-only credential handling, TS/JS/ESM compatibility, cryptographic/runtime APIs, maintenance/test surface, dependency graph and direct+transitive risk |
| **5. Deployment/operations difficulty** | Build size, scripts/native addons, SSR/serverless restrictions, resource/egress quotas, EU privacy, transitive services, deployment/upgrade/fallback effort and license compliance |

**Decision artifact for each candidate:** provenance URL, immutable release/tag/commit and registry digest where obtainable, checked date, license evidence and exceptions, maintainer trust and takeover exposure, direct/transitive dependency count, update cadence, vulnerability/malware/typosquatting results, install/build hooks, runtime external calls, CI/container considerations, reuse vs fork cost, and an explicit **approve/reject/defer** disposition. For libraries used only at build time, threat model still treats arbitrary install hooks as code execution in the builder.

**License rules:** identify SPDX IDs/expressions but independently verify file-specific notices, embedded vendored code, generated files, patents/trademarks and distribution/SaaS/network-use scope. For uncertain `AGPL-3.0` or incompatible reciprocal-license code, require Design/legal review *before copying or linking*. Do not infer license from GitHub stars, a copied README badge, npm metadata alone or a GitHub repository's lack of a LICENSE file. Record license obligations for bundled frontend assets and the API separately; do not reuse code lacking a known lawful license grant.

**Repository owner/package identity threats:** typo-squatting, dependency confusion/private namespace collision, abandoned or transferred package, compromised maintainer, malicious update/script, hidden binary/download, supply-chain compromise despite a legitimate tag, vulnerable transitives, deprecated runtime/crypto, license change and compromised CDN mirror. Provenance/verified source is one control among others, not a guarantee.

## 3. Dependency pinning, immutable resolution and install behavior

- Choose and document package manager/runtime **in a future work-package execution decision**, not by A18. Use one authoritative reviewed lockfile with exact transitive graph and integrity hashes (or equivalent ecosystem mechanism), frozen deterministic install mode, scoped registry allowlist/trust and cache provenance. Reject a missing, unexpectedly rewritten or mismatched lockfile. No `latest`/unconstrained floating dependency on any release build path.
- Where feasible pin downloaded packages and OCI base images by content digest; tools and workflow actions should be pinned to **full immutable commit SHAs** (or verified equivalent content digest) rather than mutable tags. An immutable hash **does not certify safety**, and pinned compromised versions must still be assessed and patched.
- Reject new package install-time scripts/native postinstall, prebuilt executable downloads, untrusted registries, transitive dependency overrides or surprising network egress without explicit review. An allowlisted one-time build script is not an exemption from least privilege and negative tests. Lockfile integrity does **not** stop a malicious script within a correctly hashed package.
- Every dependency change is a fresh **scope decision** with direct+transitive delta, license delta, SBOM delta, security advisory status and updated tests; avoid automated bot auto-merge/auto-release without separate Design approval and exact-SHA re-QA.
- Browser bundle vs server artifact inventory must be separate: **never put Zotero/WebDAV credentials, key material, Session signing secrets, A17 DATA/BACKUP KEK/DEK, real Project/Note/Quote content, PDF, personal identifiers or prod endpoints with secret parameters in static JS, source maps, test snapshots or artifact metadata**.
- For an internal local-only POC, its **existing bounded instruction** controls dependencies and paths. A18 does not grant any new package install, root lockfile rewrite or `.github` path to POC-001.

## 4. SBOM / licenses / vulnerability evidence

**SBOM contract:** produce a machine-readable build-specific SBOM for each **future independently authorized** frontend, API, relevant container/base image and production distribution artifact. **SPDX and CycloneDX are candidate exchange formats**, not chosen tools; apply the current relevant minimum-element guidance on the implementation date. The **2026 CISA updated minimum elements**, NTIA 2021 historical baseline and any applicable regional/legal requirements must not be conflated.

**Minimum logical fields:** component name, ecosystem/package URL or equivalent stable ID, exact version, supplier/producer when proven, root artifact/source, dependency relationship (direct/transitive), declared license SPDX expression/evidence and unresolved license flags, hashes when obtainable, SBOM format/version, creation timestamp and tool provenance, source/repository/ref if known, scope and known omissions. A scanner's inability to identify a vendored/minified or dynamic component must be reported, not silently asserted complete. No real user data or secrets may enter SBOM custom metadata.

**Security signal sources (candidates, no tool run):** OSV advisories, upstream and ecosystem advisory feeds, vendor security notices, NVD/CVE where relevant, malicious-package reports, OpenSSF Scorecard and package registry metadata. Vulnerability match alone is **not** equivalent to exploitability; a low CVSS may still be critical when the vulnerable action has credential or private-note access. Scorecard does not establish license compatibility or a safe runtime.

| Finding | Proposed classification and initial action |
| --- | --- |
| **P0 / IMMEDIATE STOP** | Confirmed malicious/compromised direct/transitive package or build tool on release path, secret exfiltration, unauthorized deployment or artifact substitution, evidence of altered builds/private Notes, untrusted signing identity that could release code, or confirmed exploitable issue enabling owner-data/credential takeover. Isolate publishing, revoke exposed credentials by authorization under A11/A17 and preserve sanitized evidence |
| **P1 / BLOCK RELEASE** | Unreviewed critical vulnerability with credible reachable attack path, integrity/hash mismatch, missing or contradictory license grant, untrusted builder/signature, missing mandatory artifact/SBOM evidence, privilege-bearing untrusted PR workflow, unscoped transitive install hook, untested high-risk update, or independently unverified rollback |
| **P2 / TRACK WITH EXPLICIT RISK DISPOSITION** | Known non-exploitable or low-impact issue with evidence-backed scope/fix plan, benign missing metadata or controlled noncritical diagnostics gap; user/Design must explicitly accept before phase release, no silent waiver |
| **NOT_ASSESSED / BLOCKED** | Missing scan/provenance/license evidence, advisory database unavailable or only old scan at different SHA; cannot be treated as 0 vulnerabilities or PASS |

**Handling:** pin affected package+version, advisory ID and publication/updated dates, reachability evidence, impact on browser/API/crypto/credential paths, verified fixed release or safe mitigation, proposed upgrade/rollback and independent QA. Make a separate explicit risk acceptance decision; no automatic downgrade of P0/P1 because a scanner returned zero findings. Scan signatures and malware heuristics cannot prove a package free of malicious code.

## 5. Provider-neutral CI security boundary — desired workflow policy, NOT a workflow

**No CI vendor/runner chosen or modified.** Any future GitHub Actions, GitLab or other CI installation first needs its own authorized work package, branch/path allowlist, workflow security review and environment isolation under A10/A13. Current repo may have existing CI; this decision does **not** audit or amend it.

| Future job type | Minimal authority | Must never happen |
| --- | --- | --- |
| **Untrusted PR check** | Read-only source checkout, synthetic fixtures, test-only isolated network, no production/staging secrets, no privileged cloud/registry push rights; ephemeral clean runner and bounded artifacts | Running PR-authored scripts in a privileged `pull_request_target` / triggered privileged workflow with write token or production secret; treating PR comment, branch name or artifact as trusted code |
| **Dependency/license/SBOM scan** | Separate read access to pinned graph, isolated sandbox and approved advisory sources; no publication permission | Scanners/formatter automatically rewriting source/lockfile with release token or sending private PR artifacts/credentials to third parties by default |
| **Independent QA** | Separate approved reviewer and clean exact-SHA source/artifact/fixture, controlled mocks and redacted evidence, no write-capable deployment token | “QA passed” based solely on developer-run CI or on a floating branch HEAD later changed |
| **Build candidate** | Read-only source/materials, clean isolated builder, pin compiler/tool versions and verified external inputs; output immutable artifact+provenance+SBOM with bounded artifact storage | Shipping secrets in frontend bundles, granting untrusted build scripts publish permission, reusing unsanitized PR cache in privileged release |
| **Release/promote (future only)** | Separate explicit Design+user approval, immutable artifact digest, protected environment, narrowly scoped and short-lived deployment capability and a verified allowlisted target | Auto-deploy on green PR/merge alone, using broad personal access tokens, implicit prod context in test runners, unreviewed dependency download after QA |

**Specific portable requirements:** default token permission **read-only** and per-job least privilege; explicit deny by default for secrets on untrusted forks; prohibit interpolation of untrusted PR fields directly into shell; do not allow an untrusted PR cache/artifact to overwrite a protected branch/release cache; isolate cache keys by trust, dependency digest, OS and job; handle checkout submodules and package scripts as code execution; constrain egress for tests; pin all executable workflow actions to audited immutable releases/SHA; require review for workflow/permission edits; protect prod deployment signing and environment with explicit human gates.

**OIDC identity to cloud and keyless signatures (future candidates):** never grant production access just because a job can request an identity token. Bind cloud trust to exact repo+ref+environment+job identity under a separately approved policy, prevent untrusted PR jobs from requesting deploy-scoped OIDC, protect subject/audience and replay. No OIDC trust policy, cloud secret, key, signing identity or certificate is created here.

**Logs and artifacts:** redact sensitive headers/cookies/Note/Quote/PDF/keys and upstream credential paths as A11/A17; limit report audience/retention to a future approved policy; private test data never leaves the authorized environment. Automated secret redaction is imperfect; prevention and negative leakage testing remain necessary.

## 6. Reproducible build and immutable software artifacts

**Objective:** independently replay a declared build from approved materials and compare **artifact content digests**, while reporting any nondeterminism honestly. **No builds have been run by A18**.

- Pre-register **full source SHA**, approved base/allowed-path diff, signed/tag provenance where relevant, lockfile exact digest, runtime/installer/compiler/bundler versions, OCI/image digest or equivalent hermetic toolchain, build command/flags, locale/time zone, timestamps, generated source maps, dependency registry content, OS/CPU architecture, reproducible environment variables (**without secrets**), cache seed and approved network policy.
- Separate **static frontend** and **secure API** artifacts with SHA-256 or later approved strong digest, artifact type and byte count, and exact source/lockfile/build recipe. A Git commit SHA is **not** an artifact SHA-256. If packaging includes timestamps, file order, locale, minification variability, nondeterministic codegen or floating remote downloads, report **NON_REPRODUCIBLE / UNVERIFIED** until corrected or independently accepted; never re-label a difference as equivalent merely because code passed tests.
- Two independently authorized clean builds on the **same declared materials** should be compared byte-for-byte; allow a documented normalization only if normalization itself is approved, input-preserving and cannot hide changed executable bytes. If exact reproduction is not realistically attainable, adopt an explicit **weaker evidence** policy with documented residual risk and Design approval, not a fake reproducibility PASS.
- Bind artifact digest to **immutable distribution** and release deployment. Fetch the **same** attested/tested digest in staging/production, rather than rebuilding from a mutable tag at deployment time. If the platform performs an unavoidable new build, its newly built digest needs its own QA/security disposition before promotion.
- Do not embed real runtime secrets in artifacts or print backend key data during reproducibility checks. Approved **runtime-only** environment-specific secret/config injection (A13/A17) is separated from clean artifact build. Test source maps, client assets, debug logs and backup exports for secret leakage.
- A reproducible *malicious* source is still malicious. Reproducibility supports comparability; supply-chain review, signing provenance and independent QA remain separate controls.

## 7. Source-to-artifact provenance, optional signing and verified promotion

**Build Attestation candidate:** SLSA-style provenance under the **current selected spec version**, and optional in-toto attestations / Sigstore Cosign keyless or key-backed signing where later supported. These are **choices**, not deployed mechanisms or a certification. A signed build from an untrusted subject/builder or compromised identity still must **fail policy**. SLSA levels must be supported by verifiable actual builder properties and independently checked requirements; do not claim `SLSA L2/L3` from merely generating a JSON document.

**Conceptual future release evidence record** (all fake, no real digest generated):

```json
{
  "schemaVersion": 1,
  "evidenceState": "DESIGN_ONLY",
  "repository": "example/fictional",
  "sourceSha40": "0123456789012345678901234567890123456789",
  "approvedBaseSha40": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "workPackage": "WP-SYNTHETIC",
  "allowedPathsDigest": "NOT_GENERATED",
  "lockfileDigest": "NOT_GENERATED",
  "toolchainDigest": "NOT_GENERATED",
  "buildRecipeDigest": "NOT_GENERATED",
  "frontendArtifactSha256": "NOT_GENERATED",
  "apiArtifactSha256": "NOT_GENERATED",
  "sbomDigest": "NOT_GENERATED",
  "provenanceDigest": "NOT_GENERATED",
  "builderIdentity": "UNSELECTED",
  "signingIdentity": "UNSELECTED",
  "fixtureDigest": "NOT_GENERATED",
  "independentQaStatus": "NOT_RUN",
  "designDisposition": "NOT_AUTHORIZED",
  "targetEnvironment": "NOT_AUTHORIZED",
  "rollbackArtifactDigest": "NOT_GENERATED"
}
```

**Future verification:** compare attestation subject artifact SHA-256 to downloaded candidate bytes; verify the signed statement (if available) against an **explicit approved trust root, certificate identity, issuer, transparency log/inclusion proof and expected builder/workflow**; compare source SHA, recipe, lockfile, builder identity, dependency set/SBOM and allowed deployment environment against approved work-package evidence; check expiration/revocation/publisher compromise events. **A signature whose identity cannot be independently verified is NOT_VERIFIED**, not a PASS. Prefer preventing mutable artifact replacement by using digest-addressed immutable storage, and verify digest again at deployment.

**Release-to-rollback proof:** retain only later approved encrypted/restricted release manifests, previous tested immutable artifact and its API/schema compatibility and safe backup/restore checkpoint. Rollback **code** never automatically rolls back irreversible **data schema**, restores deleted Projects from old backups, retries an A5 `UNKNOWN` operation, or weakens A4/A14/A17 secrets. If rollback path cannot be proved, **STOP and keep affected mutations read-only/blocked** under A11.

## 8. Dependency advisory, upgrade and compromised-release withdrawal workflow

```text
ADVISORY / MALICIOUS PACKAGE / HASH MISMATCH / SOURCE CHANGE
  ↓ identify affected package/transitive version, artifact digest and environment
TRIAGE P0/P1/P2/NOT_ASSESSED (security + license + reproducibility)
  ↓ if integrity/secret risk, contain publishing/deployment, quarantine artifact
SEPARATELY APPROVE narrow dependency/remediation branch + path list
  ↓ lockfile/version + notices/SBOM/reprovenance and negative test update
INDEPENDENT QA on NEW EXACT SHA + ACTUAL TESTED ARTIFACT DIGEST
  ↓ Design accepts risk and merge / stage / release **as separate decisions**
DEPLOY only separately authorized immutable candidate, verify runtime digest
  ↓ incident and safe rollback gates if behavior regresses
```

- **Patch priority:** an actively exploited/exfiltrating dependency blocks release and prompts A11 incident response; no self-authorized patch deployment. An affected dependency in dev-only build tooling may still expose signing/CI credentials even if absent from runtime SBOM. If no safe upstream fix exists, consider isolate/remove, vendor with explicit license/security review or replace with a separately approved option; **do not automatically select or introduce a new package**.
- **Withdraw/revoke:** mark compromised artifact digest and release provenance **REVOKED/QUARANTINED** in a later implementation-controlled release manifest, block promotion and deny stale artifact reuse; rotate compromised build/deploy credentials only by appropriate authority, invalidate affected caches, assess which users/environment received the artifact and whether logs/keys/private Notes leaked. A GitHub release/tag deletion cannot revoke copies already downloaded.
- **Reopen old acceptance:** a newly identified malicious package, upstream maintainer compromise or broken signing root may invalidate a previously accepted QA or release; require Design incident disposition and independent re-QA, not “once green always green.”
- **Legal/license conflict:** halt new distribution and preserve evidence; obtain separate license obligations assessment. Removing a copyright notice from an already distributed artifact is not a compliant cure.
- **Cost/operational impacts:** registry/network egress, build duration, scanner SaaS, attestations, signing and artifact retention have no approved provider or numeric budget. A12 financial/capacity gates remain separate.

## 9. A9/A10/A13/A17 delivery and STOP matrix

| Stage | Source of approval and required evidence | Hard STOP (not promoted) |
| --- | --- | --- |
| **G0 — Architecture/design** | A18 Option B approved as **policy only**, A1–A17 preserved | No new code, dependency, CI workflow or account merely because A18 is approved |
| **G1 — Future bounded execution** | Separately approved A10 work-package, base/head, branch/path allowlist, fake fixtures; 3-candidate OSS review for any proposed reuse | Unknown license, unauthorized dependency/workflow path, real Zotero/PDF/secret, out-of-scope code |
| **G2 — Clean dependency/build review** | Locked transitives, approved hashes/licenses, toolchain/recipe and source SHA, zero unexplained secret exfiltration, per-output artifact digest and SBOM; vulnerability disposition | P0/P1, unpinned executable CI inputs or missing scan provenance, no integrity check |
| **G3 — Independent QA** | Independent reviewer fetches **exact 40-char candidate SHA**, exact immutable build/artifact digest and test fixture, records real commands/exits, P0/P1/P2 and NOT_RUN | Changed SHA/lockfile/build digest, developer-only self-report, stale QA or missing negative evidence |
| **G4 — Design acceptance/merge** | Design reviews QA/cost/OSS rights/risk, separately approves merge of exact reviewed diff; existing POC-001 PR #2 has no such approval | PR contains unapproved paths/new workflow/extra dependencies or gate mismatch |
| **G5 — Staging** | Separate user-approved provider/environment/config/secret custody, exact artifacts and isolated synthetic data, independent staging QA | Any unapproved data/secret copy into Staging, missing attestation or new untested build |
| **G6 — Provider/device validation** | Separately approved real provider/device access, original POC-001 ACCESS-02 gate if relevant, independent evidence (not synthetic claim) | WebDAV CAS/ledger/backup not proved, unexpected outbound secret, untested browser/PDF behavior |
| **G7 — Production/release/rollback** | Explicit provider/budget/domain/identity decision, accepted security and backup/restore, exact digest + provenance, independent QA + user/Design release and safe rollback | No user authorization, revoked artifact, P0/P1, unknown schema/backup, no verified rollback, hidden auto-promotion |

**No PASS is inferred** from a generated SBOM, a green PR job, a signed release or an alert clearing. No transition is automatic; Execution delivers, independent QA reproduces, Design makes scoped disposition, and the user separately authorizes provider/real-account/deploy/merge as applicable. D007-A18 must not alter the POC-001 original local execution directive, Module 002 frozen UI, app routes or current dependency/workflow files.

## 10. Independent A18 synthetic QA register — ALL NOT RUN

| ID | Future separately authorized verification |
| --- | --- |
| **A18-01** | Three OSS candidate entries include exact GitHub URLs, five-factor stars/recency/license/stack/deployment + reuse cost/risk; no selected dependency without Design decision |
| **A18-02** | Unknown, changed or incompatible SPDX/actual source license and required notices block package addition/distribution |
| **A18-03** | Registry typo-squat/dependency confusion/transferred maintainer/vendored binary scenario rejected despite apparent popularity |
| **A18-04** | Frozen install resolves complete transitive graph against correct lockfile and integrity digests; unexpected graph or file change fails closed |
| **A18-05** | Untrusted lifecycle install hooks or runtime download scripts blocked from secret-bearing builder and uncontrolled network |
| **A18-06** | SBOM SPDX/CycloneDX candidate includes direct/transitive components, versions, licenses, provenance and declared gaps per output artifact |
| **A18-07** | Advisories across direct/transitive, build-only tools and malicious packages mapped to actual exploitability P0/P1/P2/NOT_ASSESSED |
| **A18-08** | A P0/P1/unknown license or unverified scanner output cannot auto-merge or issue release; independent Design waiver only for eligible P2 |
| **A18-09** | Untrusted PR code/comment/branch name does not receive write token, secrets, privileged pull_request_target context or publish rights |
| **A18-10** | GitHub Actions/other CI executable tools pinned by immutable SHA; role-scoped OIDC and token permission; no untrusted cache contamination |
| **A18-11** | Build input manifest pins source/lockfile/toolchain/OS/flags/network/cache mode; clean independent build computes matching artifact digest or reports NON_REPRODUCIBLE |
| **A18-12** | Different source SHA, lockfile, recipe, builder input or artifact digest invalidates prior QA and requires fresh independent review |
| **A18-13** | Frontend build and source map leak probe catches synthetic Session/WebDAV/Zotero/DATA KEK markers; no real secret used |
| **A18-14** | SBOM/provenance/signature and artifact digest disagreement fails trust verification even when signer appears legitimate |
| **A18-15** | Wrong issuer, certificate identity, builder, untrusted root or missing transparency inclusion blocks optional keyless verification |
| **A18-16** | Release manifest prevents staging→production deployment of rebuilt/untested artifact, wrong config/region/secret namespace or float tag |
| **A18-17** | Compromised transitive upgrade triggers quarantine/credential response, safe revert to independently QA'd artifact without reverting irreversible schema |
| **A18-18** | Rotating release/signing/CI credentials cannot destroy A17 data or backup decryption key availability or automatically retry UNKNOWN |
| **A18-19** | POC-001 REMEDIATION-02 branch/base/path and ACCESS-02 BLOCK unchanged; no code/workflow/dependency/QA changes from design-only approval |
| **A18-20** | Verify unchanged Module 002 67 decisions/26 U6 scenarios, A9–A17 design statuses and independent exact-SHA evidence ledger |
| **A18-21** | Independent QA reports exact repo/base/full head, artifact digests, fixtures, permitted runtime, real commands/exit codes and failures P0/P1/P2 vs NOT_RUN |
| **A18-22** | Future rollback under missing provenance, old key, unavailable consistent backup or ambiguous dispatched write STOPs and preserves drafts/data |
| **A18-23** | Threat model tests upstream package malicious update, compromised builder, substitution after signing, and stale dependency advisory baseline |
| **A18-24** | Provider-neutral architecture cannot be read as an authorization to create new CI cloud account, deploy, scan real repo, install dependencies or run tests |

**Evidence status:** **24 proposed tests, NOT RUN**. There are **no A18 test artifacts, SBOM, actual build digest, signatures, malware scans, SLSA level or real-provider result**. Original frozen Module 002 26 U6 tests remain NOT RUN; POC-001 independent second QA remains LOCAL_STAGE PARTIAL, and all previous D007 planned tests remain design-only unless independently evidenced.

## 11. Public standards references / limitations

Reference guidance consulted 2026-11-23; none is proof that this repository complies:

- [SLSA v1.2 Build Provenance](https://slsa.dev/spec/v1.2/build-provenance) and [Build Requirements](https://slsa.dev/spec/v1.2/build-requirements): provenance subject/source/build identity and level claims require actual verified build systems.
- [CISA 2026 updated minimum SBOM elements](https://www.cyber.gov.au/publication/2026-minimum-elements-for-a-software-bill-of-materials-sbom) and [NIST SBOM guidance](https://www.nist.gov/itl/executive-order-14028-improving-nations-cybersecurity/software-supply-chain-security-guidance-20): inventory baselines, not software trust certificates.
- [SPDX License List](https://spdx.org/licenses/) and [SPDX specification](https://spdx.dev/): canonical license expressions and compliance metadata, **not** a legal decision.
- [OWASP CycloneDX](https://cyclonedx.org/): alternate SBOM format candidate, not an installed tool.
- [OpenSSF Scorecard](https://scorecard.dev/) and [OSV schema](https://openssf.org/osv-schema/): open-source health and advisory inputs, **not** proof of zero vulnerabilities.
- [GitHub Actions security reference](https://docs.github.com/en/actions/reference/security/secure-use): least privilege, fork/untrusted input controls and secrets handling. No GitHub workflow is modified or run.
- [Sigstore Cosign signing/verification](https://docs.sigstore.dev/quickstart/quickstart-cosign/): optional identity-bound signature/provenance candidate with explicit trust-root verification.
- [in-toto](https://in-toto.io/): optional supply-chain attestation family, not adopted by A18.

**Deferred:** actual package manager, package/license choices, CI provider/runner, SBOM generator, vulnerability database account, hardened build toolchain, signed provenance method, signing key/identity, deterministic build reproducibility, SLSA level, scan cadence, threshold/fix SLA, alert recipients, release/archive retention, workflow settings, remote mirrors, actual secrets, cost and environment hardware. None is decided or validated.

## 12. Next independent design candidate

**D007-A19 — end-to-end architecture conformance and execution-readiness audit / design closure checklist.** Option B candidate: reconcile A1–A18, Module 002 frozen 67/UI 26, POC-001 second QA/remediation and current authorization gates; enumerate **resolved decisions versus undecided values**, unresolved feasibility blockers, cross-module contradictions (if any), required independent QA and first executable work-package readiness; produce one evidence-linked design closure matrix and exact SHA gate **without freezing architecture, selecting cloud provider, granting any code/test/merge/access/deployment or claiming PASS**. Any architecture freeze or execution instruction requires a **new separate user approval**.

**FINAL DISPOSITION: D007-A18 OPTION B APPROVED AS SUPPLY-CHAIN DESIGN ONLY. NO REAL SCANS, SBOM, BUILD, WORKFLOW, DEPENDENCY, SIGNATURE, CODE, PROVIDER ACCOUNT, CLOUD BILLING, TEST, ACCESS-02, PR MERGE OR DEPLOYMENT; 24 PLANNED A18 CASES NOT RUN.**
