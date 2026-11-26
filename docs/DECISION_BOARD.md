<!-- BUS from=DESIGN to=MANAGEMENT seq=38 re=bus/MANAGEMENT_TO_EXECUTION.md@42 status=OPEN updated=2026-11-26 -->
# 任务单 / Task order — R38（Design → Management）
**DEC-25 = A**：用户 2026-11-26 约 20:13 在 Design 窗口点选决定（现行流程：Design 决策 → Management 派发 → Execution/QA）。**WP-04-R1 G1 APPROVED**，权威文件：[A85](architecture/D007_A85_WP04_R1_G1_DRAFT.md)、[DESIGN](handoffs/WP-04/DESIGN.md)、[QA_INSTRUCTION](handoffs/WP-04/QA_INSTRUCTION.md)。不扩不缩。

## Management 本轮动作
派 **Execution**（fresh seq43 或 latest+1）；**本轮不派 QA**（G3 待 Design 完成 G2 范围审查后另行释放）。

## 给 Execution 的任务（照 DESIGN 原文执行）
- Base **`bcc4eaad5183c923f782da0475eea1751be2de3b`**；首次读取该 Base 须 exit 0 并落盘，fresh full clone，`core.autocrlf=false`。新分支 `exec/WP-04-research-notes-r1`，新 PR → `main`。不 rebase、不从移动的 main 合并。
- 白名单仅：`packages/wp-04-research-notes-r1/**`、`docs/handoffs/WP-04/QA_HANDOFF.md`。WP-01/02/03、两个 fixtures、`tools/**` 及其他所有路径冻结；只允许只读 import 其导出模块。需要改动冻结路径、加依赖、npm install、lockfile、CI、UI → **STOP**。
- 实现 DESIGN §2–§7：GET 笔记、PUT 整篇（创建 `If-None-Match: *` / 更新强 `If-Match`）、已保存版本 Markdown 导出；五个字段逐字节保真；四种结果与操作账本；仅 127.0.0.1。
- WP-03 教训从第一个提交起强制：无放宽开关；严格 TAP 语法；只钉住受保护清单（不遍历仓库）；`verify-candidate-scope.mjs` 不被 `node --test` 发现；任何 socket/子进程之前先跑隔离守卫。
- Node 精确 v22.23.5 x64；所有运行时测试在 A59 Windows 离线边界或合格 A54/A55 Linux 内，前后 guard+probe，子进程在重连前结束；不改宿主/网络、不安装、不提权、无真实数据。Linux 未跑记 NOT_RUN。
- 自测（G2）：语法；`node --test` 全部 Q4-01..Q4-12；上游严格回归 WP-01 67/67、WP-02 44/44（嵌套 67）、WP-03 103/103；`verify-candidate-scope.mjs` OK + 负例；mutation driver ≥12 个具名 mutant 全部按预期断言击杀。

## 交付
PR 评论：exact head、diff 路径清单、命令/计数/退出码、原始 TAP 摘要值、fixture 与受保护清单哈希、环境与 probe 映射、mutant 表、NOT_RUN 清单；写 `docs/handoffs/WP-04/QA_HANDOFF.md`；Execution 总线下一 seq，`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，STOP。Execution 不自行派 QA、不裁定门禁。

## 边界
不含本地草稿/恢复、UI、Typora 认证、Key Quotes、Zotero API、真实存储/身份、部署。G4 由 Design；G5 须用户另行决定。P0-STORE blocked；G6/G7 NOT_AUTHORIZED；A70/A71 suspended；冻结 UI、PR2/4 不动。
