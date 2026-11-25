<!-- BUS from=DESIGN to=MANAGEMENT seq=12 re=DECISION_BOARD.md@11 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — 每轮整体覆盖

**轮次:** R12 (seq 12) · 2026-11-25 · observed parent `main@8533cf6881bf55970c9bff3749d8950620646bda`
**已记录：DEC-9=A**。用户在 Design 窗口直接回复 R11 的 A60 执行授权选项 A；本轮仅将已给出的批准交给 Management 正式记录及派发，不需要再次向用户询问同一决策。原 DEC-9 决策板 seq 11。A58 旧 seq 10 STOP 保留。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合并，A55 历史证据不变 |
| WP-02 | A57 PASS_LOCAL @ `222763dad068fc226e500b14250cbb7fffc0a2de`，PR #6 OPEN |
| A58 | STOP，P2 OPEN，scratch 测试不构成 G2 |
| A60 | USER APPROVED (DEC-9=A)，等待 Management fresh dispatch 生效 |
| WP-03+ / G5/G6/G7 | NOT_AUTHORIZED |

## 2. 待用户决策
无。本轮 DEC-9=A 已由用户明确给出。

## 3. Management action
写 Management→Execution **下一 seq 11**，引用当前 board seq 12 和原 DEC-9 board seq 11，记录 DEC-9=A（来源：Design 用户明确选择，A60 authority 已记载）。授权 [A60](architecture/D007_A60_CROSS_PLATFORM_TEST_INFRASTRUCTURE_G1_DRAFT.md) 的原五路径、原门禁，不扩大；PR #6，branch `exec/WP-02-project-paper-read`，exact START `222763dad068fc226e500b14250cbb7fffc0a2de`，immutable Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`。派发前核对最新 HEAD 与 STOP。
- Windows x64 优先；独立 Windows QA 必须；Linux 新 SHA 实测可选，未运行则标 NOT_RUN。Node v22.23.5，A59 等效 OS 隔离。
- WP-01 67/67、WP-02 43/43、原 Mutation Driver 13/13、A60 平台与清单负例验证；不跳过、不降低标准。
- A58 保持 STOP，不混入 Q2-02-CASE-01，A60 独立 G4 后另行恢复。禁止合并。

## 4. 回传
Execution→QA 与 QA→Design 分别写下一 seq，附原始 PR 评论 ID、新 exact SHA、五路径 diff、测试及独立证据。G4 由 Design 裁定。不得自行启动 A58 或 G5。

## 5. 边界
无产品源码、fixture、driver、历史证据、UI 修改；无真实数据/服务、部署或 PR #2/#4 修改。若有任何范围/环境/门禁不满足，STOP。
