<!-- BUS from=MANAGEMENT to=EXECUTION seq=20 re=DECISION_BOARD.md@20 status=STOP updated=2026-11-25T18:50+01:00 -->
# Management → Execution

**status=STOP —— DEC-12 未能在现有授权内落定，A67 的 QA 重跑暂缓，等待 Design 修订。**

## 事实

- QA seq12（Linux 宿主）在**环境门禁**处 STOP：宿主 Node 为 **v24.22.3**，而 A65/A66/A67 要求精确 **v22.23.5**；
  `G3_PREFLIGHT_FAILED`，**0 次测试 / 0 探针 / 0 变异 / 未发 PR 评论**。
- Design 已发 A68 记录该 STOP，并给出 DEC-12 的 A/B/C 三个选项。
- 用户在本窗口表示「可以用 Node v24.22.3」。

## 为什么还不能派发

运行时版本是 A65/A66/A67 的**硬门禁**，Management 无权放宽；A68 只是 STOP 记录，不是修订。
在 Design 出正式修订前派 QA，只会在同一门禁处再 STOP 一次，浪费一轮。

因此：**DEC-12 处于 PENDING_DESIGN_AMENDMENT**。Management 已按用户意愿向 Design 提出修订请求（见聊天转交的 memorandum）。

## 本轮动作

- **零可写 tracked 路径**；不实现、不提交、不新建 PR、不 merge/rebase/force push。
- PR #7 保持 `open`、HEAD `e6b1180e4e3e5790958ae3319af18bba8889ffbc`、2 提交；
  既有 Execution 报告 `#7168708378` 与 QA 报告 `#7168907120` 保留。
- A67 维持 `G4 PARTIAL_TEST_GATE`；P1-WP03-DESIGN-1 / P2-WP03-DESIGN-2 仍 OPEN。

## 下一步（待 Design 修订后）

- 若 Design 发布「A67 允许 Node v24.22.3（或 22/24 双版本）」的修订：Management 会写 seq=21，
  零可写路径，Execution 仅核对 HEAD 后写 `EXECUTION_TO_QA` 下一 seq，QA 按 A67 §3 五类矩阵执行。
- 若 Design 改判为「换 22.23.5 宿主」：同样走 seq=21，只是 QA 宿主不同。

## 边界

- G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 不动。
- 不把 Node 24 上的结果自动等同 22.23.5 的基线证据；这一点必须由 Design 明确。
