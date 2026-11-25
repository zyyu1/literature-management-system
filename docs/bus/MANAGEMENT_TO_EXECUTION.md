<!-- BUS from=MANAGEMENT to=EXECUTION seq=18 re=DECISION_BOARD.md@18 status=OPEN updated=2026-11-25T17:30+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 18（R18）§3。DEC-11=A 仍有效；**A66 是原安全契约内的门禁修正，无新 DEC、不扩产品范围**。
**本单替代 `seq=17` 的验收结论**：A65 判 `G4 PARTIAL_TEST_GATE`（P1 与 P2 各一项，均 blocking G5）。

## 授权与基线

- **授权文件:** `D007_A65_WP02_G5_VERIFIED_AND_WP03_R1_G1_DRAFT.md` + **`D007_A66_WP03_R1_G4_PARTIAL_TEST_GATE_REMEDIATION.md`**
- **PR / 分支:** PR **#7**，`exec/WP-03-guarded-r1-writes`（OPEN / 未合并，分支不变）
- **原不可变 Base:** `1684cea5623c8421e16c328c7f1464e8932d3118`（须为祖先）
- **新精确 START:** `0fcad9cb6016900d5f7057161619e4a9f2e94b55`
- 只推**一个**增量提交；不 merge / rebase / reset / force push。

## 六个可写路径（其余在 START 冻结）

1. `packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs`
2. `packages/wp-03-guarded-r1-writes/support/harness.mjs`
3. `packages/wp-03-guarded-r1-writes/scripts/mutation-check.mjs`（**仅 preflight**；13 个原 mutant 定义/断言/判定规则不变）
4. `packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs`（**新增**，显式审计，置于默认测试发现之外）
5. `packages/wp-03-guarded-r1-writes/README.md`（订正命令与边界）
6. `docs/handoffs/WP-03/QA_HANDOFF.md`（带日期的更正；保留历史证据与偏差记录；只可对机器本地绝对路径做带标记的脱敏）

**冻结:** src、行为测试、package.json、WP-01/02、夹具、A62 helper、上游 driver、tools、UI/CI/依赖。不新增测试文件，原 103 个测试保留，Q3-11 仅订正标题/范围。

## 3a 无条件测试门禁（修 P1）

- 只读复用冻结的 `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs`。
- **任何测试服务器/socket 之前**先过共享守卫（含 targeted 与 scratch 变异；核实入口覆盖），Q3-11 在 **spawn 上游子进程之前**，driver 在变异工作/子进程之前。
- **取消** `HOST_PRECONDITION_ONLY` 的放行与环境变量 opt-in；默认/定向命令在联网/不支持/含糊主机上必须**在 socket/子进程之前失败**。
- 证明零流量守卫拒绝（或合成清单/桩 I/O），**不得**为演示拒绝而跑联网全套。
- 严格上游 TAP：精确期望测试数/通过数，fail/skipped/todo=0，exit 0，无 signal/error/timeout，拒绝缺失或畸形 summary；嵌套 WP-01 保留。原环境变量设/不设都不得影响失败。

## 3b 候选范围与长期回归分离（修 P2）

- 新增 `verify-candidate-scope.mjs`：只读本地 Git 审计，G2/G3/G5 必跑——原 Base 的 raw tracked blob/tree 全量证明、精确累计新增、无修改/删除 Base 文件、无意外新增/未跟踪路径、无 merge、最终检出干净；六路径与 START 父提交独立核验。
- 默认 Q3-11 改为**钉住**原 Base 的两个上游整包（含 evidence）、两个夹具、`tools/offline` 树的实际 Git blob 与精确清单；拒绝多余/缺失/被改的受保护字节，目录内不许通配/排除；**只对无关的已批准 main 文档/新包路径容忍**（普通回归内），未来上游 rebaseline 另立授权。
- 配对 scratch 证明：旧默认完整性会拒绝「加到 START 的已授权 main 文档」，新默认接受；显式候选审计则拒绝执行分支上的多余路径；用可抛弃的模拟集成树保留真实 main-only 文档，边界内跑默认全套。负例：上游多余/缺失/被改、夹具/tools 被改、候选多余/被改/缺失/未跟踪。

## 验收（A66 §4）

- 默认 **103/103**（原环境旗标不设）、WP-01 **67/67**、WP-02 **44/44**（嵌套 67/67）、两个 driver 各 **13/13**、syntax 全过，零 skip/todo；保留独立 raw HTTP/CAS/replay/UNKNOWN/R2 的 48 项检查与 13 个具名行为变异；跑显式范围审计。
- scratch 新增守卫负例与**四个具名绕过变异**（无条件上游失败拒绝、子进程前守卫缺失、钉住依赖完整性绕过、候选审计绕过）全部按预期断言失败；旧/新同一合成的失败 TAP/守卫输入对照；畸形/部分 TAP、skip/todo、error/非零/超时即便总数好看也要拒绝；**不得**以崩溃/超时代替断言失败。
- 报告实际计数、命令与退出码、精确 patch、脱敏证据；scratch 不推送；不新增 tracked 测试。

## 环境与交付

- Node **精确 v22.23.5 x64**；Windows 优先（A59），Linux 走 A54/A55；每组命令前探针，所有后代在边界内；**不得**跑联网全套。
- PR #7 评论贴：精确 HEAD、START、六路径 diff、环境与探针、计数与退出码、旧/新对照、具名变异、限制与历史偏差更正。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq，然后 **EXECUTION STOP**。

## 边界

- **独立 QA 必需**（Windows 或 Linux，用户另开）；QA 后才能由 Design 出新的 exact-SHA G4，且只有它能关闭 P1/P2。
- **不得合并**（G5 独立批准）；G6/G7 未授权；R2 success、真实持久化、WP-04、UI、真实服务/部署均未授权；PR #2/#4 不动。
