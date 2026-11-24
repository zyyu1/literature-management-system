# Shared Handoffs — current navigation

**Design-window migration:** always start with [`DESIGN_WINDOW_HANDOFF.md`](DESIGN_WINDOW_HANDOFF.md), the **single comprehensive design/context/status entry point**. It contains the complete architecture file locations, current tested SHAs, blockers, role agreements, decision queue and append-only Management receipt ledger. Follow the [Design handoff-first continuity rule](../governance/DESIGN_HANDOFF_CONTINUITY_PROTOCOL.md) and use [Design Window start prompt](../windows/DESIGN_WINDOW_START.md) in a new chat.

**Current routing (user-approved):** `Design → Management → Execution + separately user-opened independent QA → Management → Design`. Management coordinates but never independently authorizes code changes, G4, merge, ACCESS-02 or deployment. **On every Management-forwarded message, Design first verifies GitHub and commits an evidence-only update to the handoff before making a risk/G4 decision**, then updates it again with any actual new decision. The prior text below records the historical three-window arrangement, not a replacement for this routing. No background monitoring is promised.

## Historical three-window guidance (retained)

GitHub is the durable communication channel for Design, Execution and independent QA windows.

1. **Design** publishes frozen requirements, exact task scope, design decisions and implementation authorization.
2. **Execution** works in its permitted branch, reports exact code SHA/PR/changed files/tests and **STOPS** for QA.
3. **QA** reads the exact published revision, conducts review-only independent checks, publishes PASS/PARTIAL/FAIL findings and **STOPS**.
4. **Design** evaluates the evidence and alone decides acceptance, repair, merge and next scope.

Do not overwrite historical frozen decisions; use amendments. Repository folders do NOT impose role-based GitHub permissions; branch protection may be configured separately.
