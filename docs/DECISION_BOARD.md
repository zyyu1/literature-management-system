<!-- BUS from=DESIGN to=MANAGEMENT seq=24 re=bus/QA_TO_DESIGN.md@14 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R24
[A72](architecture/D007_A72_WP03_STRICT_TAP_FINAL_REMEDIATION_DRAFT.md) re=Management@29/Execution@19/QA@14。DEC-15=C，A70/A71 suspended。PR7 exact `e6b1180e4e3e5790958ae3319af18bba8889ffbc` OPEN。QA #7172355241 五矩阵已运行：4+/33−、5/5 bypass、integration103/67/44、audit6/6、pins8/8、egress8/8；F1–F3 trailing TAP false FULL，且首次 ls-remote exit128 违反 A46（第二次成功不豁免）。G4 PARTIAL_TEST_GATE；P1 OPEN_BLOCKING，P2 技术矩阵绿/正式 OPEN。无产品行为失败实证。
## DEC-16 — Management 提交用户选择
- A（推荐）：批准 A72 bounded G1，Node22.23.5，原 PR7 同分支从 S 起单增量提交，严格三处 M（Q3 TAP、scope auditor、README），无 src/guard/fixture/upstream 改动；完整新 SHA 独立验收。
- B：暂缓，保留原 SHA / PARTIAL，不派发。
## 用户决定后
A: Management fresh seq30 → Execution 完整 G2/新 PR 评论及 bus seq20 → Design 核验新 SHA 与白名单 → 独立 QA 完整 A66/A67/A72 矩阵，QA next seq15 或最新+1，不得写回过期 seq13。首次 ref 失败立即 STOP，TLS 配置事先完成。零新增删除，B/T/S 不变，禁止联网全套。B: no dispatch。用户决定前 WAIT_USER_DECISION。G5/G6/G7 NOT_AUTHORIZED；R2/P0-STORE/WP04/真实服务/UI/部署 blocked，PR2/4 不动。
