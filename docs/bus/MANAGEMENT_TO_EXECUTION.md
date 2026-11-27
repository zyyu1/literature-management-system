<!-- BUS from=MANAGEMENT to=EXECUTION seq=52 re=DECISION_BOARD.md@50 status=OPEN updated=2026-11-27T16:02+01:00 -->
# Management → Execution（DEC-40=A：释放 P0-STORE R3 定向独立 G3 给 QA）

**来源:** `docs/DECISION_BOARD.md` seq 50（R50）任务单。
**用户决定（Design 窗口）:** **DEC-40 = A**：释放 P0-STORE R3 上线准备切片的**定向独立 G3**。
**授权:** `D007_A97_P0STORE_R3_G2_ACCEPTED.md`（**G2 ACCEPTED at `6a59ce9…`**）。
**QA 内容:** `docs/handoffs/P0-STORE/R3_LIVE_READINESS.md` §5（从 `main` 读取）。
**性质:** 只派独立 QA；**不派 Execution、不改候选、不合并、不做任何真实运行**。

## 对象

- PR **#9** `exec/P0STORE-nutstore-probe-r1` → `main`（保持 OPEN）。
- **exact HEAD `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`**；Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`；
  R3 前起点 `b6fec8e3b0ec217b142b428080454588e6866744`。
- **首次且唯一** `git ls-remote <repo> refs/pull/9/head` 必须 `exit 0` 且等于该 SHA，否则 STOP（落盘命令/时间/stdout/stderr，无重试）。
- **全部证据必须在该 HEAD 上取得**（不得复用 Execution 在 `ba43519` 的 G2 结果作为本 SHA 验收）。

## 定向 G3 内容（R3_LIVE_READINESS §5，逐项做）

1. **语法**；
2. **完整 `node --test`（P1-01..P1-15）**；
3. **QA 自写严格 TAP** 的上游：WP-01 **67**、WP-02 **44**（嵌套 67）、WP-03 **103**、WP-04 **91**；
4. **候选审计正例 + 计数中性负例**（至少一个被修改路径，由**它自己专门的检查**报错）；
5. **QA 自写 live 门控矩阵**——7 个条件逐一缺失或错误：`--live` 缺失、计划非 `mode:"live"`、
   `dav.jianguoyun.com.evil` / `jianguoyun.com` / IP 字面量 / 未规范化大写、错误端口、前缀越出 `/dav/LMS-P0STORE/`、
   已提交计划 `accessApprovalId` 非 null、approval 格式非法、计划自带 runId、Node 版本不符（打桩）；
   每项必须由 **QA 自己计数零传输调用**，并**证明凭证值未被读取**（毒化 env）；
6. **全部条件满足 + QA 自己的桩传输（无 socket）**：首个计划请求目标必须**精确**为
   `https://dav.jianguoyun.com:443/dav/LMS-P0STORE/<runId>/…`；**金丝雀扫描**（凭证不出现在 trace/log/error）；
7. **确认 `PHASE1_LIVE_ENABLED` 无任何代码读取**。注意 Execution 的披露：该常量仅作为冻结
   `support/harness.mjs` re-export 所需的**死兼容导出**保留（移除会破坏冻结文件字节不变）；
   QA 的判据应是“无 live 代码读取它”，不是“常量不存在”；
8. **字节证明**：`gate / secret / trace / oracle / verdict / support / example-plan` 相对 `b6fec8e` **逐字节不变**；
   真实主机字面量**恰好两处**（live 计划 + `LIVE_HOST` 固定常量），其余出现即失败；
9. **committed driver 22/22 全部击杀 + ≥3 个 QA 门控 mutant**（缺失 approval、错误主机、跳过 Node 检查等）。

## 环境

- 独立 QA 会话与**独立可写目录**（不得共用 Management/Execution 的 clone）；fresh full clone，
  `core.autocrlf=false`、detached 该 HEAD、工作树干净。
- Node **精确 v22.23.5 x64（完整路径、普通权限）**；A59 Windows 离线区间或已具备资格的 A54/A55 Linux；
  Linux 未跑记 `NOT_RUN`。
- 每组前后 guard + probe、脱敏 OS 事实与原始日志；子进程在重连前结束；不联网跑测试、不装依赖。
- **绝不设置任何真实凭证、绝不连接坚果云主机**；不读取真实用户数据。

## 交付

- PR #9 发**一条新评论**：A86 DEC-27 **逐项表**——每行 `PASS`（附实际输入、断言原文、退出码）或
  `FAIL` / `NOT_RUN` / `NOT_RECORDED`；聚合 PASS 视为不完整（只退回补表）。
- 然后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **23**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@52`，含 PR / exact SHA / QA 评论 ID / verdict / 关键数字 / P0-P2；
  只提交该文件，`bus(qa): seq 23`，**QA STOP**。

## 边界

- **Execution 本轮无任务**：若被唤醒，只回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@52` 并注明
  “本轮为独立 QA 的 P0-STORE R3 定向 G3、Execution 未参与”，随后 STOP。
- QA 不改候选、不合并、不裁定门禁；**G4 只由 Design**。
- **真实运行（第 3 阶段 / ACCESS-02 / G6）仍需之后由用户单独批准，且必须点名 R3 的 exact SHA**；
  G7 未授权；P0-STORE 仍 **BLOCKED**；A70/A71 暂停；冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
- 任何 SHA 漂移、环境缺口、权限错误 → 如实 STOP/FAIL，绝不伪造 PASS。
