<!-- BUS from=MANAGEMENT to=EXECUTION seq=34 re=DECISION_BOARD.md@28 status=OPEN updated=2026-11-25T23:35+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 28（R28）§2，用户选定 **DEC-18 = A**。
**授权:** `D007_A76_WP03_A74_TARGETED_M2_M3_VALIDATION_DRAFT.md` §2（只读定点验证，仅 M2 / M3）。

## 性质

- PR **#7**，exact HEAD **`c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`**（OPEN / 未合并，3 提交）。
- **不允许**：改候选、新增提交、新分支/PR、merge/rebase/reset/force push；只允许在**仓库外**的
  disposable scratch 里做变异，以及写 PR 评论与本 bus 文件。
- **不重跑**其他矩阵（A74 的 103/67/44、oracle、audit、pins、integration 全部保留，不重复）。
- 若两项任一处不成立 → 如实报告并 **STOP**，不得补造。

## 环境（不满足即 STOP）

- 全新 full detached clone 到该 SHA；`core.autocrlf=false`；工作树干净。
- **首次** subject ref 读取：TLS backend / 凭证 helper 事先配好（不得关闭 TLS 校验）；
  一次 `exit 0` 且精确返回该 SHA，把命令/stdout/stderr/退出码/时间**落盘**；失败即 STOP，无重试豁免。
- Node **精确 v22.23.5 x64**；Windows → A59 用户控制离线区间，或 Linux → A54/A55 命名空间。
- 所有 scratch/test/子进程在隔离内；**每个命令组前后各一次**探针并记录脱敏 OS 事实与原始日志；
  不得在联网状态跑测试、不得改系统/安装/提权。

## M2：真实入口的四项计数与预期击杀

- 必须打在**候选自身**的 Q3-11 模块守卫与 behavioral harness 模块守卫上，
  **不得**用手写的无关控制脚本代替。
- 用独立编写的桩/插桩覆盖 **spawn / listen / connect / request 四项**，覆盖实际入口；
  零真实网络、无危险子进程。
- control：用受控桩或代理环境强制触发守卫拒绝，记录实际拒绝原因，
  并在任何副作用发生**之前**记录**四项均为 0**；说明每一项为何在该路径上不可达（reachability）。
- mutant：只在 scratch 变体中**移除那一处守卫调用**，其余行为保持不变；证明被插桩的
  spawn/listen 路径确实被触达（允许拆成 M2a/M2b），并给出**预期断言失败**原文
  （不能只写计数后 exit 0）。
- 落盘：精确源码/补丁、输入、四项计数、断言原文、退出码、还原过程；崩溃/超时不算击杀。

## M3：同一损坏夹具的双向对照

- 输入：对 `docs/handoffs/WP-01/fixtures/wp01.v1.json` **追加一个 LF 字节**，
  两份 disposable 副本必须用**同一输入**并记录输入 SHA-256。
- 三个结果都要有：
  1. 完整夹具 + 未修改测试 → 绿色（正向控制）；
  2. 损坏夹具 + 未修改测试 → exit 1，且失败来自**受保护依赖字节**的预期断言；
  3. 损坏夹具 + **仅绕过受保护清单断言**的精确 scratch 补丁 → 必须 `exit 0`（接受）；
     该绕过本身要能被 oracle 以预期断言杀死。
- 落盘：精确补丁、两个输入哈希、原始测试输出与退出码；不得以崩溃/超时充数；不得改真实候选或外部数据。

## 交付

- 在 PR #7 发一条**新**评论（同 SHA），引用 `#7175752150` 与 `#7176018233`，按 M2、M3 两组分别给出：
  命令、时间、退出码、原始输出、补丁、计数记录、夹具哈希、隔离边界；缺失写 `NOT_RUN`/`NOT_RECORDED`。
- 结束时核对原始 clone 干净、live HEAD 仍为该 SHA。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（**24**），只提交该文件，提交信息 `bus(execution): seq 24`；**EXECUTION STOP**。

## 边界

- 两项都合规后，Design 才可用 **A74 + A76 的同 SHA 证据**合并判断并释放独立全量 G3（QA 下一 seq 从 15 起）。
- **不得合并**；G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；
  PR #2/#4 与冻结 UI 不动；A70/A71 继续暂停；P1/P2 仍 OPEN。
