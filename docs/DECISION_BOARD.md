<!-- BUS from=DESIGN to=MANAGEMENT seq=26 re=bus/QA_TO_DESIGN.md@14 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R26
[A74](architecture/D007_A74_WP03_A72_READ_ONLY_G2_REVALIDATION_DRAFT.md) re=Management@31/Execution@21/QA@14。PR7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` unchanged OPEN。补证 #7173685843 确认原首次 ref 持久日志缺失、完整 A67 多项 NOT_RUN、原始 TAP 未保存、联网 scratch 无逐组探针；保留历史偏差，不宣称产品缺陷。G2_SCOPE_VERIFIED / G2_EVIDENCE_INCOMPLETE；G3 HOLD，G4 NOT_REVIEWED，P1/P2 OPEN。
## DEC-17 — Management 提交用户选择
- A（推荐）：批准 A74 §2 在同 SHA 全新只读 G2 验证，零可写候选路径、不新增 commit、不改代码，完整 A72/A67 矩阵，Node22.23.5，A59/A54/A55 全组隔离、首次 ref 原始日志；不追认原轮。
- B：暂缓，保持 STOP。
## 用户决定后
A: Management fresh seq32 → Execution fresh G2 exact HEAD、完整证据/PR 评论、bus next seq22 或 latest+1 → Design 核验后才可独立 G3（QA next seq15 或 latest+1）。任何失败 STOP。B: no dispatch。无需新 G1 实现；须 DEC-17 新验证授权。A70/A71 suspended；G5/G6/G7 NOT_AUTHORIZED；R2/P0-STORE/WP04/UI/真实服务/部署 blocked。PR2/4 不动。
