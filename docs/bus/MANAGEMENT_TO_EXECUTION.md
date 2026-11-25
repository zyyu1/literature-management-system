<!-- BUS from=MANAGEMENT to=EXECUTION seq=9 re=DECISION_BOARD.md@9 status=OPEN updated=2026-11-25T10:10+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 9（R9，2026-11-25）。用户在 Management 窗口选定。

## DEC-8 = A（批准 A58 单文件 test-only G1，立即开工）

- **决策:** DEC-8=A —— **A58 自本条记录起生效**（`D007_A58_WP02_P2_TEST_ONLY_G1_DRAFT.md` 从 G1 DRAFT 转为已授权）。
- **授权文件:** `docs/architecture/D007_A58_WP02_P2_TEST_ONLY_G1_DRAFT.md`
- **PR / 分支:** PR **#6**，沿用现有分支 `exec/WP-02-project-paper-read`（OPEN / 未合并）
- **原始不可变 Base:** `a0fb04f6d03ac81bbcb35800318c927e278e8b92`
- **精确增量 START:** `222763dad068fc226e500b14250cbb7fffc0a2de`
- **唯一可写路径:** `packages/wp-02-project-paper-read/test/identity.test.mjs`
- **允许的改动:** 只新增一个具名 node:test 回归 `Q2-02-CASE-01 itemKey is case-sensitive; absent case variant has neutral 403`（必要时最小本文件内 helper），**保留全部既有测试与断言**。
- **禁止:** 改 src、夹具、`scripts/mutation-check.mjs`（M01..M13 不变）、WP-01、历史证据/QA_HANDOFF、依赖/CI/tools/UI；不得 merge / rebase / reset / force push；不得接真实服务。
- **运行时:** 独立云端 Linux x86_64 + Node **v22.23.5**；egress 按 A54 §3/A55：探针先 PASS，所有测试与服务器命令经 `run-offline.sh`。

## 必做（按 A58 §3）

1. 预检：最新授权、PR 仍 OPEN、首次远程 ref 读回精确 START、干净 checkout、Base 为祖先、无 merge、夹具与 A55 wrapper blob 一致；任何不匹配 → STOP。
2. 实现该单条回归；语法检查；目标测试通过；WP-02 全套 **44/44**、WP-01 独立 **67/67**，均 exit 0；既有变异驱动 **13/13** 不变。
3. 仅在仓库外 scratch 副本复现 QM12（case-insensitive itemKey fallback，限同一 ownerScope/libraryType/libraryId），记录补丁与命令；新测试必须以 **ERR_ASSERTION（期望 403、实际 200）** 失败，而非解析/启动/超时；未变异时通过。建议同时展示 START 的旧套件在 QM12 下仍 43/43。
4. 还原 scratch、复查 tracked diff 与干净状态，然后推**一个** test-only 提交到同一 PR，贴精确 HEAD、START、diff、计数与退出码、wrapper/探针、具名断言与证据，写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（引用 A58 与新 HEAD），然后 **EXECUTION STOP**。

## 边界

- **不得合并**（G5 需另行 DEC）；G6/G7 未授权。
- PR #2（`a9131ac`）、PR #4（`2757aa6`）不动；冻结 UI 不动。
- 本轮只改那一个测试文件；若发现需要改源码或夹具 → STOP 回 Design。
