<!-- BUS from=MANAGEMENT to=EXECUTION seq=49 re=DECISION_BOARD.md@46 status=OPEN updated=2026-11-27T14:03+01:00 -->
# Management → Execution（DEC-37=A：P0-STORE Phase 1 R2 判定修正 G1 派发；并记录 DEC-35/36）

## 0. 记录同步（用户在 Design 窗口作出的决定，不是 Management 推断）

- **DEC-35 = A**（R45 / A92）：接受限制 **LIM-P0S-1**（提前 STOP 被标成 PARTIAL）；
  修好前，`PARTIAL` + `unresolved:true` 一律按“证据不足（INCONCLUSIVE）”解读；
  **增加 INCONCLUSIVE 判定是第 3 阶段真实运行前的必做改动**（A90 §6 已补充定义）。
- **DEC-36 = A**（R45 / A92）：第 2 阶段准备已发布
  `docs/handoffs/P0-STORE/PHASE2_USER_PREPARATION.md`；**U3（WebDAV 地址）已由用户记录，U1/U2/U4–U7 用户尚未完成**。
  R45 明确**无派单**（Execution 与 QA 当时都无任务）。
- **DEC-37 = A**（R46 / A93）：现在就做第 3 阶段前必做的判定修正——**P0-STORE Phase 1 R2 G1 APPROVED**。

## 1. 本轮派单（Execution）

**授权文本:** `D007_A93_P0STORE_R2_VERDICT_FIX_G1.md`；
**绑定规范:** `docs/handoffs/P0-STORE/R2_VERDICT_FIX.md`（从 `main` 读取，全文为准）。

- **同一分支** `exec/P0STORE-nutstore-probe-r1`（**PR #9**），基于 exact
  **`88e1bd76dc94fc38876fa28c975d317b1c1573c2`** 追加**单亲**提交；
  Base 仍 `663556bc68dc0472f2f392f09ca4bee7c668d2f5`；**不 rebase、不合并 main、不 force-push**。
- **只允许改**：`packages/p0store-nutstore-probe/src/verdict.mjs`、
  `src/oracle.mjs`（仅在需要原因排序时）、P1-06..P1-11 的测试文件、新增 `test/p1-14-inconclusive.test.mjs`、
  `scripts/mutation-check.mjs`、`scripts/verify-candidate-scope.mjs`（仅已批准路径清单）、`README.md`、
  `docs/handoffs/P0-STORE/QA_HANDOFF.md`。
- **逐字节不变**：gate / plan / secret / trace / runner 的 live 模式代码与 `PHASE1_LIVE_ENABLED = false`；
  需要动它们 → **STOP**。

## 2. 必须实现的行为（R2_VERDICT_FIX §2）

- `VERDICTS = ['GO', 'PARTIAL', 'INCONCLUSIVE', 'NO-GO']`。
- 优先级：① 任何 NO-GO 证据 → `NO-GO`；② 在 L6 完成 5 轮**之前**发生 STOP 或结果无法判定且无 NO-GO 证据 →
  `INCONCLUSIVE`；③ L2、L5、L6(5/5)、L7 全过但存在限制条件或之后才 STOP → `PARTIAL`；④ 全过 → `GO`。
- `reasons` 必须**根本原因优先**：把第一个失败/限制步骤自身的原因排在前面
  （例：`STALE_READ_VISIBILITY@L3` 先于 `STOP_CLEANUP_UNVERIFIED@L12`）；`rule` 写明决定条款。
- 期望矩阵：strong → GO；weak-etag → PARTIAL（`WEAK_VALIDATOR` 先）；stale-read → PARTIAL（`STALE_READ_VISIBILITY` 先，cleanup STOP 在后）；
  lost-update → NO-GO；create-overwrite → NO-GO；late-ack → GO；unresolvable-ack → PARTIAL（L6 完成后 L8，`UNRESOLVABLE_LATE_ACK` 先）；
  **throttle / server-error / redirect / bad-cert → INCONCLUSIVE（L0 即 STOP）**。

## 3. 测试与变异（R2_VERDICT_FIX §3）

- 更新 P1-06..P1-11 的期望；新增 **P1-14**：完整 11 性格判定矩阵 + 原因顺序，
  另加合成步骤集（L6 第 3 轮 STOP → INCONCLUSIVE；全过后 L12 STOP → PARTIAL；NO-GO 后又 STOP → NO-GO）。
- 新增 **≥3 个具名 mutant**：提前 STOP 映射为 PARTIAL；INCONCLUSIVE 映射为 GO；后续 STOP 原因排到根因之前。
  **M01–M13 仍须全部击杀**。
- **P1-13 严格上游与受保护清单不变**。

## 4. 环境与交付

- 同前：Node **精确 v22.23.5 x64**；A59 Windows 离线或已具备资格的 A54/A55 Linux；每组前后 guard+probe、
  原始日志；子进程在重连前结束；不联网跑测试、不装依赖；**不接触任何真实主机、账号或凭证**。
- **全部证据在最终 HEAD 上取得**（full suite、上游、audit、mutation driver）。
- PR #9 发**一条新评论**：A86 DEC-27 **逐项表** G2 报告（exact head、允许改动 diff、命令/计数/退出码、
  受保护清单、mutant 表、`NOT_RUN`）。
- 然后整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **32**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@49`，含 PR 号、exact SHA、G2 评论 ID、QA 计划路径
  `docs/handoffs/P0-STORE/R2_VERDICT_FIX.md` §5（只传路径）；只提交该文件，`bus(execution): seq 32`，**EXECUTION STOP**。

## 5. 边界

- **不合并、不派 QA**；G2 由 Design 评审，定向 G3 之后由 Management 释放。
- **第 3 阶段 / ACCESS-02 / G6、G7 均未授权**；P0-STORE 仍 **BLOCKED**；A70/A71 暂停；
  冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
- 任何越界、需要真实主机/凭证/网络、或需要改冻结文件 → **STOP 并上报**。
