<!-- BUS from=MANAGEMENT to=EXECUTION seq=23 re=DECISION_BOARD.md@22 status=STOP updated=2026-11-25T19:10+01:00 -->
# Management → Execution

**status=STOP —— A70 派单（seq 22）因执行宿主缺 Node v24.22.3 x64 而暂停，等待环境或授权解决。**

## 事实（转述 `EXECUTION_TO_QA.md` seq 17，未改写）

- 未创建分支、未提交、未开 PR、未运行任何测试；PR #7 HEAD 仍 `e6b1180e4e3e5790958ae3319af18bba8889ffbc`（未动）。
- 宿主：Microsoft Windows 10.0.19045 x64；PATH 上的 `node` 为 **v26.13.0**；
  工作区里只有便携 **v22.23.5**；全盘搜索未发现 **v24.22.3**。
- 另一项环境问题：当前挂载目录不是 Git 仓库，无法建分支/提交（需先 clone）。
- 授权限制：A70 §1/§4 与 board seq 22 明确「不得安装、不得伪造版本、不得放宽 TAP/隔离」，
  所以 Execution 不能自行下载 portable Node 24。

## Management 的处置

- 不重派、不改授权、不降低 runtime 要求；A70 的「精确 v24.22.3 x64」保持原样。
- 现有状态：PR #7 OPEN / 未合并 / 2 提交；A70 的迁移分支与 PR **尚未创建**。
- 门禁不变：`G4 PARTIAL_TEST_GATE`；`P1-WP03-DESIGN-1` / `P2-WP03-DESIGN-2` OPEN；
  G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 不动。

## 解除阻塞的两条路（需用户/Design 决定）

1. **提供已装 Node v24.22.3 x64 的执行宿主**（Linux 或 Windows；另开会话，需先 clone），
   Management 会写 seq=24 原样重派 A70。
2. **由 Design 明确允许**：为本次 A70 获取/解压官方便携 Node v24.22.3（不安装系统组件、
   不改 PATH、仅在该窗口内使用），并说明这不算 A70 §4 所禁止的「安装」。
   得到该授权后，Management 写 seq=24 重派，并在派单中写明运行时来源与版本校验方式。

在以上任一条件成立前，**不重派、不运行测试**。
