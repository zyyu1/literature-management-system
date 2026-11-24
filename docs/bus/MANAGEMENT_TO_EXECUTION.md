<!-- BUS from=MANAGEMENT to=EXECUTION seq=6 re=DECISION_BOARD.md@6 status=OPEN updated=2026-11-24T18:28+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 6（R6，2026-11-24 18:20）。用户在 Management 窗口选定。

## DEC-6 = A（批准 WP-02 并开工）

- **决策:** DEC-6=A —— **A56 自本条记录起生效**（`D007_A56_WP02_G1_AUTHORIZATION.md` 状态从 DRAFT 转为 G1 AUTHORIZED）。
- **授权文件:** `docs/architecture/D007_A56_WP02_G1_AUTHORIZATION.md`
- **设计 / 夹具 / QA 计划:**
  `docs/handoffs/WP-02/DESIGN.md`、
  `docs/handoffs/WP-02/fixtures/wp02.v1.json`（SHA-256 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888`，只读）、
  `docs/handoffs/WP-02/QA_INSTRUCTION.md`
- **Base:** `a0fb04f6d03ac81bbcb35800318c927e278e8b92`（固定值，不要用移动的 main）
- **新分支:** `exec/WP-02-project-paper-read`
- **白名单:** `packages/wp-02-project-paper-read/**`、`docs/handoffs/WP-02/QA_HANDOFF.md`
  - **`packages/wp-01-synthetic-auth-api/**` 必须逐字节不变**；WP-02 只可只读 import WP-01 模块。若 WP-01 需改动 → STOP 回 Design。
- **运行:** 云端 Linux x86_64 + Node **v22.23.5** 精确版本；仅 Node 内置模块；无 npm install / lockfile / CI / 外网。
- **Egress（A54 §3）:** 从 `origin/main` 取 `tools/offline/*` 到 `/tmp/offline`；先跑探针必须 PASS；所有测试与服务器命令经 `run-offline.sh`；**不要把 `tools/` 加进分支**。
- **QA 计划:** `docs/handoffs/WP-02/QA_INSTRUCTION.md`，由用户另开的独立云端 QA 会话执行（不得与 Execution 共用会话）。

## 交付要求（摘要，以 A56 原文为准）

- `packages/wp-02-project-paper-read/` 下：`src/*.mjs`（第 1 节只读路由 + R-ID / R-SCOPE / R-AUTH / R-RO / R-BYTES / R-LIMITS 规则）、`test/*.test.mjs`（覆盖 Q2-01..Q2-11，含 A6-01/A6-02 身份用例、字节一致的 403、405 不改状态、状态摘要一致、WP-01 回归 67/67）、`README.md`、可选 `package.json`（空依赖、无脚本）与 `evidence/**`。
- **Mutation:** 变异驱动或书面手写集，至少 **8 个预期 kill**。
- **Handoff:** `docs/handoffs/WP-02/QA_HANDOFF.md`。
- **完成后:** 推分支、开 PR（**不得自行合并**）、发 Execution 报告（含精确 SHA）、写 `docs/bus/EXECUTION_TO_QA.md`（PR 号、exact SHA、报告评论 ID、QA 计划路径），然后 STOP。

## STOP 条件

Base 不匹配、夹具 SHA 不匹配、egress 探针失败、需要白名单外路径、跨作用域泄漏、同一篇论文被重复存储 —— 任一命中即 STOP 并回 Design。

## 边界

- G5 合并 / G6 真实服务 / G7 部署 **NOT_AUTHORIZED**（本包 PR 需另经 DEC 才能合并）。
- 不使用真实数据、凭证或外部服务；冻结 UI 不动。
