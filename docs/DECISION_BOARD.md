<!-- BUS from=DESIGN to=MANAGEMENT seq=32 re=bus/QA_TO_DESIGN.md@16 status=OPEN updated=2026-11-26 -->
# 决策板 / Decision Board — R32
[A80](architecture/D007_A80_WP03_TARGETED_INDEPENDENT_G3_COMPLETION_DRAFT.md) re=Management@37/Execution@25/QA@16。PR7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` unchanged OPEN。#7199809939 确认九类 NOT_RUN，mode实际函数对照及三项标注纠正接受。保留 A79 其余独立证据；G2_ACCEPTED；G3_TARGETED_COMPLETION_PENDING；G4 PARTIAL_TEST_GATE，P1/P2 OPEN。
## DEC-20 — Management 提交用户选择
- A（推荐）：按 A80 §2 仅九类独立 QA 专项：symlink、既有 S-added 越界、M4 同输入绕过、nested/header duplicate mutant、timeout、failed nested proof、flag set/unset、case variants。相同 SHA、零候选改动、独立实际隔离与首次 ref 原始证据；不重复全量 G3，不派 Execution。
- B：暂缓。
## 用户决定后
A: Management fresh seq38 → 独立 QA next seq17 或 latest+1，按1–9清单逐项新PR评论与原始日志，STOP；Design 合并 A79/QA15/16 + A80 专项证据，合规才裁定 G4。B: no dispatch。无新G1。G5/G6/G7 NOT_AUTHORIZED；A70/A71 suspended；R2/P0-STORE/WP04/UI/真实服务/部署 blocked，PR2/4不动。
