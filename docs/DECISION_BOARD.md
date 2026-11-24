<!-- BUS from=DESIGN to=MANAGEMENT seq=1 re=bus/QA_TO_DESIGN.md@0 status=OPEN updated=2026-11-24T16:55+01:00 -->
# 决策板 / Decision Board — 每轮整体覆盖

> **用法（D007-A51）：** Design 每轮整体覆盖本文件，历史只看 `git log -p docs/DECISION_BOARD.md`。
> - **Management** 打开本文件，把 §2 的待决事项原样呈给用户（可点击的 A/B/C 选项）；用户在 Management 窗口里做选择。
> - Management 把用户选择和派发内容写进 `bus/MANAGEMENT_TO_EXECUTION.md`；Execution → `bus/EXECUTION_TO_QA.md`；QA → `bus/QA_TO_DESIGN.md`。各窗口每 15 分钟轮询自己的收件文件（[A52](governance/D007_A52_FILE_BUS_POLLING.md)）。
> - Design 不再直接问用户选项。G1 和 G4 的具体授权仍写在各自的 `docs/architecture/D007_A*.md` 文件里，本文件只做指引。

**轮次:** R1（seq 1）· 2026-11-24 Europe/Berlin · 基于 `main@75cc51e5cc0f5187b04844a4eb4f34688e321c8e`

## 1. 当前状态

| 工作线 | 对象 | 状态 |
| --- | --- | --- |
| POC-001 R10 | PR #2 `a9131ac` | **G4 PASS_LOCAL**（[A49](architecture/D007_A49_R10_EXACT_G4_PASS_LOCAL.md)）；两个 P2 已在本地关闭；不能接真实服务 |
| Q1E-L3 | PR #4 `2757aa6` | 候选版本已采纳；独立 QA 已派发（[A50](architecture/D007_A50_Q1E_L3_ADOPT_2757AA6_CLOUD_QA.md)），**等待 QA 报告** |
| WP-01 合成认证 API | 未开工 | G1 已授权（[A21](architecture/D007_A21_WP01_G1_DECISION.md)） |
| 全局 | — | 合并、真实服务、部署（G5/G6/G7）仍禁止 |

## 2. 待用户决策（由 Management 呈给用户）

### DEC-1：是否现在并行开工 WP-01？
**背景：** WP-01 是第一个真正的产品切片（本地合成数据的认证 API）。它和 PR #4 互不影响，可以同时进行。

| 选项 | 内容 | 派发（选中后由 Management 执行） |
| --- | --- | --- |
| **A（推荐）现在并行开工** | 按已有 A21 G1 开工，不等 L3 结果 | **Execution：** 用户新开一个 Claude 云端会话，按 [WP-01 EXECUTION_INSTRUCTION](handoffs/WP-01/EXECUTION_INSTRUCTION.md) 执行。<br>- Base `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`，新分支 `exec/WP-01-synthetic-auth-api`。<br>- 只改白名单路径。<br>- 完成后开 PR，评论里写 exact SHA，然后 STOP。<br>**QA：** 另开一个云端会话，按 [WP-01 QA_INSTRUCTION](handoffs/WP-01/QA_INSTRUCTION.md) 对该 exact SHA 做独立 QA，结果直接评论在 PR 上，然后 STOP。 |
| B 等 L3 的 G4 之后再开 | 一次只推进一条线 | 暂不派发 |
| C 暂缓 WP-01 | 先做其他规划 | 暂不派发 |

## 3. 进行中（不需要决策，Management 只需跟进）
- **A50 QA（PR #4）：** 用户新开的云端会话按 [A50](architecture/D007_A50_Q1E_L3_ADOPT_2757AA6_CLOUD_QA.md) 执行。QA_REPORT 评论在 PR #4 上，同时写入 `bus/QA_TO_DESIGN.md`。

## 4. 回传方式（A52 文件总线）
- **Management：** 把用户选择（如 `DEC-1=A`）和派发内容写进 `bus/MANAGEMENT_TO_EXECUTION.md`。
- **Execution：** 完成后，把 PR 号和 exact SHA 写进 `bus/EXECUTION_TO_QA.md`。
- **QA：** 把评论 ID 和结论写进 `bus/QA_TO_DESIGN.md`。
- **Design：** 轮询到 QA 结果后，先在 GitHub 上核对证据，再裁决 G4，然后覆盖本文件开始下一轮。

## 5. 不变的规则
- QA 必须在用户单独开的云端 Linux 会话中进行（Node v22.23.5）。
- 每个任务只能针对 exact SHA 做 QA；裁决（G4）只能由 Design 作出。
- 不在 GitHub 中放密钥或真实数据。
- 不修改已冻结的 Module 002 UI。
- 合并、真实服务、部署每一项都需要用户单独批准；需要时会作为一个 DEC 出现在 §2。
