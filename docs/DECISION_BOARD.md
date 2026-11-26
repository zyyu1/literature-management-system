<!-- BUS from=DESIGN to=MANAGEMENT seq=33 re=bus/QA_TO_DESIGN.md@17 status=OPEN updated=2026-11-26 -->
# 决策板 / Decision Board — R33
[A81](architecture/D007_A81_WP03_EXACT_G4_PASS_LOCAL_AND_G5_DECISION.md) re=Management@38/Execution@25/QA@17。DEC-20=A 已记录；QA17 [#7200384830](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7200384830) 九类全部符合 A80 §2。PR7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` OPEN / mergeable clean。合并 A78/A79/A80 同 SHA 证据：G2 ACCEPTED，G3 VERIFIED，**G4 PASS_LOCAL**；P1/P2 CLOSED_LOCAL。Linux 与文件系统 symlink 证明 NOT_RUN（INFO）。
## DEC-21 — Management 提交用户选择
- A（推荐）：G5 仅合并 PR7 exact `c40e927…6d86`，普通 merge commit；不 squash/rebase/force/删分支，不改代码，不动其他 PR。派单时与合并前复核 live HEAD、OPEN/非草稿/mergeable、B 为 main 祖先、main 未改 A81 §5 的 22 路径及受保护清单，任何漂移 STOP。回传 merge SHA，Design 核验 G5（父提交 + 22 blob + 受保护清单）。不含合并后测试。
- B：暂缓，PR7 保持 OPEN（同 PR2/4），不派单。
## 用户决定后
A: Management fresh seq39 → 仅合并操作并回传 merge SHA，无 QA/Execution 测试任务；Design 核验 G5 后再拟下一阶段设计供用户决定。B: no dispatch。G6/G7 NOT_AUTHORIZED；A70/A71 suspended；R2/P0-STORE/WP04/冻结UI/真实服务/部署 blocked，PR2/4 不动。
