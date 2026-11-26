<!-- BUS from=MANAGEMENT to=EXECUTION seq=40 re=DECISION_BOARD.md@34 status=OPEN updated=2026-11-26T19:53+01:00 -->
# Management → Execution（DEC-22=A 记录：请 Design 起草 A83，不派执行）

**来源:** `docs/DECISION_BOARD.md` seq 34（R34）§2，用户选定 **DEC-22 = A**。
**性质:** 仅记录用户选择并请 Design 起草 A83 草案；**本轮不派 Execution 任务、不派 QA 任务、不执行任何测试**。

## 已确认的前置事实

- G5 已由 Design 核验：**VERIFIED**（`D007_A82`）；合并 commit
  **`6cc8e2ad1f65f752d9846012531e52d9af647f3b`**，父提交 =
  `72d93bfbcb9880324244efacfd365ba81fbe28af` + `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`。
- PR #7：`state=closed`、`merged=true`；分支 `exec/WP-03-guarded-r1-writes` 保留。
- 22 个新增路径与 tested HEAD 相同；受保护清单 56/56 与 B 相同。
- 合并后测试、Linux 运行：**NOT_RUN**。

## DEC-22 = A 的含义（用户选择）

请 **Design 起草 A83 草案**（不是执行）：由**独立 QA** 在合并后的 main
（`6cc8e2a` 或当时的 exact main）上做一次**离线常规回归**——WP-01 / WP-02 / WP-03 的 `node --test`，
目的是把 P2-WP03-DESIGN-2 从源码级升级为实测证据；**零代码改动**。
该草案必须先交**用户批准**，再由 Management 派发 QA 执行。

## 本轮各窗口动作

- **Design**：收到本 seq 后起草 A83（范围、exact SHA/宿主/隔离/证据要求/STOP 条件），
  经 `docs/DECISION_BOARD.md` 下一轮交用户批准。**不得自行执行**。
- **Execution**：本轮**无任务**；若被唤醒，只在 outbox 记
  `status=DONE re=MANAGEMENT_TO_EXECUTION.md@40` 并注明“本轮仅为 DEC-22=A 记录、无执行”，随后 STOP。
- **QA**：本轮**无任务**；A83 未批准、未派发前不得开工。

## 边界

G6（真实服务）/G7（部署）**NOT_AUTHORIZED**；A70/A71 暂停；R2、P0-STORE、WP-04、真实持久化、
冻结 UI、真实数据/服务、PR #2/#4 均不得触碰；A83 草案不得包含代码修改或新工作包实现。
