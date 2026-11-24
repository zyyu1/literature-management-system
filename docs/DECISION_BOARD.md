<!-- BUS from=DESIGN to=MANAGEMENT seq=5 re=bus/QA_TO_DESIGN.md@3 status=OPEN updated=2026-11-24T18:00+01:00 -->
# 决策板 / Decision Board — 每轮整体覆盖

> **用法（[A51](governance/D007_A51_DECISION_BOARD_WORKFLOW.md) + [A52](governance/D007_A52_FILE_BUS_POLLING.md)）：** Design 每轮整体覆盖本文件。
> - **Management：** 读取本文件，把 §2 的每个 DEC 以可点击选项问用户。用户选定后写 `bus/MANAGEMENT_TO_EXECUTION.md`。
> - **Execution：** 完成后写 `bus/EXECUTION_TO_QA.md`。
> - **QA：** 完成后写 `bus/QA_TO_DESIGN.md`。
>
> 正式授权以 `docs/architecture/D007_A*.md` 为准。

**轮次:** R5（seq 5）· 2026-11-24 18:00 · 基于 `main@9f75183`

## 1. 当前状态
| 工作线 | 对象 | 状态 |
| --- | --- | --- |
| **WP-01 合成认证 API** | PR #5 `100cb63` | **G4 PASS_LOCAL**（[A55](architecture/D007_A55_WP01_EXACT_G4_PASS_LOCAL.md)）。QA 结果：67/67 ×5，QA 自写变异 14/14 被杀，无 P0/P1/P2。第一个产品切片完成 |
| POC-001 R10 | PR #2 `a9131ac` | G4 PASS_LOCAL；保持 OPEN 存档（DEC-2=A） |
| Q1E-L3 | PR #4 `2757aa6` | G4 PASS_MODEL_ONLY；保持 OPEN 存档 |
| 工具 | `tools/offline/run-offline.sh` | 已按 QA INFO-1 改为只保留白名单环境变量（`env -i`），出网探针复测 PASS |
| 全局 | — | 真实服务、部署禁止；物理持久性、备份恢复未验证 |

## 2. 待用户决策（Management 逐个呈给用户）

### DEC-4：WP-01（PR #5）是否合并进 main？（G5）
**背景：** 这是第一个产品代码，只用合成数据、不接任何服务。合并只是让后续切片能在它上面继续开发，**不是部署**。

| 选项 | 内容 | 派发 |
| --- | --- | --- |
| **A（推荐）合并** | 用 **merge commit** 把 PR #5 合并进 `main`，不 squash、不 rebase。合并前先确认 PR head 仍是 `100cb6352539577ad086545ce794096f887b04d7`；head 有变化就 STOP。 | Management 在 PR #5 上执行合并，写入 `bus/MANAGEMENT_TO_EXECUTION.md` 作记录。不需要派 Execution 或 QA。 |
| B 暂不合并 | PR 保持 OPEN；WP-02 以 `100cb63` 为起点 | 不派发 |

### DEC-5：下一个工作包
| 选项 | 内容 | 派发 |
| --- | --- | --- |
| **A（推荐）设计 WP-02** | WP-02：Project 和文献的只读切片。合成的 3 个 Project、规范化的论文 ID（同一篇去重）、Project 与论文的关联和"重要"标记，都基于 WP-01 的认证边界。**Design 先出 G1 授权文件（白名单、Base、QA 计划）**，放到下一轮决策板上供你批准，本轮不写代码。 | 不派发；由 Design 在下一轮发布 G1 草案 |
| B 先补 WP-01 的测试 | 补跑冻结 UI 的 26 个 U6 场景中、合成环境能做的部分 | 不派发；由 Design 在下一轮出范围 |
| C 暂停 | — | 不派发 |

## 3. 进行中
无。

## 4. 回传方式
Management 写 `bus/MANAGEMENT_TO_EXECUTION.md`（内容为 `DEC-4=?`、`DEC-5=?`，以及合并结果的提交 SHA，如有）→ Design 在下一轮记录。

## 5. 不变的规则
- QA 只在独立的云端 Linux 会话中进行，所有测试都通过 `run-offline.sh` 运行（A54）。
- QA 只针对 exact SHA；G4 只由 Design 裁决。
- 不放任何密钥或真实数据。
- 冻结的 UI 不动。
- 真实服务和部署都只能通过用户明确选择的 DEC 进行。
