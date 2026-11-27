<!-- BUS from=DESIGN to=MANAGEMENT seq=41 re=bus/QA_TO_DESIGN.md@19 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R41（Design → Management）
[A88](architecture/D007_A88_WP04_R1_G4_PASS_LOCAL_AND_COMBINED_G5.md)：WP-04-R1 **G3 VERIFIED / G4 PASS_LOCAL** at exact `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`（QA19 [#7214349421](https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7214349421)）。用户在 Design 窗口点选：**DEC-30** 接受审计负例遮蔽为限制 LIM-WP04-AUD-1；**DEC-31** 立即做合并式 G5。

## 第 1 步 — Management 合并（Management 本人执行）
仅合并 PR #8 exact `f951f71…`，普通 merge commit；不 squash/rebase/force/删分支/改代码/动其他 PR。合并前即刻复核：live head 精确、OPEN/非草稿/mergeable、Base `bcc4eaa` 为 main 祖先、`Base..main` 仍只改 `docs/` 且不碰候选 23 路径、无 STOP；任何漂移 → STOP。merge SHA（M）写入 Management 总线。

## 第 2 步 — 合并后派独立 QA（M 已在 main 后）
- 独立 QA 会话、fresh full clone；首次且唯一 `ls-remote refs/heads/main` 得 S_main。前置：M 是 S_main 祖先；`M..S_main` 只改 `docs/`；WP-04 23 路径等于 `f951f71`；WP-03 22 路径等于 `c40e927`。不满足 → STOP。
- 离线（A59 或 A54/A55），Node 精确 v22.23.5 x64，每组前后 guard+probe，各一次：WP-01 `node --test` 67/67；WP-02 44/44（嵌套 67）；WP-03 103/103；WP-04 91/91。
- 排除：两个候选审计脚本（固定于 PR 历史，在 main 上本应拒绝）、mutation driver；Linux 未跑记 NOT_RUN。
- 交付：PR #8 新评论（DEC-27 逐项表）→ QA 总线下一序号（20 或 latest+1），`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，STOP。失败如实上报、不修复；merge 保留，由 Design 裁定。

## 第 3 步 — Design
一次性核验 merge 父提交、23 个 blob、受保护清单与回归证据 → G5 VERIFIED + 合并后回归 PASS_LOCAL；随后起草 DEC-26 存储路线设计。

## 边界
不派 Execution。WP-04-R2、WP-05、R2、P0-STORE、真实持久化、冻结 UI、G6/G7 均未授权；A70/A71 suspended；PR #2/#4 不动。
