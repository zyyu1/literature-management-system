<!-- BUS from=MANAGEMENT to=EXECUTION seq=33 re=DECISION_BOARD.md@27 status=OPEN updated=2026-11-25T23:15+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 27（R27）§Management action。**仍在 DEC-17=A / A74 范围内，没有新 G1、没有新 DEC。**
**授权文件:** `D007_A75_WP03_A74_G2_FOCUSED_EVIDENCE_REVIEW.md` §2。

## 本单只做一件事：贴出**已有日志**里的三处原文

- 对象不变：PR **#7**，exact HEAD **`c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`**（OPEN / 未合并）。
- **禁止**：新测试、新运行、重跑全量、改代码、新增提交/分支、编辑既有评论 `#7175752150`。
- **只允许**：把本轮 A74 已经落盘的日志（`.work/ex/a74/logs/09-bypass*`、`10-integration*`、`scratch/`）
  里的关键原文整理成一条**新的** PR 评论，并写 `EXECUTION_TO_QA.md` 下一 seq（**23**）。

## 三处必须给出原文（A75 §2）

**1. M3（pinned 完整性绕过）——同一输入的双向结果**
- 实际施加的 bypass patch 原文（改了什么、怎么绕的）；
- **同一个被损坏的夹具**（同一路径、同一字节）在两种情况下：
  - 原候选：被拒绝（贴出断言/报错原文与 exit）；
  - bypass 变异：被接受（贴出实际通过/exit 0 的证据）；
- 只有“夹具被改后原候选拒绝”不算证明绕过有效性，必须补上“同一输入在绕过下被接受”那一半。

**2. M2（pre-child guard 缺失）——四个控制计数**
- control 侧：`spawn` / `listen` / `connect` / `request` 四项的**实际计数**（应全为 0，且发生在守卫拒绝之后）；
- mutant 侧：对应被触发的计数与断言失败原文；
- 请给出计数来源（桩代码位置与输出文件），不要只写结论“0 次”。

**3. Integration——父子提交与运行时哈希对照**
- disposable 克隆里被模拟合并的文档来源：exact parent 提交（应有 `8589753b…`）与生成后的 HEAD 提交；
- **pre / post 各自的 runtime 文件哈希**（证明运行时包字节未变），标明比较的是哪些对象、用什么命令算出；
- 说明该集成树上的 103/103 与嵌套 67/44 是在哪个提交、哪个目录、哪条命令下跑出来的。

## 处置规则

- 日志里**有** → 原样摘录（可截断但标明截断位置与文件路径），脱敏后贴进新评论。
- 日志里**没有** → 写 `NOT_RECORDED` / `NOT_RUN`，**不得补造、不得重跑替代**。
- 存在但结果**是失败** → 如实写并 **STOP**。
- 完成后写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（23），只提交该文件，提交信息 `bus(execution): seq 23`；**EXECUTION STOP**。

## 边界

- **不派 QA**；Design 复核后才释放独立 G3（QA 下一 seq 从 15 起）。
- **不得合并**；G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；
  PR #2/#4 与冻结 UI 不动；A70/A71 继续暂停；P1/P2 仍 OPEN。
