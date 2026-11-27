<!-- BUS from=MANAGEMENT to=EXECUTION seq=50 re=DECISION_BOARD.md@47 status=OPEN updated=2026-11-27T14:36+01:00 -->
# Management → Execution（DEC-38=A：释放 P0-STORE R2 定向独立 G3 给 QA）

**来源:** `docs/DECISION_BOARD.md` seq 47（R47）任务单。
**用户决定（Design 窗口）:** **DEC-38 = A**：释放 P0-STORE R2 判定修正的**定向独立 G3**。
**授权:** `D007_A94_P0STORE_R2_G2_ACCEPTED.md`（**G2 ACCEPTED at `b6fec8e…`**）。
**QA 内容:** `docs/handoffs/P0-STORE/R2_VERDICT_FIX.md` §5（从 `main` 读取）。
**性质:** 只派独立 QA；**不派 Execution、不改候选、不合并**。

## 对象

- PR **#9** `exec/P0STORE-nutstore-probe-r1` → `main`（保持 OPEN）。
- **exact HEAD `b6fec8e3b0ec217b142b428080454588e6866744`**；Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`；
  起点（R2 前）`88e1bd76dc94fc38876fa28c975d317b1c1573c2`。
- **首次且唯一** `git ls-remote <repo> refs/pull/9/head` 必须 `exit 0` 且等于该 SHA，否则 STOP（落盘命令/时间/stdout/stderr，无重试）。
- **全部证据必须在该 HEAD 上取得**（不得复用 Execution 在 `4032187` 的 G2 结果作为本 SHA 验收）。

## 定向 G3 内容（R2_VERDICT_FIX §5，逐项做）

1. **语法**；
2. **完整 `node --test`（P1-01..P1-14）**；
3. **QA 自写严格 TAP** 的上游：WP-01 **67**、WP-02 **44**（嵌套 67）、WP-03 **103**、WP-04 **91**；
4. **候选审计正例 + 计数中性负例**：至少一个被修改路径的负例，必须由**它自己专门的检查**报错；
5. **QA 自写的 11 性格判定矩阵 + 原因顺序**（独立断言，不读 Execution 期望）：
   `throttle / server-error / redirect / bad-cert = INCONCLUSIVE`；
   `stale-read`、`weak-etag`、`unresolvable-ack` 的**根因必须排在最前**；
6. **零出网复核（5 种组合）+ 金丝雀扫描**（金丝雀字符串不得出现在任何 trace / 日志 / 错误）；
7. **committed driver 16/16 全部击杀 + ≥3 个 QA 独立 mutant**（针对新规则：提前 STOP→PARTIAL、INCONCLUSIVE→GO、原因顺序倒置）；
8. **字节证明**：`gate / plan / secret / trace / runner / oracle / support / plans` 相对 `88e1bd7` 逐字节不变，
   且 `PHASE1_LIVE_ENABLED = false`；并核对 P1-03 的改动**仅限** bad-cert / redirect 两处 verdict 断言
   （`PARTIAL → INCONCLUSIVE`）加各自一行 R2 说明。

## 环境

- 独立 QA 会话与**独立可写目录**（不得共用 Management/Execution 的 clone）；fresh full clone，
  `core.autocrlf=false`、detached 该 HEAD、工作树干净。
- Node **精确 v22.23.5 x64**（按完整路径调用、非提权 shell）；A59 Windows 用户控制离线区间或已具备资格的 A54/A55 Linux；
  Linux 未跑记 `NOT_RUN`。
- 每组前后 guard + probe、脱敏 OS 事实与原始日志；子进程在重连前结束；不联网跑测试、不装依赖。
- **不得接触任何真实坚果云主机、账号或凭证**；不读取真实用户数据。

## 交付

- PR #9 发**一条新评论**：A86 DEC-27 **逐项表**——每行 `PASS`（附实际输入、断言原文、退出码）或
  `FAIL` / `NOT_RUN` / `NOT_RECORDED`；聚合 PASS 视为不完整（只退回补表）。
- 然后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **22**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@50`，含 PR / exact SHA / QA 评论 ID / verdict / 关键数字 / P0-P2；
  只提交该文件，`bus(qa): seq 22`，**QA STOP**。

## 边界

- **Execution 本轮无任务**：若被唤醒，只回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@50` 并注明
  “本轮为独立 QA 的 P0-STORE R2 定向 G3、Execution 未参与”，随后 STOP。
- QA 不改候选、不合并、不裁定门禁；**G4 只由 Design**（通过后 LIM-P0S-1 关闭）。
- 第 3 阶段 / ACCESS-02 / G6、G7 均**未授权**；P0-STORE 仍 **BLOCKED**；A70/A71 暂停；
  冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
- 任何 SHA 漂移、环境缺口、权限错误 → 如实 STOP/FAIL，绝不伪造 PASS。
