<!-- BUS from=EXECUTION to=QA seq=38 re=MANAGEMENT_TO_EXECUTION.md@59 status=STOP updated=2026-11-27T18:36+01:00 -->
# Execution → QA

## STOP — A101 隔离取证已在有效 A59 区间内执行，但 (b) 从未通过、(c) 未全绿；冻结 guard 的 PowerShell 查询在本机并发下超时

### 1. 已按 seq 59 / A101 §3 执行

- **已推送** `6c59f35`（普通提交，父 `a168ee9`；PR #9 head 现为 `6c59f35…`，未 force、未改冻结文件）。
- **一次有效 A59 离线区间**（`p0store-a101-2026-11-27T17-20-38-603Z`）：6 个 guard/probe 全部 PASS
  （`pre-a/post-a/pre-b/post-b/pre-c/post-c`），区间内无网络恢复。
- 固定 Node v22.23.5 x64、普通权限；无 live 请求、无真实凭证/邮箱。

### 2. 三组结果（原样）

- **(a) 完整 suite 一次**：exit 1，`tests 94 / pass 93 / fail 1`；唯一失败为 **P1-13**（`not ok 62`），
  即 A101 允许的“除 P1-13 外无失败” → `aNoFailureOutsideP113=true`。
- **(b) P1-13 单独** `node --test --test-concurrency=1 test/p1-13-upstream.test.mjs`，**3/3 attempt 全部 exit 1**，
  每次失败点完全相同：`not ok 5 - P1-13 the untouched WP-04 suite …`（WP-04 child 内 `Q4-12` 的 WP-03 103/103）；
  3 次签名一致（`WP04_CHILD_Q4_12_WP03`）→ `bPassedAtLeastOnce=false`。
- **(c) 四个上游分别直接跑**：
  - WP-01 **67/67 exit 0**；WP-02 **44/44 exit 0**；
  - **WP-03 exit 1**（11/11 文件在模块加载阶段失败）；**WP-04 exit 1**（12/12 文件失败）。
  - 原始日志：WP-03/WP-04 每个文件都以
    `EGRESS_PRECONDITION_FAILED: QUERY_FAILED`（冻结 `platform-precondition.mjs:315`）失败；
    11–12 个测试文件并发启动时，每个文件的冻结 A62 守卫各启动一次 PowerShell 网络清单查询，
    8 秒超时全部触发。

### 3. 结论与请求

- 这不是候选缺陷：R4.1 只改 4 个允许文件；同一次运行中 (a) 除 P1-13 外全绿、(c) 的 WP-01/02 全绿，
  audit/mutants 本轮未跑（A101 顺序先跑 a/b/c，c 已失败）。
- 根因是**冻结 guard 的 PowerShell 查询在 11–12 并发文件下超过 8 秒**；P1-13 的 (b) 之所以 3/3 失败，
  是因为冻结的 WP-04 `Q4-12` 以默认并发 spawn WP-03 的 12 个文件，无法从 P1-13 外侧降低其并发。
- A101 验收三条中 **(b) 与 (c) 不满足**，且 (c) 的失败与 (b) 是**同一 guard 超时特征**。按 A101 §5，
  **STOP 上报 Design**，不自行改冻结文件、不放宽判定、不把无效区间计入证据。

请求 Design 裁定（任一）：

1. **允许环境级并发限制**作为证据方法：WP-03/WP-04 直接套件以 `--test-concurrency=1`（或 4）运行，
   预期可全绿；但 P1-13 的嵌套 WP-03 并发在冻结的 WP-04 代码内，仍需对 WP-04 `Q4-12` 的
   spawn 并发做最小修订，或接受 P1-13 在该主机上 `NOT_RECORDED`；
2. **换主机**：在并发压力更低的主机/会话上重跑 A101 (b)(c)（P1-13 曾在 R4 G2 与 R3 QA 通过）；
3. **限定证据范围**：接受 (a) 除 P1-13 外全绿 + (c) 以 `--test-concurrency=1` 的单文件/低并发结果，
   并把冻结 guard 的并发敏感记为 **LIM-P0-S2**，由定向 G3 在合格主机复跑。

### 4. 边界

- 未合并、未派 QA、未 force-push、未改冻结路径、未运行 live、未接触真实凭证/邮箱；
  PR #9 保持 OPEN @ `6c59f35`；当前无任何已授权的 live 运行；P0-STORE 仍 BLOCKED。
- 本序为 STOP，**未写** QA_HANDOFF 的 R4.1 证据、**未发** 增量 G2 评论。

**EXECUTION STOP（等待 Design 对冻结 guard 并发取证方法的裁定）**
