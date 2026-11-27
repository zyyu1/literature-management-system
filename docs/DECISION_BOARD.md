<!-- BUS from=DESIGN to=MANAGEMENT seq=43 re=bus/QA_TO_DESIGN.md@20 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R43（Design → Management）
**DEC-32**：存储路线只评估坚果云 WebDAV。**DEC-33 = A**（用户 2026-11-27 10:42 在 Design 窗口点选）：**P0-STORE 第 1 阶段 G1 APPROVED**——本地探针工具 + 模拟 WebDAV 服务器，**不联网、不开账号、不碰任何凭证或真实主机**。权威：[A90](architecture/D007_A90_P0_STORE_NUTSTORE_WEBDAV_ROUTE_DESIGN.md) §3/§9、[DESIGN](handoffs/P0-STORE/DESIGN.md)、[QA_INSTRUCTION](handoffs/P0-STORE/QA_INSTRUCTION.md)（均从 main 读取）。

## Management 本轮动作
派 **Execution**（fresh seq47 或 latest+1）；**本轮不派 QA**（G3 待 Design G2 审查后释放）。

## 给 Execution 的任务（照 DESIGN 原文）
- Base **`663556bc68dc0472f2f392f09ca4bee7c668d2f5`**，首次读取 exit 0 并落盘；fresh full clone，`core.autocrlf=false`；新分支 `exec/P0STORE-nutstore-probe-r1`，新 PR → main；不 rebase、不从移动的 main 合并。
- 白名单仅：`packages/p0store-nutstore-probe/**`、`docs/handoffs/P0-STORE/QA_HANDOFF.md`。其余全部冻结；只允许只读 import WP-01 的 egress 前置守卫。需要改冻结路径、加依赖、npm install、lockfile、CI → **STOP**。
- 实现 DESIGN §2–§3：计划加载器、唯一出网闸门（https、固定主机/端口/路径前缀、动词白名单、规范路径、不跟随重定向、严格 TLS、预算含 12 个预留清理名额、文件/大小/写入者上限、拒绝即零出网）、运行时读取凭证且永不记录、两个独立进程的竞争、迟到 ACK 处理、判定器（GO/PARTIAL/NO-GO）、脱敏 trace；live 模式存在但第 1 阶段保持惰性，代码与计划中不得出现任何真实主机。
- 模拟服务器 11 种性格：strong、weak-etag、lost-update、create-overwrite、stale-read、late-ack、unresolvable-ack、throttle、server-error、redirect、bad-cert。
- 测试 P1-01..P1-13（含严格上游 WP-01 67、WP-02 44、WP-03 103、WP-04 91 与受保护清单）；mutation driver ≥12 个具名 mutant 全部按预期断言击杀；审计脚本在 `scripts/`，不被 `node --test` 发现。
- Node 精确 v22.23.5 x64；所有运行时测试在 A59 离线或合格 A54/A55 Linux 内，前后 guard+probe，子进程在重连前结束。

## 交付
PR 评论：G2 报告**逐项表**（A86 DEC-27），含 exact head、diff 清单、命令/计数/退出码、受保护清单、mutant 表、NOT_RUN；写 `docs/handoffs/P0-STORE/QA_HANDOFF.md`；Execution 总线下一序号，`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，STOP。不合并、不派 QA。

## 边界
第 2–4 阶段（测试账户、真实运行、判定）**均未授权**；ACCESS-02/G6 未授权；G7 未授权；P0-STORE 仍 BLOCKED；A70/A71 suspended；冻结 UI、PR #2/#4 不动。
