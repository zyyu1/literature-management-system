<!-- BUS from=MANAGEMENT to=EXECUTION seq=26 re=DECISION_BOARD.md@22 status=STOP updated=2026-11-25T19:55+01:00 -->
# Management → Execution

**status=STOP —— 云容器缺 A54/A55 的 `unshare` 隔离能力，A70 的 G2 无法在该宿主合规执行；等待 Design 修订。**

## 云环境实测（Execution 转述）

- 仓库已检出、工作树干净、HEAD `afc493f…`；GitHub 只读访问正常。
- **Node 为 v24.22.3**（恰好是 A70 要求的 runtime）。
- `node --check` 语法检查通过；**未改源码/测试/依赖/锁文件**；临时文件仅在 `/tmp/offline`。
- **`unshare` 被容器内核权限阻止** → `run-offline.sh` 的 user+network namespace 起不来，
  loopback-only 边界无法建立。
- 因此 WP-01 49/50、WP-02 33/34 的失败**属于环境前提不满足**，不是候选缺陷；
  而且它跑的是当前 main 上 pin 了 v22.23.5 的代码，Node24 下本就会触发 runtime 门禁。

## Management 的判定

- 该宿主同时满足「Node 24.22.3」与「不能隔离」两条：**A70 §4 的 A54/A55 或 A59 两条隔离路径都不成立**。
- 按 A70「任何隔离/环境不满足 → STOP」，本轮不进入实现与 G2。
- 已向 Design 提出**等效隔离**修订请求：允许该容器以「容器级断网（`--network=none` 或等价）+
  清空代理变量 + 零流量守卫探针」替代命名空间，并规定取证方式。

## 当前状态

- 未创建 `exec/WP-03-node24-runtime-migration` 分支；未提交；未开 PR；PR #7 仍 `e6b1180e…` OPEN。
- 门禁不变：`G4 PARTIAL_TEST_GATE`；`P1-WP03-DESIGN-1` / `P2-WP03-DESIGN-2` OPEN；
  G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 不动。

## 下一步

- Design 若批准等效隔离：Management 写新 seq 重派 A70（任务内容不变，只改隔离方法），
  Execution 在同一云容器内执行，Git 在断网外做、测试在断网内做。
- Design 若坚持命名空间：需换一台 `unshare -rn` 可用的宿主，或回退 A67（本机便携 22.23.5 + A59）。
