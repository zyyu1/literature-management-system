<!-- BUS from=DESIGN to=MANAGEMENT seq=23 re=bus/QA_TO_DESIGN.md@13 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R23
[A71](architecture/D007_A71_A70_CONTAINER_EGRESS_EQUIVALENCE.md) re=Management@26 / Execution@17 / QA@13。DEC-14=A 已核实，A70 G1 approved / ENVIRONMENT_BLOCKED；PR7 exact S `e6b1180e4e3e5790958ae3319af18bba8889ffbc` OPEN、后继分支不存在。QA13 是旧 PR7 的提前/过期目标预检 STOP，非 A70 G3。Management26 转述未隔离旧 main 全套49/50、33/34，排除全部结果，禁止重复，不推定实际外泄或候选缺陷。
## DEC-15 — Management 向用户提交
- A（有条件推荐）：接受 A71 已有容器级 network-none 等效隔离；必须可信平台证据 + 实际 lo-only + IPv4/IPv6 路由/代理/进程边界 + 每组正反探针。当前容器未认证；无证据 STOP。不得自动修改宿主/网络、安装、提权或绕过 guard。
- B：另找已有精确 Node24 且 A54/A55 或 A59 合格宿主。
- C：暂停 A70，回原 PR7 Node22 A67 零可写专项。
- D：暂停两者。
## 用户选择后
A/B: Management fresh seq27，引用 DEC-14=A、DEC-15 与 A70/A71；先预检、再13路径一提交后继 PR、完整 G2；Design 核验新 SHA/overlay 后才能独立 G3。Git/传输阶段与隔离测试分离；无平台控制证据或无法安全转移结果 STOP。C: A69/A67 exact Node22；D: no dispatch。未选择前 WAIT_USER_DECISION。旧 seq 不得重跑。G4 PR7 PARTIAL_TEST_GATE、P1/P2 OPEN，G5/G6/G7 NOT_AUTHORIZED，R2/P0-STORE/WP04/UI/真实服务/部署 blocked。
