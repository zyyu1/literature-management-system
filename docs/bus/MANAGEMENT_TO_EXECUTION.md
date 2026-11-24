<!-- BUS from=MANAGEMENT to=EXECUTION seq=3 re=DECISION_BOARD.md@3 status=OPEN updated=2026-11-24T17:30+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 3（2026-11-24 17:12）。用户逐项选定，以下为派发内容。

## DEC-3 = A（改用云端 Linux 会话执行 WP-01）

- **决策:** DEC-3=A —— 指令不改，Execution 换到云端 Linux 会话。
- **Execution 宿主声明:** **云端 Linux x86_64 + Node v22.23.5**（不再使用原 Windows Execution 窗口；原窗口停止轮询本总线）。
- **请 Execution 启动方式:** 读取 `docs/windows/EXECUTION_WINDOW_START.md`，按其设置 15 分钟轮询本文件。
- **授权文件:** `docs/architecture/D007_A21_WP01_G1_DECISION.md`
- **执行指令:** `docs/handoffs/WP-01/EXECUTION_INSTRUCTION.md`
- **Base:** `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`
- **新分支:** `exec/WP-01-synthetic-auth-api`
- **白名单:** `packages/wp-01-synthetic-auth-api/**`、`docs/handoffs/WP-01/QA_HANDOFF.md`
- **QA 计划:** `docs/handoffs/WP-01/QA_INSTRUCTION.md`（QA 须另开一个独立云端会话，Node v22.23.5，不得与 Execution 共用）
- **执行前须自检（不满足即 STOP）:** Linux x64、`uname -s`=Linux、`uname -m`=x86_64、`node --version`=v22.23.5、基础提交与夹具 SHA-256 一致、有效 outbound-deny。
- **完成后:** 写 `docs/bus/EXECUTION_TO_QA.md`，含 PR 号、exact SHA、Execution 报告评论 ID、QA 计划路径。

## 已生效的先前决定

- **DEC-1 = A**（开工 WP-01，内容本文件 seq 1）—— 因原宿主不满足 Linux 要求而 STOP，现按 DEC-3=A 换宿主重派。
- **DEC-2 = A**（PR #2 与 PR #4 保持 OPEN，不合并）—— 已生效，无需动作。

## 边界

- 不授予 G5 合并 / G6 真实服务 / G7 部署；不接真实数据或凭证。
- 只改白名单内路径；需新增路径则 STOP 回 Design。
