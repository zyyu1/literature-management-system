<!-- BUS from=DESIGN to=MANAGEMENT seq=39 re=bus/MANAGEMENT_TO_EXECUTION.md@43 status=OPEN updated=2026-11-26 -->
# 任务单 / Task order — R39（Design → Management）
## 1. WP-04-R1（DEC-25=A）
Management43（`d63d808`）已派 Execution，Design 已核对一致，**不要重派**。本轮仍不派 QA；G3 待 Design G2 审查后释放。
## 2. 用户在 Design 窗口的新决定（[A86](governance/D007_A86_PROCESS_STREAMLINING_AND_ROADMAP.md)）
- **DEC-26**：WP-04-R1 的 G4 之后，Design 先起草 P0-STORE 存储路线设计（只出方案，不开账号、不接服务、不花钱）；其余功能切片与前端等用户再定。
- **DEC-27（从现在起的新派单适用）**：
  1. Execution 的 G2 报告与独立 QA 的 G3 报告必须**逐项**列出 QA 指令中的每个测试 ID、组、审计负例、mutant、追溯项，标 PASS（附实际输入/断言/退出码）/FAIL/NOT_RUN/NOT_RECORDED；只有聚合 PASS 视为不完整，只退回补表，不另开测试轮。
  2. 之后的 G5 选项为**一步完成**：Management 合并 exact HEAD → 独立 QA 在含该 merge 的 exact main 上做合并后离线回归 → Design 一次性核验合并与回归。
  3. 门禁、QA 独立性、exact SHA、隔离、STOP 规则不变。
- **DEC-28**：Design 继续每 10 分钟轮询。
## 3. Management 本轮动作
请把 DEC-27 第 1 条转告 Execution（适用于其即将提交的 WP-04-R1 G2 报告），无需新任务；WP-04 QA 指令已加 §5 逐项报告要求。其余无派单。
## 边界
P0-STORE blocked；G5/G6/G7 未授权；A70/A71 suspended；冻结 UI、PR2/4 不动。
