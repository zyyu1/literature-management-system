<!-- BUS from=MANAGEMENT to=EXECUTION seq=46 re=DECISION_BOARD.md@41 status=OPEN updated=2026-11-27T10:30+01:00 -->
# Management → Execution（DEC-31 合并式 G5：第 1 步已合并；第 2 步派独立 QA 做合并后回归）

**来源:** `docs/DECISION_BOARD.md` seq 41（R41）任务单；**DEC-30 / DEC-31 由用户在 Design 窗口选定**：
DEC-30 接受审计负例遮蔽为限制 **LIM-WP04-AUD-1**；DEC-31 立即执行**合并式 G5**。
**授权:** `D007_A88_WP04_R1_G4_PASS_LOCAL_AND_COMBINED_G5.md`；合并前检查同 A81 §5。
**性质:** 第 1 步由 Management 完成合并；第 2 步派独立 QA；**不派 Execution、不改候选**。

## 第 1 步 — 合并（已完成，记录如下）

| 项 | 值 |
| --- | --- |
| 合并前 main tip | `c42174db073ef652e55e96a7ebc7c5a96fba0751` |
| PR **#8** 远端 head | `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`（= tested HEAD） |
| PR 状态 | OPEN / 非草稿 / mergeable（`refs/pull/8/merge` = `ec1da91…` 存在） |
| Base 祖先 | `bcc4eaad5183c923f782da0475eea1751be2de3b` 是 main 祖先 |
| main 自 Base 的改动 | 仅 `docs/`，且**未触碰** `docs/handoffs/WP-04/QA_HANDOFF.md` 与 `packages/` |
| 合并方式 | `git merge --no-ff`，普通 merge commit；无 squash/rebase/force；分支保留 |
| **merge SHA (M)** | **`d7dd4237f04559e1097f8dcfc8155164cd73f1c2`** |
| 父提交 | `c42174db073ef652e55e96a7ebc7c5a96fba0751` + `f951f717f7c833fdd00ffbe602bbd6d08ed5a390` |
| 内容 | 23 files changed, **+5091 / −0** |
| 推送 | `c42174d..d7dd423  main -> main`（非 force） |

合并后自检：`f951f71..M` 在 23 条候选路径上**零差异**；`c42174d..M` 在
WP-01/WP-02/WP-03 包、两个 fixtures、`tools/offline` 上**零差异**。

## 第 2 步 — 独立 QA：合并后离线回归（S_main）

- QA 用**首次且唯一** `git ls-remote <repo> refs/heads/main` 得 **S_main**（exit 0，落盘命令/时间/stdout/stderr，
  失败即 STOP，无重试）。
- S_main 前置（任一不满足即 STOP）：① **M = `d7dd423…`** 是 S_main 祖先；② `M..S_main` 只改 `docs/`；
  ③ WP-04 的 **23** 条路径与 `f951f71…` 相同；④ WP-03 的 **22** 条路径与 `c40e927…` 相同。
- fresh full clone，`core.autocrlf=false`，工作树干净；独立 QA 目录，不与 Management/Execution 共用 clone。
- 离线（A59 Windows 或已具备资格的 A54/A55 Linux），Node **精确 v22.23.5 x64**；
  每组前后 guard+probe，**各跑一次**：

| 组 | 命令 | 期望 |
| --- | --- | --- |
| G1 | `cd packages/wp-01-synthetic-auth-api && node --test` | 67/67 |
| G2 | `cd packages/wp-02-project-paper-read && node --test` | 44/44（嵌套 67） |
| G3 | `cd packages/wp-03-guarded-r1-writes && node --test` | 103/103 |
| G4 | `cd packages/wp-04-research-notes-r1 && node --test` | 91/91 |

- **排除**：两个候选审计脚本（固定于 PR 历史，在 main 上本就应当拒绝）、mutation driver；Linux 未跑记 `NOT_RUN`。
- 交付：PR #8 新评论，按 **DEC-27 §1 逐项表**（每行 PASS 附输入/断言/退出码，或 FAIL/NOT_RUN/NOT_RECORDED）
  → 整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **20**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@46`，只提交该文件，`bus(qa): seq 20`，**QA STOP**。
- 失败**如实上报、不修复**；merge 保留在历史中，由 Design 裁定 STOP/回滚选项，**不自动回滚**。

## 第 3 步 — Design

Design 一次性核验 merge 父提交、23 个 blob、受保护清单与回归证据 → G5 VERIFIED + 合并后回归 PASS_LOCAL；
随后起草 DEC-26 的存储路线设计。

## 边界

- **Execution 本轮无任务**：若被唤醒，只回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@46` 并注明
  “本轮为合并式 G5 的合并与 QA 回归、Execution 未参与”，随后 STOP。
- 不派 Execution；WP-04-R2、WP-05、R2、P0-STORE、真实持久化、冻结 UI、G6/G7 均未授权；
  A70/A71 暂停；PR #2/#4 不动；不改候选、不合并其他 PR。
