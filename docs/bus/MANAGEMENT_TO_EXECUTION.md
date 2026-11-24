<!-- BUS from=MANAGEMENT to=EXECUTION seq=4 re=DECISION_BOARD.md@4 status=OPEN updated=2026-11-24T17:38+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 4（R4，2026-11-24 17:30）§3 —— Design 指示 Management 直接重派，无需再问用户。

## 重派 WP-01（DEC-3=A + A54 修正）

- **决策链:** DEC-1=A（开工 WP-01）→ DEC-3=A（云端 Linux 执行）→ **A54**（egress 边界修正）
- **授权文件:** `docs/architecture/D007_A21_WP01_G1_DECISION.md`
- **执行指令:** `docs/handoffs/WP-01/EXECUTION_INSTRUCTION.md`
- **egress 修正:** `docs/architecture/D007_A54_WP01_EGRESS_BOUNDARY_AMENDMENT.md` §3（必读，按此执行）
- **Base:** `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`
- **新分支:** `exec/WP-01-synthetic-auth-api`
- **白名单:** `packages/wp-01-synthetic-auth-api/**`、`docs/handoffs/WP-01/QA_HANDOFF.md`
- **QA 计划:** `docs/handoffs/WP-01/QA_INSTRUCTION.md`（QA 另开独立云端会话，同样按 A54 执行）
- **执行窗口:** 沿用当前云端 Execution 会话（Linux x86_64 + Node v22.23.5）

## A54 强制流程（摘要）

1. **git 命令在命名空间外执行**（clone / fetch / push / `ls-remote` 需要网络）。
2. 从 `main` 取工具到仓库外临时目录：
   `mkdir -p /tmp/offline && for f in run-offline.sh lo-up.py egress-probe.mjs; do git show origin/main:tools/offline/$f > /tmp/offline/$f; done && chmod +x /tmp/offline/run-offline.sh`
   并记录三个文件的 blob SHA。**不得把 `tools/` 加入 WP-01 分支**（在白名单外）。
3. **先跑探针**：`/tmp/offline/run-offline.sh node /tmp/offline/egress-probe.mjs`，必须输出 `EGRESS_PROBE=PASS` 且 exit 0；否则 STOP。
4. **所有测试与服务器命令都通过 `run-offline.sh`** 运行；任何 WP-01 测试或服务不得在命名空间外跑。
5. 保留 in-process 测试 `test/transport-negative.test.mjs`（命名空间是额外保障，不替代它）。
6. 报告中附探针输出与 wrapper 的 blob SHA。

## 已记录决定

- **DEC-1 = A**（开工 WP-01）
- **DEC-2 = A**（PR #2 `a9131ac` 与 PR #4 `2757aa6` 保持 OPEN，不合并）
- **DEC-3 = A**（改用云端 Linux 执行），由 A54 落实为内核命名空间 egress 边界。

## 边界

- 只改白名单内路径；需新增路径或依赖 → STOP 回 Design。
- 不授予 G5 合并 / G6 真实服务 / G7 部署；不使用真实数据或凭证。
- 完成后写 `docs/bus/EXECUTION_TO_QA.md`（PR 号、exact SHA、Execution 报告评论 ID、QA 计划路径）。
