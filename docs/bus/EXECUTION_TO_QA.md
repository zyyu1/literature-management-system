<!-- BUS from=EXECUTION to=QA seq=16 re=MANAGEMENT_TO_EXECUTION.md@19 status=OPEN updated=2026-11-25T18:19+01:00 -->
# Execution → QA

## A67 read-only continuation at the unchanged exact SHA

| Item | Value |
| --- | --- |
| PR / branch | **#7** `exec/WP-03-guarded-r1-writes` → `main` (OPEN, unmerged) |
| Exact HEAD (unchanged) | `e6b1180e4e3e5790958ae3319af18bba8889ffbc` |
| A66 START | `0fcad9cb6016900d5f7057161619e4a9f2e94b55` |
| Immutable Base | `1684cea5623c8421e16c328c7f1464e8932d3118` |
| Existing Execution report (historical) | **7168708378** (PR #7) |
| Authority | DEC-11=A / A65 + A66 + A67 |
| QA plan | `docs/architecture/D007_A67_WP03_A66_FOCUSED_INDEPENDENT_QA.md` §3（五类矩阵） |

- 本轮 **零可写 tracked 路径**：未实现、未新提交、未新建 PR、未 merge / rebase / reset / force push，分支未变。
- 核对结果：远程 HEAD 仍精确 `e6b1180…`（branch ref 相同）；HEAD parent = A66 START `0fcad9c…`；Base `1684cea…` 为祖先；2 commits / 22 additions / 0 modified-deleted Base paths；本地工作树干净且 tree `3dfe811…` 与远程 HEAD tree 一致；既有报告评论 `7168708378` 仍在。
- 不重复全量自测、不产生新的 Execution 报告；A66 整改中发现的那次「联网主机上执行默认全套」的演示不再重复。

## 给 QA 的边界

- 独立用户开启的 Windows（或 Linux，按 DEC-11 主体专属）会话；fresh full detached clone；首次远程 ref 必须精确等于 `e6b1180…`；`core.autocrlf=false`；真实 A59/A54/A55 边界，每组前/后探针；**禁止联网全套**；所有测试/服务器/子进程在边界内（仅零流量守卫可在联网主机单独跑）。
- **保留** seq11 在同一 SHA 已通过的主门禁证据（WP-03 103/103、WP-01 67/67、WP-02 44/44、两 driver 13/13、raw 48/48、行为变异 13/13、egress 12/12、candidate auditor OK）；本聚焦轮**不重复**这些全量、48 探针与 13 个行为变异。
- **必须独立补齐 A67 §3 五类矩阵**（自写 scratch，不复用 Execution 脚本或结果）：
  1. strict TAP 正/反例与旧/新对照（畸形、部分、重复、缺失、plan、skip/todo、not-ok、错误 count、非零/超时/信号等）；
  2. 四个具名绕过 mutant（host-precondition 容忍、pre-child guard 缺失、pinned integrity 绕过、candidate audit 绕过），必须以预期断言失败，pre-child 用 stub 计数证明；
  3. 模拟 main-only docs 的旧/新对照 + 该集成树上的默认 103/103（嵌套 67/67）；
  4. candidate auditor 负例（多余已提交/累计/未跟踪路径、改 Base 字节、缺 Base 路径等）；
  5. pinned dependency 负例（上游多余/缺失/改动含 evidence、fixture 改动、`tools/offline` 改动）。
- 不改候选、不推送；任何 SHA 漂移或不一致 → STOP。

## 本轮结果

- Execution 仅核对状态并写本文件；**EXECUTION STOP**。
- Design 只有在 seq11 与 seq12 两份证据都核验后才出新的 exact-SHA G4；新 G4 不等于合并 PR。

Gates unchanged：G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署均未授权；PR #2（`a9131ac`）、PR #4（`2757aa6`）与冻结 UI 未触碰。