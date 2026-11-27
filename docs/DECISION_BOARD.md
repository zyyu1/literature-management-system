<!-- BUS from=DESIGN to=MANAGEMENT seq=40 re=bus/EXECUTION_TO_QA.md@29 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R40（Design → Management）
[A87](architecture/D007_A87_WP04_R1_G2_ACCEPTED_G3_RELEASE.md)：WP-04-R1 **G2 ACCEPTED** at exact `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`（PR #8）。用户在 Design 窗口点选 **DEC-29 = A：释放独立 G3**。

## Management 本轮动作
派**独立 QA**（fresh seq，QA 总线下一序号为 19 或 latest+1）；**不派 Execution**。

## 给独立 QA 的任务
- 权威文本：[WP-04 QA_INSTRUCTION](handoffs/WP-04/QA_INSTRUCTION.md)（含 §5 逐项报告）与 [DESIGN](handoffs/WP-04/DESIGN.md)，从 main 读取（候选树里没有设计文档，属设计如此）。
- 对象：PR #8 exact HEAD **`f951f717f7c833fdd00ffbe602bbd6d08ed5a390`**；Base `bcc4eaad5183c923f782da0475eea1751be2de3b`。首次且唯一的 `ls-remote refs/pull/8/head` 必须 exit 0 且等于该 SHA，否则 STOP。
- 全部 7 组：语法；`node --test`（Q4-01..Q4-12）；QA 自写严格 TAP 解析的上游 67/44/103；候选审计正例 + 负例（多余路径、改 Base 路径、改受保护 blob、未跟踪文件、mode 变更、symlink 类型）；QA 自写 raw HTTP 探针；QA 自建字节保真 oracle 与期望导出；committed mutation driver + ≥6 个 QA 独立 mutant（必须含 NFC、CRLF→LF、逐字段部分写、UNKNOWN 报 saved、跨库共享笔记、导出改 revision）。
- 环境：独立 QA 会话与目录，fresh full clone，`core.autocrlf=false`；Node 精确 v22.23.5 x64；A59 Windows 离线或合格 A54/A55 Linux；每组前后 guard+probe，子进程在重连前结束；Linux 未跑记 NOT_RUN。
- 记录 INFO-1：无元数据论文导出时 H1 后的实际字节。
- 交付：PR #8 新评论（逐项表：每行 PASS 附输入/断言/退出码，或 FAIL/NOT_RUN/NOT_RECORDED）→ QA 总线下一序号，`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，只提交该文件，QA STOP。QA 不改候选、不合并、不裁定门禁。

## 边界
G4 由 Design；G5 另行决定（A86 合并式 G5）。P0-STORE blocked；G6/G7 NOT_AUTHORIZED；A70/A71 suspended；冻结 UI、PR #2/#4 不动。
