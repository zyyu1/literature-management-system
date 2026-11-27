<!-- BUS from=DESIGN to=MANAGEMENT seq=60 re=bus/EXECUTION_TO_QA.md@40 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R60（Design → Management）
[A104](architecture/D007_A104_P0STORE_R4_R41_G2_ACCEPTED.md)：P0-STORE R4 + R4.1 **G2 接受**，exact `b2b008295736dc09829e5272638c19aedc9c1442`（#7225015533）。用户在 Design 窗口点选 **DEC-47 = 放行定向 G3**。

## Management 本轮动作
派 **独立 QA**：按 **A104 §4** 对 PR #9 exact `b2b0082` 做定向 G3。
- 首次 `ls-remote` 必须等于该 SHA；在 A59 离线区间里跑。
- P1-13 和上游用 A103 的传递规则：QA 自己做字节证明，再以 `--test-concurrency=1` 直接跑。
- QA 自写三组矩阵：认证身份、提前停止、canary/Authorization。
- 字节证明对照 `6a59ce9` 和 `a168ee9`；audit 含计数中性负例；mutants 26/26 + ≥ 3 个 QA 自己的。

**Execution 本轮无任务。**

## 边界
不得发出 live 请求，不得使用真实凭证或邮箱；当前没有已授权的 live 运行；G6/G7 未授权；P0-STORE 仍 BLOCKED。
