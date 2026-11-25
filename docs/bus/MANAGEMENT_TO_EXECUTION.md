<!-- BUS from=MANAGEMENT to=EXECUTION seq=31 re=DECISION_BOARD.md@25 status=OPEN updated=2026-11-25T21:35+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 25（R25）§Management action；授权范围仍在 **DEC-16=A / A72** 内，**没有新 G1、没有新 DEC**。
**授权文件:** `D007_A73_WP03_A72_G2_SCOPE_AND_EVIDENCE_HOLD.md` §2–§3。

## 本单只做一件事：补齐**已经存在**的同期证据

- 对象不变：PR **#7**，exact HEAD **`c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`**（OPEN / 未合并）。
- **禁止**：新测试、新运行、改代码、提交、建分支、换宿主；**不得**重跑既有矩阵；
  **不得**编辑原报告 `#7172989882`；**不得**把后续的 ref 读取说成“首次”。
- **只允许**：把本轮 G2 期间**当时已记录**的日志/输出/命令，重新整理成一条新 PR 评论
  （引用原评论、同 SHA、脱敏），并写 `EXECUTION_TO_QA.md` 下一 seq（**21**）。

## 需要补齐的三类（A73 §2）

**1. 首次 subject ref 读取**
- 原始命令、时间、`exit 0`、返回的精确 SHA = `e6b1180e…`（A72 的 S），且在**任何编辑之前**；
- 证明此前没有重试；给出 preflight/clone provenance 与 push 前的 live 授权检查记录。

**2. 完整 A67 矩阵（不是摘要）**
- 四个 A66 绕过类的完整证据（含 pre-child guard 的 stub 计数、pinned 完整性、candidate audit 绕过）；
- **隔离的模拟 integration**：钉住 main 文档的旧/新对照 + 该集成树上的默认 **103/103**（含嵌套 67/67）；
- **完整 candidate auditor 负例矩阵**：多余已提交/未跟踪、Base 字节被改、Base 路径缺失、越权增量、
  mode 变化、符号链接替换、以及新增的 S-scope 负例；
- **完整 pinned dependency 负例**：上游多余/缺失/改动（含 evidence）、夹具、`tools/offline`；
- 正向 oracle 所用的**真实 WP01 67/67 与 WP02 44/44 绿色 transcript**、A67 全部既有负例；
  给出实际命令、退出码与计数，并区分「嵌套套件结果」与「单独调用套件结果」。

**3. A59 OS 边界与逐组探针**
- 完整的脱敏网卡/路由/代理事实，覆盖**整个 G2 区间**；
- **每个命令组**（含 scratch oracle、变异、负例、integration 组）的前/后探针记录；
- 6 次探针成功不足以代表整个组计划；不得据此推断“实际无外泄”。

## 处置规则

- 记录**存在** → 脱敏后贴到新 PR 评论，逐项对应上面三类。
- 记录**不存在** → 该项写 `NOT_RECORDED`（或 `NOT_RUN`），**不得补造、不得用别的运行替代**。
- 记录存在但结果**是失败** → 如实写失败并 **STOP**，不要包装。
- 若发现必须新增运行才能补齐：**不要自行运行**，写 STOP，由 Design 另出决定（A73 §3）。
- 完成后写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（21），只提交该文件，提交信息 `bus(execution): seq 21`；
  **EXECUTION STOP**。

## 边界

- **不派 QA**；Design 复核补证后才会释放独立 G3。
- 不得合并；G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；
  PR #2/#4 与冻结 UI 不动；A70/A71 继续暂停。
- 不修改候选、不改 A72 的三个路径、不改历史 QA_HANDOFF。
