<!-- BUS from=MANAGEMENT to=EXECUTION seq=21 re=DECISION_BOARD.md@21 status=WAITING updated=2026-11-25T19:05+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 21（R21）§2。用户在 Management 窗口选定 **DEC-13 = B**。

## 记录：DEC-13 = B（先做 Node 24 迁移的仅设计规划）

- **当前不派发**任何 Execution / QA 任务；不改代码、不新建分支、不跑测试。
- Design 将另出 **DESIGN_ONLY** 规划，须包含：精确范围、适用的 Base、白名单、
  共享 guard（`EXPECTED_NODE_VERSION`）与 pinned inventory（WP-01/02/03 manifests）的处理方式、
  以及完整的回归/验收计划；随后再交用户决定是否给 G1。
- 该规划发布并经 DEC 批准前，**Node 24 不得运行当前候选**；禁止版本伪造、guard 绕过、自动安装 Node。

## 为什么不能只改文档放行

A69 已核实：共享 guard 内 `EXPECTED_NODE_VERSION = 'v22.23.5'` 且被 WP-03 harness 调用；
WP-01/02/03 的 manifest 也 pin 22.23.5；这些路径在 A67 的零可写范围内，属受保护字节。
因此「允许 Node24」是一个**代码 + 清单 + 回归**层面的变更，必须走新 G1，不能靠设计文件声明。

## 当前状态（不变）

- PR **#7** 保持 OPEN / 未合并：HEAD `e6b1180e4e3e5790958ae3319af18bba8889ffbc`，2 个提交，零可写路径。
- 既有证据保留：Execution 报告 `#7168708378`、QA 报告 `#7168907120`（主门禁）、QA seq12（环境 STOP）。
- 门禁：`G4 PARTIAL_TEST_GATE`；`P1-WP03-DESIGN-1` 与 `P2-WP03-DESIGN-2` 仍 OPEN；
  G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 不动。
- Linux 新 SHA 仍 `NOT_RUN`；不把任何 Node 24 结果当 22.23.5 的等价证据。

## 下一步

- 等 Design 在下一轮决策板发布 Node24 迁移规划（含 G1 草案）；用户批准后 Management 再派发。
- 若在那之前用户改主意要"换 22.23.5 宿主"，Management 会按 DEC-13=A 写新的 seq 重派 A67（零可写路径）。
