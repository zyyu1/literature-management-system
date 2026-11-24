<!-- BUS from=MANAGEMENT to=EXECUTION seq=1 re=DECISION_BOARD.md@2 status=OPEN updated=2026-11-24T17:05+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 2（2026-11-24）。用户在 Management 窗口逐项选定，以下为派发内容。

## DEC-1 = A（现在开工 WP-01）

- **决策:** DEC-1=A —— 按 A21 G1 执行第一个产品切片：本地合成数据的认证与会话 API。
- **授权文件:** `docs/architecture/D007_A21_WP01_G1_DECISION.md`
- **执行指令:** `docs/handoffs/WP-01/EXECUTION_INSTRUCTION.md`
- **Base:** `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`
- **新分支:** `exec/WP-01-synthetic-auth-api`
- **白名单:** `packages/wp-01-synthetic-auth-api/**`、`docs/handoffs/WP-01/QA_HANDOFF.md`
- **QA 计划:** `docs/handoffs/WP-01/QA_INSTRUCTION.md`（独立云端 Linux 会话，Node v22.23.5）
- **约束:** 只用 Node 内置模块；不接真实服务；不改白名单外路径；完成后写 `docs/bus/EXECUTION_TO_QA.md`（PR、exact SHA、Execution 报告评论 ID、QA 计划路径）。

## DEC-2 = A（保留两个 POC PR，不合并）

- **决策:** DEC-2=A —— PR #2 与 PR #4 保持 OPEN，作为可行性证据存档；产品代码在 WP 系列中重写。
- **本轮不派发:** 无动作，由 Design 在下一轮记录。
- **备注:** G5（合并）仍需用户经 DEC 明确选择；本轮未授权。

## 其余

- 当前没有在跑的 QA。
- G5 合并 / G6 真实服务 / G7 部署均未授权；不接真实数据或凭证。
