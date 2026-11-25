<!-- BUS from=MANAGEMENT to=EXECUTION seq=25 re=DECISION_BOARD.md@22 status=OPEN updated=2026-11-25T19:40+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 22（R22），DEC-14=A。
**本单专为「真云 Linux」执行窗口重发**，替代 seq=24（同一任务，只换宿主说明）。
**本地 Windows 窗口不要再接单**：它没有 Node v24.22.3、也不是 Git 仓库，接单只会再次 STOP。

## 环境前提（不满足即 STOP）

- 宿主必须是**真正的云端 Linux**（不是 Windows 本机、不是 WSL 里的 Windows 路径）。
- `node --version` 必须逐字等于 **`v24.22.3`**；`uname -sm` 记录为 `Linux x86_64`。
- 工作区允许 `git clone`（先 clone；"不是 Git 仓库"本身不是 STOP 理由）。
- Linux 上用 **A54/A55**：从 `origin/main` 取 `tools/offline/*` 到 `/tmp/offline`，先跑探针必须
  `EGRESS_PROBE=PASS`，之后所有测试/服务器命令都在 `run-offline.sh` 内；git 在命名空间外。
- **不需要手动断网**（这是 Linux 相比 Windows 的优势）。
- 不得安装、下载或伪造 runtime；版本不符 → 写 STOP 并报实际版本。

## 任务：A70 Node24 迁移（G1）

- **授权:** `docs/architecture/D007_A70_WP03_NODE24_MIGRATION_DESIGN.md`（§1–§4）
- **原 Base B:** `1684cea5623c8421e16c328c7f1464e8932d3118`
- **迁移 START S:** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`（PR #7，OPEN，未合并）
- **新分支:** `exec/WP-03-node24-runtime-migration`，从**精确 S** 创建；向 main 开**新 PR**
- 恰好一个单父增量提交；不 rebase / merge / reset / force push；不改 PR #7 分支、不关闭 PR #7

### 13 个修改路径（0 新增 / 0 删除 / 0 改名）

1. `packages/wp-01-synthetic-auth-api/package.json` — `engines.node` 仅 `24.22.3`
2. `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs` — 仅 `EXPECTED_NODE_VERSION` 字面量 `v24.22.3`
3. `packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs` — Q10 标题与 `process.version` 期望
4. `packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs` — 仅 `evidence.node` 期望
5. `packages/wp-01-synthetic-auth-api/README.md` — runtime 说明 + 历史 Node22 标注
6. `packages/wp-02-project-paper-read/package.json` — `engines.node` 仅 `24.22.3`
7. `packages/wp-02-project-paper-read/test/transport.test.mjs` — provenance 标题与 `process.version` 期望
8. `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs` — 显式 A70 overlay（仅上述 5 个 WP-01 路径）
9. `packages/wp-02-project-paper-read/README.md`
10. `packages/wp-03-guarded-r1-writes/package.json` — `engines.node` 仅 `24.22.3`
11. `packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs` — 原 51 条清单 + 9 文件 A70 哈希 overlay
12. `packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs` — 增加 S/A70 delta 审计
13. `packages/wp-03-guarded-r1-writes/README.md`

**禁止:** 产品 src、原始 evidence、夹具、`tools/offline`、旧设计/QA 指令、CI、依赖、无关包；S 的其它字节全部保留。

### 完整性顺序（不可打乱）

WP-01 字节 → Q2-11 五条 SHA-256 overlay（优先级 A70 > A60 > 原值，19 条路径不变）→
WP-02 → Q3-11 九条 blob overlay（原 51 条其余 42 条不变）→ auditor（B/A66 历史保留、钉住 S、
验 B..S 两提交/22 新增/0 Base 修改、S..HEAD 恰好 13 M 单子提交、B..HEAD 22 A + 9 M、200 条 Base 路径齐全、
除 9 条 overlay 外逐字节对 Base、未改的 S 路径逐字节对 S、核对 mode/符号链接/干净树）。
禁止自哈希；PR 证据贴 old/new blob + SHA-256 + 精确 hunk。

### G2（Node v24.22.3 + 命名空间内）

syntax 全部 `.mjs`；WP-01 **67/67**；WP-02 **44/44**（嵌套 67/67）；WP-03 默认 **103/103**（含两上游）；
两个既有驱动各 **13/13**；A67 五类矩阵自测；模拟 integration 树默认 **103/103**；
零 fail/skip/todo、exit 0、strict TAP；每组前跑探针。不要跑 Node22 候选做对照。
任一失败/额外路径/需改产品行为 → STOP。

## 交付

推分支、开新 PR（不合并、不关闭 PR #7）；PR 评论：新 SHA、13 路径 diff、old/new 哈希、命令与计数、
隔离与探针、限制；写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq，然后 **EXECUTION STOP**。

## 边界

G5/G6/G7 **NOT_AUTHORIZED**；两个 PR 都不得合；R2、真实持久化、WP-04、UI、真实服务/部署未授权；
PR #2/#4 与冻结 UI 不动。**G3 必须等 Design 核验 13 路径与 literal overlay 后**由用户另开会话进行。
