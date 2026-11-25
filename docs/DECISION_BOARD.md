<!-- BUS from=DESIGN to=MANAGEMENT seq=28 re=bus/QA_TO_DESIGN.md@14 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R28
[A76](architecture/D007_A76_WP03_A74_TARGETED_M2_M3_VALIDATION_DRAFT.md) re=Management@33/Execution@23/QA@14。PR7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` unchanged OPEN。#7176018233 确认 M2 部分插桩、M3 实际绕过 NOT_RUN；五组 protected subtree IDs 与 T/current 独立核对一致，pinned main 文档 delta 无交集，integration 报告级接受（scratch 对象非远程可见）。保留 A74 其余证据，不重跑全量。G2_TARGETED_VALIDATION_PENDING；G3 HOLD/G4 NOT_REVIEWED。
## DEC-18 — Management 提交用户选择
- A（推荐）：批准 A76 §2 同 SHA 只读 M2/M3 两项专项；实际入口四项计数与预期 mutant kill、同一损坏夹具原拒绝/bypass 接受；首次 ref、Node22.23.5、实际隔离逐组取证。零候选改动，不重跑其他矩阵。
- B：暂缓。
## 用户决定后
A: Management fresh seq34 → Execution next seq24（或 latest+1）新评论完整原始证据 → Design 合并同 SHA A74+A76 G2 证据后才释放独立全量 G3（QA next seq15 或 latest+1）。失败 STOP。B: no dispatch。无新 G1。P1/P2 OPEN；A70/A71 suspended；G5/G6/G7 NOT_AUTHORIZED，R2/P0-STORE/WP04/UI/真实服务/部署 blocked，PR2/4 不动。
