<!-- BUS from=MANAGEMENT to=EXECUTION seq=45 re=DECISION_BOARD.md@40 status=OPEN updated=2026-11-27T09:47+01:00 -->
# Management → Execution（DEC-29=A：释放 WP-04-R1 独立 G3 给 QA）

**来源:** `docs/DECISION_BOARD.md` seq 40（R40）任务单；**DEC-29 = A 由用户在 Design 窗口选定**（记录，不是 Management 推断）。
**授权:** `D007_A87_WP04_R1_G2_ACCEPTED_G3_RELEASE.md` §4；QA 内容以
`docs/handoffs/WP-04/QA_INSTRUCTION.md`（含 §5 逐项报告）与 `docs/handoffs/WP-04/DESIGN.md` 为准，
**两份都从 `main` 读取**（候选树里没有设计文档，属设计如此）。
**性质:** G2 已被 Design 接受；本轮只派**独立 QA**，**不派 Execution、不改候选**。

## 对象

- PR **#8** `exec/WP-04-research-notes-r1` → `main`：OPEN / 非草稿 / mergeable clean / 2 提交。
- **exact HEAD `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`**；Base `bcc4eaad5183c923f782da0475eea1751be2de3b`。
- **首次且唯一** `git ls-remote <repo> refs/pull/8/head` 必须 `exit 0` 且等于该 SHA，否则 STOP；
  落盘命令/时间/stdout/stderr；**无重试豁免**。

## 独立 QA 的七组内容（全部要做，不得只做聚合）

1. **语法**；
2. **`node --test`（Q4-01..Q4-12）**；
3. **QA 自写严格 TAP 解析**的上游回归：WP-01 **67/67**、WP-02 **44/44**（嵌套 67）、WP-03 **103/103**；
4. **候选审计正例 + 负例**：多余路径、改 Base 路径、改受保护 blob、未跟踪文件、mode 变更、symlink 类型；
5. **QA 自写 raw HTTP 探针**（全部路由与拒绝路径）；
6. **QA 自建字节保真 oracle 与期望导出**（不沿用 Execution 的期望值）；
7. **committed mutation driver + ≥6 个 QA 独立 mutant**，必须含：NFC 归一化、CRLF→LF、逐字段部分写、
   UNKNOWN 报 saved、跨库共享笔记、导出改 revision。

## 环境

- 独立 QA 会话与**独立可写目录**（不得共用 Management/Execution 的 clone）。fresh full clone，
  `core.autocrlf=false`、detached 该 HEAD、工作树干净。
- Node **精确 v22.23.5 x64**；A59 Windows 用户控制离线区间，或已具备资格的 A54/A55 Linux；
  Linux 未跑记 `NOT_RUN`。
- 每组前后 guard + probe、脱敏 OS 事实与原始日志；所有子进程在重连前结束；
  不联网跑测试、不改宿主、不装依赖、不读真实数据/凭证。

## 特殊记录项

- **INFO-1**：导出「无标题/作者/年份/DOI 元数据」的论文时，H1 之后的**实际字节**要如实记录
  （DESIGN §5 未定义该情形，属观察项，不是缺陷）。

## 交付

- 在 PR #8 发**一条新评论**：**逐项表**——每个测试 ID / 组 / 审计负例 / mutant / 追溯项各一行，
  标 `PASS`（附**实际输入、断言原文、退出码**）或 `FAIL` / `NOT_RUN` / `NOT_RECORDED`；
  聚合 PASS 不完整（DEC-27 §1），只退回补表、不另开测试轮。
- 然后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **19**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@45`，含 PR / exact SHA / QA 评论 ID / verdict / 关键数字 / P0-P2；
  只提交该文件，`bus(qa): seq 19`，**QA STOP**。

## 边界

- **Execution 本轮无任务**：若被唤醒，只回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@45`
  并注明“本轮为独立 QA 的 WP-04-R1 G3、Execution 未参与”，随后 STOP；不得改候选或开新提交。
- QA 不改候选、不合并、不裁定任何门禁；**G4 只由 Design 裁定**；
  **G5 另行决定**（按 A86 DEC-27 为合并式一步 G5）。
- P0-STORE blocked；G6/G7 NOT_AUTHORIZED；A70/A71 暂停；冻结 UI、PR #2/#4 不动。
- 任何 SHA 漂移、环境缺口、权限错误 → 如实 STOP/FAIL，不得伪造 PASS 或把 PARTIAL 写成 PASS。
