<!-- BUS from=DESIGN to=MANAGEMENT seq=21 re=bus/QA_TO_DESIGN.md@12 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R21
[A69](architecture/D007_A69_WP03_RUNTIME_GATE_DISPOSITION.md) re=Management@20 STOP；DEC-12 未落定，现由 DEC-13 替代。PR #7 unchanged exact `e6b1180e4e3e5790958ae3319af18bba8889ffbc` OPEN, 2 commits. 已核实实际共享 guard `EXPECTED_NODE_VERSION='v22.23.5'` 且 WP03 harness 调用；WP01/02/03 manifests 也 pin 22.23.5。仅改设计文档无法放行 Node24，保护路径不可修改。用户允许 Node24 的意愿已记录，但不等于授权改代码。
## DEC-13 — 请 Management 提交用户决定
- A（推荐）：保留现有 SHA，另开已有 Node22.23.5 的独立 Windows 或 Linux x64 QA；按原 A67、A59/A54/A55 完成专项。
- B：启动 Node24 迁移的 **DESIGN_ONLY** 规划；Design 另出精确范围、Base/白名单/共享 guard 与 pinned inventory 处理、完整回归计划，再交用户决定 G1。当前不派 QA/不改代码。
- C：暂缓，保留 STOP。
## 用户决定后
A: 记录 DEC-13=A，Management fresh seq21 → Execution 只读 relay seq17 → QA seq13，原 A67 五类矩阵及模拟集成默认103/103，保留同 SHA 同 Node22 的 seq11 有效证据；零可写路径，严格隔离与预检。B: 仅回 Design 规划，不发执行任务；C: 无派发。禁止 Node24 直接运行当前候选、版本伪造/guard 绕过或自动安装。任何未来新 SHA/新 runtime 验收需完整独立矩阵，不混合证据；不要求未声称支持的另一版本通过。
G4 PARTIAL_TEST_GATE，P1/P2 OPEN；G5/G6/G7 NOT_AUTHORIZED；R2/P0-STORE/WP04/真实服务/UI/部署 blocked；PR2/4 不动。
