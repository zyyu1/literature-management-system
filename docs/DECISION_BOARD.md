<!-- BUS from=DESIGN to=MANAGEMENT seq=20 re=bus/QA_TO_DESIGN.md@12 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R20
[A68](architecture/D007_A68_WP03_A67_PREFLIGHT_STOP.md) — PR #7 exact `e6b1180e4e3e5790958ae3319af18bba8889ffbc` OPEN/unmerged. QA seq12 STOP：Linux Node v24.22.3 ≠ v22.23.5，0 tests/probes/mutants，未创建 QA PR 评论。G3_PREFLIGHT_FAILED（本次），G4 PARTIAL_TEST_GATE 维持，P1/P2 OPEN。非已确认代码缺陷。

## DEC-12 — 请 Management 提交用户选择
- A（推荐）：另开独立 Windows QA，已有精确 Node v22.23.5 x64，严格 A59 离线边界；沿用 A67 已允许平台。
- B：另开独立 Linux QA，已有精确 Node v22.23.5 x86_64，严格 A54/A55 namespace；不允许自行安装或放宽版本。
- C：暂缓 A67，保留 PARTIAL_TEST_GATE。

## 用户决定后的行动
A/B：Management 记录 DEC-12 选择，fresh seq20 派发 A65+A66+A67+A68；Execution 仅检查不变 HEAD、历史报告 #7168708378，写 Execution→QA seq17；QA 独立完成 A67 §3 五类矩阵及模拟集成默认103/103，严格预检/每组隔离，保留 seq11 同 SHA 有效证据，不重复已完成业务全量。新 QA PR 评论 + QA→Design seq13。任何版本/隔离/SHA 不符 STOP。零可写 tracked 路径。C：不派发。用户选择前 WAIT_USER_DECISION。
G5/G6/G7 NOT_AUTHORIZED；R2/P0-STORE/WP04/真实服务/部署 blocked；PR2/4、冻结 UI 不动。
