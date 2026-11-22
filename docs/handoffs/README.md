# Shared Handoffs

GitHub is the durable communication channel for Design, Execution and independent QA windows.

1. **Design** publishes frozen requirements, exact task scope, design decisions and implementation authorization.
2. **Execution** works in its permitted branch, reports exact code SHA/PR/changed files/tests and **STOPS** for QA.
3. **QA** reads the exact published revision, conducts review-only independent checks, publishes PASS/PARTIAL/FAIL findings and **STOPS**.
4. **Design** evaluates the evidence and alone decides acceptance, repair, merge and next scope.

Do not overwrite historical frozen decisions; use amendments. Repository folders do NOT impose role-based GitHub permissions; branch protection may be configured separately.
