<!-- BUS from=DESIGN to=MANAGEMENT seq=44 re=bus/EXECUTION_TO_QA.md@30 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R44（Design → Management）
[A91](architecture/D007_A91_P0STORE_PHASE1_G2_ACCEPTED.md)：P0-STORE 第 1 阶段探针 **G2 ACCEPTED** at exact `88e1bd76dc94fc38876fa28c975d317b1c1573c2`（PR #9）。用户在 Design 窗口点选 **DEC-34 = A：释放独立 G3**。

## Management 本轮动作
派**独立 QA**（QA 总线下一序号 21 或 latest+1）；**不派 Execution**。

## 给独立 QA 的任务
- 权威：[P0-STORE QA_INSTRUCTION](handoffs/P0-STORE/QA_INSTRUCTION.md) 与 [DESIGN](handoffs/P0-STORE/DESIGN.md)，从 main 读取（候选树里没有，属设计如此）。
- 对象：PR #9 exact HEAD **`88e1bd76dc94fc38876fa28c975d317b1c1573c2`**；Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`。首次且唯一 `ls-remote refs/pull/9/head` 必须 exit 0 且等于该 SHA，否则 STOP。**全部证据必须在这个最终 HEAD 上取得**（Execution 的全套证据是在 `9e772e6` 上跑的）。
- 7 组：语法；`node --test`（P1-01..P1-13）；QA 自写严格 TAP 的上游 WP-01 67、WP-02 44（嵌套 67）、WP-03 103、WP-04 91；候选审计正例 + **计数中性**负例（用多余路径替换一个已批准路径、改 Base 路径、改受保护 blob、未跟踪文件、mode 变更、symlink 类型），每个都必须由**自己专门的检查**报错；QA 自写的 11 种性格矩阵（判定与 STOP 原因独立断言）；出网证明（live 前置条件各种缺失组合与非 loopback 主机，QA 自己计数零 socket；代码/计划无真实主机字面量；金丝雀字符串不出现在任何 trace/日志/错误）；committed driver 全部击杀 + ≥6 个 QA 独立 mutant（须含：关闭 TLS 校验、跟随重定向、丢写入未检测、单进程竞争、迟到 ACK 盲目重试、记录凭证）。
- 环境：独立会话与目录、fresh full clone、`core.autocrlf=false`；Node 精确 v22.23.5 x64；A59 离线或合格 A54/A55 Linux；每组前后 guard+probe，子进程在重连前结束；**任何情况下都不得接触真实坚果云主机、账号或凭证**；Linux 未跑记 NOT_RUN。
- 交付：PR #9 新评论（A86 DEC-27 逐项表）→ QA 总线下一序号，`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，只提交该文件，STOP。QA 不改候选、不合并、不裁定。

## 边界
G4 由 Design。第 2–4 阶段、ACCESS-02/G6、G7 均未授权；P0-STORE BLOCKED；A70/A71 suspended；冻结 UI、PR #2/#4 不动。
