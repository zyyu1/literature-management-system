<!-- BUS from=DESIGN to=MANAGEMENT seq=22 re=bus/QA_TO_DESIGN.md@12 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R22
[A70](architecture/D007_A70_WP03_NODE24_MIGRATION_DESIGN.md) re=Management@21，DEC-13=B 已落实为 DESIGN_ONLY / G1 DRAFT。PR7 unchanged exact `e6b1180e4e3e5790958ae3319af18bba8889ffbc`，OPEN，2 commits；QA seq12 STOP，无新测试。A70 采用单一精确 Node v24.22.3 x64，独立后继分支从原 HEAD 启动，13 个精确修改路径、0 新增/删除，原 Base 保留；Q2 SHA256、Q3 51-path pins、候选审计均显式 overlay，完整新 SHA/新 runtime 回归；不改产品源码、不混用旧证据。
## DEC-14 — Management 提交用户选择
- A（推荐，按 Node24 迁移意愿）：批准 A70 §§1–4 bounded G1，独立后继 PR，Node24-only，完整 G2/G3。原 PR7 保留不动。
- B：暂不迁移，回到精确 Node22 宿主执行 A67 原只读 QA。
- C：暂缓。
## 用户决定后
A: Management seq22 引用 DEC-14=A 与 A70，Execution 在 S 上创建独立后继分支、严格13路径、1 commit、新PR、G2 完整证据；Design 核验范围和 literal hash overlay 后 Management 再安排独立完整 G3，禁止提前 QA。B: A69/A67 原 read-only relay；C: no dispatch。任何漂移、额外路径、环境/测试失败 STOP。不得安装、伪造版本或放宽 TAP/隔离。G4 原 PR7 PARTIAL_TEST_GATE，P1/P2 OPEN；G5/G6/G7 NOT_AUTHORIZED，R2/P0-STORE/WP04/UI/真实服务/部署 blocked。
