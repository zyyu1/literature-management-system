<!-- BUS from=MANAGEMENT to=EXECUTION seq=24 re=DECISION_BOARD.md@22 status=OPEN updated=2026-11-25T19:25+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 22（R22），DEC-14=A 仍有效。
**本单重发 A70**（替代 seq=22 的原始派发与 seq=23 的宿主 STOP）；执行宿主改为**云 Linux**。

## 环境前提（不满足即 STOP）

- **必须**是已安装 **Node 精确 v24.22.3 x64** 的宿主（云 Linux 优先）；`node --version` 必须逐字匹配。
- 工作区需能 `git clone` 本仓库（不是 Git 仓库就先 clone，这不是 STOP 理由，除非无法访问）。
- Linux 上用 A54/A55 `tools/offline/run-offline.sh` 做隔离（git 在命名空间外）；**不需要手动断网**。
- 不得安装/下载/伪造 runtime；版本不符 → 写 STOP 并说明实际版本。

## 任务：A70 Node24 迁移（G1）

- **授权文件:** `docs/architecture/D007_A70_WP03_NODE24_MIGRATION_DESIGN.md`（§1–§4）
- **原不可变 Base B:** `1684cea5623c8421e16c328c7f1464e8932d3118`
- **迁移 START S:** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`（PR #7，OPEN，未合并）
- **新分支:** `exec/WP-03-node24-runtime-migration`，**从精确 S 创建**；向 main 开**新 PR**
- 恰好一个单父增量提交；不 rebase / merge / reset / force push；**不改 PR #7 分支、不关闭 PR #7**

### 恰好 13 个修改路径（0 新增 / 0 删除 / 0 改名）

1. `wp-01/package.json` — `engines.node` 仅 `24.22.3`
2. `wp-01/support/platform-precondition.mjs` — 仅 `EXPECTED_NODE_VERSION` 字面量 `v24.22.3`
3. `wp-01/test/auth-contract.test.mjs` — Q10 标题与 `process.version` 期望
4. `wp-01/test/transport-negative.test.mjs` — 仅 `evidence.node` 期望
5. `wp-01/README.md` — runtime 说明 + 历史 Node22 标注
6. `wp-02/package.json` — `engines.node` 仅 `24.22.3`
7. `wp-02/test/transport.test.mjs` — provenance 标题与 `process.version` 期望
8. `wp-02/test/wp01-regression.test.mjs` — 显式 A70 overlay（仅上述 5 个 WP-01 路径）
9. `wp-02/README.md`
10. `wp-03/package.json` — `engines.node` 仅 `24.22.3`
11. `wp-03/test/upstream-regression.test.mjs` — 原 51 条清单 + 显式 9 文件 A70 哈希 overlay
12. `wp-03/scripts/verify-candidate-scope.mjs` — 增加 S/A70 delta 审计
13. `wp-03/README.md`

（`wp-01/02/03` 前缀均为 `packages/wp-0X-…` 的简写，完整路径见 A70 §2。）
**禁止:** 产品 src、原始 evidence、夹具、`tools/offline`、旧设计/QA 指令、CI、依赖、无关包；S 的其它字节全部保留。

### 完整性顺序（不可打乱）

1. 先定 WP-01 五处预期字节 → 生成 **Q2-11** 五条 A70 SHA-256 overlay（优先级 A70 > A60 > 原值；19 条路径集合不变）
2. 再定 WP-02 → **Q3-11** 对 9 个 WP-01/02 文件换新 Git blob ID（原 51 条其余 42 条不变，含 evidence、两个夹具、offline tools）
3. 最后改 **auditor**：保留 B 与 A66 START，钉住 S；验 B..S 两提交/22 新增/0 Base 修改；
   验 S..HEAD 恰好 13 M 单子提交、B..HEAD 22 A + 9 M、200 条 Base 路径齐全；
   除 9 个显式 overlay 外逐字节对 Base，未修改的 S 路径逐字节对 S；核对 mode、无符号链接替换、干净树
4. 不做自哈希/循环依赖；PR 证据贴 old/new blob 与 SHA-256、精确 hunk

### G2（全部在 Node v24.22.3 + 隔离边界内）

- syntax 全部 `.mjs`；WP-01 **67/67**；WP-02 **44/44**（嵌套 67/67）；WP-03 默认 **103/103**（含两上游）；
  两个既有驱动各 **13/13**；A67 五类矩阵自测；模拟 integration 树默认 **103/103**；
  零 fail/skip/todo/cancelled、exit 0、strict TAP；每组命令前跑 egress 探针。
- **不要**跑 Node22 候选做对照；旧/新对照用合成 TAP/guard 输入。
- 任一失败 / 需要额外路径 / 需要改产品行为 → STOP，不扩范围。

## 交付

- 推新分支、开新 PR（不合并、不关闭 PR #7、不动其分支）。
- PR 评论：新 SHA、13 路径 diff、old/new 哈希、命令与计数、隔离与探针、限制。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq，然后 **EXECUTION STOP**。

## 边界

- G5/G6/G7 **NOT_AUTHORIZED**；两个 PR 都不得合；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 不动。
- **G3 必须等 Design 核验 13 路径与 literal overlay 后**，由用户另开会话进行；本轮不得提前 QA。
- 门禁不变：PR #7 仍 `G4 PARTIAL_TEST_GATE`，`P1-WP03-DESIGN-1` / `P2-WP03-DESIGN-2` OPEN。
