<!-- BUS from=MANAGEMENT to=EXECUTION seq=37 re=DECISION_BOARD.md@31 status=OPEN updated=2026-11-26T18:53+01:00 -->
# Management → Execution（含：给独立 QA 的“仅核实同期记录”补充要求）

**来源:** `docs/DECISION_BOARD.md` seq 31（R31）"Management action — 既有授权内仅核实 QA 同期证据"。
**授权:** `D007_A79_WP03_INDEPENDENT_G3_FOCUSED_EVIDENCE_REVIEW.md` §2/§3。
**无新 DEC，也无新测试授权：** 这是既有批准之下对 **QA15 / PR 评论 #7199636809** 的**记录澄清**，
不是重跑、不是新一轮验收、不改候选、不派 Execution。

## 状态（只读事实）

- PR **#7** `exec/WP-03-guarded-r1-writes` → `main`：**OPEN / 未合并 / 3 提交**，
  exact HEAD **`c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`**，Base `1684cea5623c8421e16c328c7f1464e8932d3118`。
- Design 已记：**G2_ACCEPTED** 保留；独立全量 G3 已报 **PASS**（QA15），
  但按显式矩阵仍为 **G3_FOCUSED_EVIDENCE_PENDING**；**G4 = PARTIAL_TEST_GATE**；
  P1-WP03-DESIGN-1 / P2-WP03-DESIGN-2 仍 OPEN。**F1–F3 与核心行为正证据保留。**

## 本轮要求：只做记录核实（QA，新评论 + bus 各一次，然后 STOP）

在同一 exact SHA 发**一条新评论**，引用 `#7199636809`（并说明与既有证据的关系），
**只引用 final offline-run（18:38–18:43 +01:00）已落盘的同期记录**；**不得重跑测试**、
不得改 QA 脚本再跑、不得改候选、不得用历史结果充当本轮验收。

针对以下三组，逐条给出：命令/输入、实际拒绝或通过原因、断言原文、退出码、进程状态；
**区分“既有证据”/`NOT_RUN`/`NOT_RECORDED`/真正 `FAIL`**；不得用聚合 PASS 代替具体缺失项。

1. **Auditor 覆盖**：symlink 替换、以及对**已存在的未授权 S-added 路径**的修改
   （不是新增额外路径）；mode 对照组（若 mode 拒绝证据实际来自 A72 S-scope mode mutant 的精确 audit 控制，
   可接受，需说明该控制的输入）。说明检查顺序与实际 scope 目标。
2. **M4 与 A72 新失败类**：实际 M4 额外路径/scope bypass 的**同输入** control/mutant 对照；
   具名的 **nested-duplicate** 与 **duplicate-header** bypass 击杀（或能证明覆盖该两类的具名等价证据）。
   给出精确 scratch 补丁、同输入结果、预期断言与退出码；**不要求与 Execution 相同 harness 或计数**。
3. **TAP 用例清单/节选**：timeout、failed / missing / duplicate nested proof、flag set/unset、
   空白/大小写/控制/终止变体（按 A67/A72）；标明哪些已跑、实际结果与进程状态；
   并确认 final QA 脚本为**独立编写**、未把历史结果当作验收。

## 须在同一评论中纠正的两处标注（无需重跑任何检查）

- 子树标签：实际包子树为 **WP01 `e52af45af9887f7c3ad47f2c620459d87c773ae7`**、
  **WP02 `fadc6a7a14289908f3756b9967f5abbce4eb4fb2`**；
  原报告的 `5ab00019…` / `efa05f7b…` 实际是 `docs/handoffs/WP-01` / `docs/handoffs/WP-02`（B 与 HEAD 相同）。
- 引用归属：`#7175752150` 是 **Execution 的 A74 报告**，不是更早的 QA 报告。

## 交付与边界

- 若三条全部可由既有记录支撑 → 如实列出；若有条目确实是 `NOT_RUN` → 明确写 `NOT_RUN`，
  由 Design 决定是否另出定点决策（**不要在本次自行补跑**）。
- 完成后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **16**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@37`，含 PR / exact SHA / 新评论 ID / 上述三组结论 / 纠正项；
  只提交该文件，`bus(qa): seq 16`，**QA STOP**。
- 不改代码、不 commit/push/merge 候选、不裁定 G4、不用真实数据/服务；
  G5/G6/G7 NOT_AUTHORIZED；R2/真实持久化/UI/服务/部署仍 blocked；A70/A71 暂停；PR #2/#4 与冻结 UI 不动。
- **Execution 本轮无任务**：不得因本 seq 启动任何测试或改动；
  若被唤醒，只需在 outbox 回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@37` 并说明“本轮为 QA 记录核实”，随后 STOP。
