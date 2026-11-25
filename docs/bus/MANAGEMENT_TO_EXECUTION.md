<!-- BUS from=MANAGEMENT to=EXECUTION seq=22 re=DECISION_BOARD.md@22 status=OPEN updated=2026-11-25T19:20+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 22（R22）§2。用户在 Management 窗口选定 **DEC-14 = A**（批准 A70 §§1–4 的 bounded G1）。

## 授权与锚点

- **授权文件:** `docs/architecture/D007_A70_WP03_NODE24_MIGRATION_DESIGN.md`
- **运行时（唯一）:** Node **精确 v24.22.3** x64，无新依赖；仅 WP-01/02/03 本地合成测试栈，不是全仓 runtime 升级。
- **原不可变 Base B:** `1684cea5623c8421e16c328c7f1464e8932d3118`（200 blobs，保留为比较基准，不得重定义）
- **迁移 START S:** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`（PR #7，OPEN/未合并，2 提交，222 blobs）
- **新分支:** `exec/WP-03-node24-runtime-migration`，**从精确 S 创建**（不是最新 main）；向 main 开**新 PR**。
- 恰好**一个单父增量提交**；不 rebase / merge / reset / force push；**不改 PR #7 分支**、不提前关闭 PR #7。

## 恰好 13 个修改路径（0 新增 / 0 删除 / 0 改名）

1. `packages/wp-01-synthetic-auth-api/package.json` —— `engines.node` 仅精确 `24.22.3`
2. `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs` —— 仅 `EXPECTED_NODE_VERSION` 字面量为 `v24.22.3`；相等性、平台/架构、代理、Linux 命名空间与 Windows 策略全不变
3. `packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs` —— Q10 标题与 `process.version` 精确期望改为 `v24.22.3`，不删不跳
4. `packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs` —— 仅 `evidence.node` 期望改为 `v24.22.3`
5. `packages/wp-01-synthetic-auth-api/README.md` —— 当前 runtime/命令说明；把 Node22 结果标为历史
6. `packages/wp-02-project-paper-read/package.json` —— `engines.node` 仅 `24.22.3`
7. `packages/wp-02-project-paper-read/test/transport.test.mjs` —— 仅 provenance 标题与 `process.version` 期望
8. `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs` —— 显式 A70 overlay（仅上面 5 个 WP-01 路径）；保留原 `BASE_MANIFEST` 与 A60 overlay 值；嵌套调用/断言与 Q3 消费的精确嵌套测试标题不变
9. `packages/wp-02-project-paper-read/README.md` —— runtime/overlay 说明，区分历史证据
10. `packages/wp-03-guarded-r1-writes/package.json` —— `engines.node` 仅 `24.22.3`
11. `packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs` —— 在**原 51 条清单**上加显式 A70 的 9 文件受保护哈希 overlay；严格 TAP 解析、嵌套标题、guard、spawn、超时、计数与接受规则**一律不变**
12. `packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs` —— 增加 S/A70 delta 审计；保留 B 与 A66 历史、显式字面允许的已修改-Base 哈希、以及 S 的逐字节未变证明
13. `packages/wp-03-guarded-r1-writes/README.md` —— 说明 S/A70 迁移、runtime、审计、历史证据；未跑测试前不得声称通过

**禁止:** 产品 src、原始 evidence、夹具、offline tools、旧设计/QA 指令、CI、依赖、无关包；S 的其它字节全部保留。

## 完整性架构（A70 §3，fail-closed）

- **Q2-11**：保留 18 条历史 base 行与 A60/A62 overlay；新增五条 A70 SHA-256 overlay，优先级 A70 > A60 > 原值；路径集合不变（19 条）；仅授权字节可匹配新字面哈希；不做运行时推导。
- **Q3-11**：保留原 51 条 Base 清单；对 9 个 WP-01/02 被改路径用新 Git blob ID 做 overlay；其余 42 条逐一不变（含 evidence、两个夹具、offline tools）。
- **候选审计**：保留 B 与 A66 START；钉住 S；验 B..S 两提交、22 新增、0 个 Base 修改；验 S..HEAD 恰好 13 M 单子提交、B..HEAD 22 A + 9 M、200 条 Base 路径齐全；除 9 个显式 overlay 外逐字节比对 Base，并对每个未修改的 S 路径逐字节比对；核对 worktree/HEAD 原始字节、mode、干净状态、无多余/缺失/符号链接替换。scatch 覆盖开关不计入候选审计。
- **哈希来源顺序**：WP-01 → Q2 pins；WP-02 → Q3 pins；再 auditor。不得自哈希/循环依赖。PR 证据里给出 old/new blob 与 SHA-256、精确 hunk。

## G2（本轮交付，完整证据）

- 前置：新分支 lease/碰撞检查；syntax 全部 `.mjs`；零依赖/lockfile 变化；夹具/源码/证据保留；显式候选审计通过。
- 回归（Node v24.22.3，A54/A55 Linux 或 A59 Windows 边界，每组前探针）：WP-01 **67/67**、WP-02 **44/44**（嵌套 67/67）、WP-03 默认 **103/103**（含两上游），零 fail/skip/todo/cancelled、exit 0、strict TAP；两个既有变异驱动各 **13/13**；A67 五类矩阵的自测；模拟 integration 树默认 **103/103**；记录实际命令与退出码。
- 任一失败/需额外路径/需要改产品行为 → **STOP**，不得自行扩范围。
- **不要**跑 Node22 候选以对比；旧/新对照用合成 TAP/guard 输入。

## 交付与门禁

- 推分支、开新 PR、发 Execution 报告（新 SHA、13 路径 diff、old/new 哈希、命令与计数、隔离与探针、限制）；写 `EXECUTION_TO_QA.md` 下一 seq，然后 **EXECUTION STOP**。
- **G3 必须另开独立会话**，且须在 **Design 核验 13 路径与 literal overlay 之后**才开始；本轮不得提前 QA。
- 原 PR #7 保持 OPEN / 未合并、head `e6b1180e…` 不变；不得关闭。
- G5/G6/G7 **NOT_AUTHORIZED**；不合并（两个 PR 都不得合）；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 不动。
