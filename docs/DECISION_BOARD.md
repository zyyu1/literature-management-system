<!-- BUS from=DESIGN to=MANAGEMENT seq=13 re=bus/EXECUTION_TO_QA.md@10 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — 每轮整体覆盖

**轮次:** R13 (seq 13) · 2026-11-25 · observed parent `main@a0f414b859772176d2907190e57113a4c67f1e0f`
已记录 DEC-9=A。Management seq 12 STOP，Execution seq 10 WAITING；A60 scratch helper 被 Node 默认发现为额外测试（68/67）。用户确认继续，Design 发布 [A61 最小文件名修正](architecture/D007_A61_A60_HELPER_FILENAME_CORRECTION.md)。无新 DEC。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合并，A55 历史证据不变 |
| WP-02 | A57 PASS_LOCAL @ `222763dad068fc226e500b14250cbb7fffc0a2de`，PR #6 OPEN |
| A60+A61 | DEC-9=A 有效，等 fresh dispatch；无已验收候选 |
| A58 | STOP；P2 OPEN |
| WP-03+ / G5/G6/G7 | NOT_AUTHORIZED |

## 2. 待用户决策
无；沿用 DEC-9=A，用户已确认 A61 修正，不再询问同一批准。

## 3. Management action
写 Management→Execution **下一 seq 13**，引用本板 seq 13、原 DEC-9=A、[A60](architecture/D007_A60_CROSS_PLATFORM_TEST_INFRASTRUCTURE_G1_DRAFT.md)+[A61](architecture/D007_A61_A60_HELPER_FILENAME_CORRECTION.md)；同 PR #6、branch `exec/WP-02-project-paper-read`、exact START `222763dad068fc226e500b14250cbb7fffc0a2de`、Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`。明确替代旧 seq 12 STOP。
- 五路径白名单仅替换新 helper 文件名为 `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs`，旧 test-platform.mjs 不得存在；同步相关 imports 和显式 overlay，原 19 条 manifest 保留，其他路径与断言不变。
- Windows 优先、独立 Windows QA 必须，Node v22.23.5、A59 实测隔离；默认 node --test 发现范围不变，WP-01 67/67、WP-02 43/43、13/13 全绿；所有 A60 平台/完整性负例和具名 mutant 重跑（含旧 inconclusive overlay），无跳过/放宽。只提交一个增量 commit。
- A58 保持 STOP，不混入 identity 测试；待 A60+A61 新 G4 后另行恢复；不得合并。

## 4. 回传
Execution→QA 下一 seq，QA→Design 下一 seq，附 PR 原始评论、exact SHA、五路径 diff、真实证据。Design 裁定 G4，G5 独立 DEC。旧 scratch 不作为验收。

## 5. 边界
无产品源码、fixture、driver、历史证据、依赖、CI、UI、真实服务或部署变化。PR #2/#4 不动。
