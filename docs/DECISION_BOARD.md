<!-- BUS from=DESIGN to=MANAGEMENT seq=49 re=bus/QA_TO_DESIGN.md@22 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R49（Design → Management）
[A96](architecture/D007_A96_P0STORE_R3_LIVE_READINESS_G1.md)：用户在 Design 窗口点选 **DEC-39 = A**——批准 **R3 上线准备切片 G1**。权威：[R3_LIVE_READINESS](handoffs/P0-STORE/R3_LIVE_READINESS.md)（从 main 读取）。**R3 不授权任何真实请求，任何人都不设置真实凭证。**

## Management 本轮动作
派 **Execution**（fresh seq51 或 latest+1）；**本轮不派 QA**（定向 G3 待 Design G2 后释放）。

## 给 Execution 的任务（照 R3_LIVE_READINESS 原文）
- 同一分支 `exec/P0STORE-nutstore-probe-r1`（PR #9），基于 exact `b6fec8e3b0ec217b142b428080454588e6866744` 追加单亲提交；Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`；不 rebase/合并/force。
- 允许改的文件见规格 §1；`src/gate.mjs`、`secret.mjs`、`trace.mjs`、`oracle.mjs`、`verdict.mjs`、`support/`、`plans/example-plan.json` 必须逐字节不变。若还需改其他测试文件 → 先在 G2 报告列出并 STOP 等 Design 确认。
- 真实模式只有在 7 个条件同时满足时才允许：`--live`；计划 `mode:"live"`、主机**精确** `dav.jianguoyun.com`、端口 443、前缀 `/dav/LMS-P0STORE/<runId>/`；运行时 `--approval` 审批号（格式见规格，已提交的 live 计划中必须为 null）；运行时随机 runId；凭证环境变量；Node 精确 v22.23.5 x64。任一不满足 → 各自原因码、零传输调用、不读凭证。真实主机字面量只允许出现在 live 计划文件和一个固定主机常量中。
- 测试全部离线：P1-12 改写 + 新增 P1-15 门控矩阵（含错误主机变体）、桩传输证明首个请求的目标 URL、金丝雀不泄露；P1-13 上游 67/44/103/91 不变；≥5 个新 mutant，M01–M16 仍全部击杀。
- 环境：Node v22.23.5 x64（完整路径、普通权限）、A59 离线、guard+probe；**不得接触真实坚果云主机或设置真实凭证**。

## 交付
PR #9 新评论（A86 逐项表 G2 报告）→ Execution 总线下一序号，`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，STOP。不合并、不派 QA、不做真实运行。

## 边界
第 3 阶段真实运行 / ACCESS-02 / G6、G7 未授权；P0-STORE BLOCKED；A70/A71 suspended；冻结 UI、PR #2/#4 不动。
