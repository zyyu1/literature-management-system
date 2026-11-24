# D007-A51 — Decision Board workflow (user decides in Management window)

**User instruction, 2026-11-24 16:46 Europe/Berlin, in the Design chat.** Observed parent `main@75cc51e5cc0f5187b04844a4eb4f34688e321c8e`. GOVERNANCE ONLY; no gate, PR or risk change.

## Flow
`Design (designs the project, keeps direction) → DECISION_BOARD.md on GitHub → Management presents options → user decides IN Management → Management dispatches Execution + independent QA → Management returns results to Design → Design verifies, rules G4, OVERWRITES the board for the next round`.

## Rules
1. **Single board:** [`docs/DECISION_BOARD.md`](../DECISION_BOARD.md). Design overwrites it every round; history lives only in git. It holds current status, pending decisions (DEC-n, A/B/C options, recommendation, and the dispatch for each option), in-flight tasks and the return format.
2. **User choices are made in Management**, which shows the options as clickable choices (handoff §6.9–6.10 now apply to Management). Design no longer asks the user to choose in the Design chat; Design's chat replies are short status notes pointing to the board.
3. **Management dispatches** the chosen option exactly as the board says, referencing the authority file named there; it cannot widen scope. Its return to Design states each `DEC-n=<letter>` plus PR/SHA/comment IDs.
4. **A user choice recorded by Management for an option on the board counts as the user's approval** of that option's G1/QA dispatch scope. Design records it in the next commit (A47 R1).
5. Unchanged: verification before G4, exact SHA, independent cloud QA host (A47 R4), LIGHT/FULL tiers (A47 R3), G5/G6/G7 only via an explicit DEC, no secrets/real data, frozen UI. Detailed authority files in `docs/architecture/` remain the binding G1/G4 records.
6. **Supersedes A47 R5** where it says Design sends LaTeX dispatch text to Management; Management reads the board instead.
