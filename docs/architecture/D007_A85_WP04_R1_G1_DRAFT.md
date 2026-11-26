# D007-A85 — DEC-24=A; WP-04-R1 synthetic Research Note G1 DRAFT; DEC-25

**Design proposal — 2026-11-26 Europe/Berlin.** Observed parent `main@bf3d3929b82aff77e737eb4cc56e60749ccad2fa`. No ruling on evidence; design draft only.

## 1. DEC-24 record
At 20:06 +01 the user chose **DEC-24 = A** ("直接A") directly in the Design window, not via Management. Design records it here as the user's own decision; it authorizes only drafting the next work-package design and G1 options. No execution, dispatch or QA is authorized. Management should sync its record from Board R37 (no Management seq is required for DEC-24 itself).

## 2. Why WP-04-R1 next
- A10 lists WP-04 prerequisites as WP-01/02 security and identity plus "WP-03 versioned writes QA accepted": satisfied by A81 (G4 PASS_LOCAL), A82 (G5 VERIFIED) and A84 (post-merge regression PASS_LOCAL).
- The Research Note is the product's core write object (one global five-field note per canonical paper; frozen UI-D005.1/1e). A synthetic contract double reuses the proven WP-03 envelope (auth, CAS, ledger, four outcomes) and adds the main new risk: lossless Markdown bytes and the saved-version export.
- P0-STORE stays BLOCKED, so R1 is in-memory only, like WP-03-R1.
- Alternative WP-03-R2 (permanent Project delete, Current/All unlink) needs A16 step-up, an intent/confirmation design and a frozen-UI amendment first; it is offered as option B, design-only.

## 3. Proposed scope (binding text: [WP-04 DESIGN](../handoffs/WP-04/DESIGN.md), [QA INSTRUCTION](../handoffs/WP-04/QA_INSTRUCTION.md))
- New isolated package `packages/wp-04-research-notes-r1/` on Base `bcc4eaad5183c923f782da0475eea1751be2de3b`, branch `exec/WP-04-research-notes-r1`, whitelist = package + `docs/handoffs/WP-04/QA_HANDOFF.md`; WP-01/02/03, fixtures and tools frozen.
- Routes: GET note; PUT whole note (create with `If-None-Match: *`, update with strong `If-Match`); GET saved-version Markdown export. No per-field PATCH, delete, drafts, quotes or provider.
- Exact five keys, byte-identical values (no normalization, newline or whitespace change); fixed export template and filename rules per UI-D005.1e.
- WP-03 lessons are binding from the first commit: no waiver flag, strict TAP grammar, pinned protected inventory instead of repository walk, candidate audit outside test discovery, isolation guard before any socket/child.
- Out of scope: local drafts and recovery, autosave, Export Local Draft, UI, Typora certification, Key Quotes, Zotero API, real storage/identity, deployment.

## 4. Gates and process
G1 on DEC-25=A → Management dispatch to Execution (new branch/PR, full G2 report) → Design G2 scope review → Management releases independent G3 per QA INSTRUCTION → Design G4 → separate G5 DEC. Environment as WP-03 (Node v22.23.5 x64, A59 Windows or A54/A55 Linux; Linux NOT_RUN if not exercised). Any need to touch frozen paths, add dependencies or widen scope → STOP.

## 5. DEC-25 (Management presents)
- **A (recommended):** authorize WP-04-R1 G1 exactly per §3 and the two companion documents.
- **B:** instead, Design drafts WP-03-R2 (destructive Project/association actions) G0 design including the A16 step-up and the required UI amendment options; no execution.
- **C:** pause; no dispatch.

Neither choice authorizes real persistence, P0-STORE, R2 execution, frozen UI change, G6/G7 or touching PR #2/#4. A70/A71 remain suspended.

**Design STOP — WAITING FOR DEC-25.**
