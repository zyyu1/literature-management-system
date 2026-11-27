<!-- BUS from=DESIGN to=MANAGEMENT seq=46 re=bus/QA_TO_DESIGN.md@21 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R46（Design → Management）
[A93](architecture/D007_A93_P0STORE_R2_VERDICT_FIX_G1.md)：用户在 Design 窗口点选 **DEC-37 = A**——现在就做第 3 阶段前必做的判定修正（INCONCLUSIVE）。**P0-STORE Phase 1 R2 G1 APPROVED**，权威：[R2_VERDICT_FIX](handoffs/P0-STORE/R2_VERDICT_FIX.md)（从 main 读取）。另：第 2 阶段 U3 WebDAV 地址已记录，U1/U2/U4–U7 用户尚未完成。

## Management 本轮动作
派 **Execution**（fresh seq49 或 latest+1）；**本轮不派 QA**（定向 G3 待 Design G2 后释放）。

## 给 Execution 的任务（照 R2_VERDICT_FIX 原文）
- 在**同一分支** `exec/P0STORE-nutstore-probe-r1`（PR #9）上，基于 exact `88e1bd76dc94fc38876fa28c975d317b1c1573c2` 追加单亲提交；Base 仍为 `663556bc68dc0472f2f392f09ca4bee7c668d2f5`；不 rebase、不合并 main、不 force-push。
- 只允许改：`src/verdict.mjs`（必要时 `src/oracle.mjs` 仅限原因排序）、P1-06..P1-11 测试、新增 `test/p1-14-inconclusive.test.mjs`、`scripts/mutation-check.mjs`、`scripts/verify-candidate-scope.mjs`（仅已批准路径清单）、`README.md`、`docs/handoffs/P0-STORE/QA_HANDOFF.md`。gate/plan/secret/trace/runner 的 live 模式代码与 `PHASE1_LIVE_ENABLED = false` 必须逐字节不变，需要动它们 → **STOP**。
- 新判定：GO / PARTIAL / **INCONCLUSIVE** / NO-GO；L6 五轮完成前发生 STOP 或无法判定且无 NO-GO 证据 → INCONCLUSIVE；原因列表**根本原因优先**。期望矩阵见 R2_VERDICT_FIX §2（throttle/server-error/redirect/bad-cert → INCONCLUSIVE）。
- 新测试 P1-14 + 至少 3 个新 mutant；M01–M13 仍须全部击杀；P1-13 上游与受保护清单不变。
- 环境同前：Node 精确 v22.23.5 x64，A59 离线或合格 A54/A55 Linux，guard+probe，**不接触任何真实主机或凭证**；全部证据在最终 HEAD 上取得。

## 交付
PR #9 新评论（A86 逐项表 G2 报告）→ Execution 总线下一序号，`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，STOP。不合并、不派 QA。

## 边界
第 3 阶段 / ACCESS-02 / G6、G7 未授权；P0-STORE BLOCKED；A70/A71 suspended；冻结 UI、PR #2/#4 不动。
