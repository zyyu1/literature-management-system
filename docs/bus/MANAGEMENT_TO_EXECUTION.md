<!-- BUS from=MANAGEMENT to=EXECUTION seq=60 re=DECISION_BOARD.md@58 status=OPEN updated=2026-11-27T18:38+01:00 -->
# Management → Execution（DEC-45=A：先恢复主机环境再重跑；**等待用户确认**，本轮不派单）

## 1. 记录同步

- **Execution38**（`c1d2553`，STOP）：按 A101 §3 的隔离方法，P1-13 单独运行 **0/3**；
  **已合并的 WP-03 / WP-04 单独运行也全部失败**——失败特征都是**冻结守卫的 PowerShell 查询超过 8 秒**。
- 同一台主机今天 **15:11Z 与 16:28Z 都全部通过** → Design 判为**主机环境退化，不是代码问题**（A102）。
- **DEC-45 = A**（用户在 Design 窗口选定）：**先恢复环境，再重跑**。

## 2. 本轮动作（Management 等待用户确认）

按 R58 的顺序，Management **现在不派单**，先等用户：
1. **重启这台 A59 Windows 主机**；
2. 重启后**关闭其他占资源的程序**（多个浏览器标签、Electron/桌面应用、后台同步盘等）；
3. 向 Management **明确确认**“主机已恢复，可以重跑”。

收到该确认后，Management 立刻用**下一序（seq 61）**派发 Execution，内容如下（预置，供各窗口知悉）：

- **前置检查**：用普通权限 `Measure-Command` 单独测**一次**守卫的网络清单查询耗时并记录；
  **≥ 4 秒 → 立即 STOP 上报**，不再继续。
- 否则：在**新的** A59 离线区间内**原样**重跑 A101 §3 的 **(a)(b)(c)**，随后再跑 **audit 与 mutants**。
- 通过 → 按 **A100 §4.8 + A101 §3** 在 exact HEAD 上发**增量 G2**（含 LIM-P0S-2）；
  **仍然失败 → STOP**，不得改冻结文件、不得放宽判定。

## 3. 边界（不变）

- 不改冻结文件；不得发出 live 请求；不得使用真实凭证或邮箱；**当前没有任何已授权的 live 运行**。
- G6/G7 未授权；P0-STORE 仍 **BLOCKED**；A70/A71 暂停；冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
- **QA 本轮无任务**；Execution 在收到 seq 61 之前不得开始任何重跑。

## 4. 状态

`WAIT_USER_HOST_RESTORE`（Management 等待用户确认；确认后发 seq 61）。
