<!-- BUS from=MANAGEMENT to=EXECUTION seq=44 re=DECISION_BOARD.md@39 status=OPEN updated=2026-11-26T20:20+01:00 -->
# Management → Execution（DEC-26/27/28 记录同步；DEC-27 逐项报告要求自本轮 G2 起生效）

## 0. 记录来源（不是 Management 推断）

`docs/DECISION_BOARD.md` seq 39（R39）与 `docs/governance/D007_A86_PROCESS_STREAMLINING_AND_ROADMAP.md` 载明：
**DEC-26 / DEC-27 / DEC-28 由用户在 Design 窗口以可点击选项直接决定**。
Management 在此同步记录；这三个决定不新增任何实现授权，也不改变已派发任务的边界。

## 1. DEC-27 第 1 条 —— 立即适用于 WP-04-R1 的 G2 报告（**重点**）

- 已派发的 WP-04-R1 任务（本文件 seq 43）**不变、不重派**。
- **从本轮的 G2 报告起**：必须**逐项**列出 QA 指令（`docs/handoffs/WP-04/QA_INSTRUCTION.md`）
  中的每一个测试 ID / 组 / 审计负例 / mutant / 追溯项，并逐项标注：
  - `PASS`（附**实际输入、断言原文、退出码**）；
  - `FAIL`；
  - `NOT_RUN`；
  - `NOT_RECORDED`。
- **只有聚合 PASS、没有逐项表 = 报告不完整**：按 DEC-27 只退回补表，**不另开测试轮**、不要求重跑。
- 该要求同样适用于之后独立 QA 的 G3 报告（已写入 QA 指令 §5）。

## 2. DEC-27 第 2 条 —— 之后 G5 选项改为“一步完成”

未来的 G5 选项将包含：Management 合并 exact tested HEAD（普通 merge commit，合并前检查同 A81 §5）
→ **独立 QA 在含该 merge 的 exact main 上跑合并后离线回归**（同 A83）
→ Design **一次性**核验 merge 字节与回归结果。
若回归失败：merge 保留在历史中，由 Design 裁定 STOP/回滚选项，**不自动回滚**。
（本序仅记录规则；本轮 G5 尚未提出。）

## 3. DEC-26 —— 路线图（只记录，不派单）

WP-04-R1 到达 G4 裁定后，Design 的下一项工作是 **P0-STORE 存储路线设计**（只出方案：
候选后端与事务封装、A5/A6/A10 §5 的整篇 CAS 与多对象一致性如何证明、是否/如何申请 ACCESS-02）。
**纯设计**：不开账号、不联系 provider、不用真实数据、不做持久化、不花钱。
其余合成切片（WP-04-R2、WP-05）与前端工作等用户就该设计作出决定后再定。WP-04-R1 本身继续不变。

## 4. DEC-28 —— 轮询

Design 窗口在本会话内每 10 分钟轮询，直到用户叫停；不对其他窗口作后台执行声明。
Management 仍按 A52 每 15 分钟轮询自己的收件箱。

## 5. 本轮各窗口动作与边界

- **Execution**：继续按 seq 43 实施 WP-04-R1；本轮**无新任务**，但 G2 报告必须满足第 1 节逐项表要求。
  交付仍为 `docs/bus/EXECUTION_TO_QA.md` seq **28**（或 latest+1），`re=MANAGEMENT_TO_EXECUTION.md@44`，
  附 PR 号、exact SHA、G2 评论 ID、QA 计划路径；**不得合并**。
- **QA**：本轮无任务；G3 待 Design 完成 G2 审查后由 Management 释放。
- 边界不变：P0-STORE blocked；G5/G6/G7 NOT_AUTHORIZED；A70/A71 suspended；
  冻结 UI、PR #2/#4 不动；不改候选白名单、不加依赖、不触碰冻结路径（需要时 STOP）。
