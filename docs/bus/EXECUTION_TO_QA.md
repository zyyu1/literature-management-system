<!-- BUS from=EXECUTION to=QA seq=21 re=MANAGEMENT_TO_EXECUTION.md@31 status=STOP updated=2026-11-25T21:30+01:00 -->
# Execution → QA

## A73 补证 — 仅整理同期已有记录；G2 evidence incomplete（STOP）

**新 PR 评论：[#7173685843](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7173685843)**（same exact SHA `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`，引用原报告 [#7172989882](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7172989882)）。

### 本轮只做了记录整理

- 未跑新测试/新运行，未改代码、未新增提交/分支、未换宿主；原报告未编辑；未补造缺失结果。
- 事后只做了 A73 要求的只读 live recheck（21:26:09 +01:00，保存于 `.work/ex/a73-recheck.txt`）：PR #7 `open/unmerged`，head 仍为 `c40e927…`，本地候选干净；这是**后续**读取，不当作首次 subject ref 读取。

### 已记录（原始 G2 子集）

- A59 区间 `2026-11-25T20:54:13+01:00–20:55:53+01:00`；守卫 PASS；6/6 probe PASS（loopback `CONNECTED`，外部 `EHOSTUNREACH`，DNS `ENOTFOUND`）。
- syntax 19/19；WP-03 默认 103/103；WP-01 67/67；WP-02 44/44（嵌套 67/67）；两个 driver 各 13/13；candidate audit `CANDIDATE_SCOPE_OK`（200/22/6/3/222）。
- 合成 oracle 88/88、解析器变异 5/5、审计 S-scope 变异 1/1（均预期断言失败）；详细日志路径与新评论 §4 列出。

### 缺失（`NOT_RECORDED`，不替代、不重跑）

1. **首次 subject ref 读取的持久化日志**：命令/输出/exit 0/精确 S 只存在于会话记录；克隆 provenance、首次读取早于编辑、push 前 live 授权检查也只存在于会话记录。无文件级日志，故不声称可独立复核的“首次”证据。
2. **完整 A67 矩阵**：四个 A66 绕过类（含 stub 计数）、隔离模拟 integration（旧/新 + 103/103 嵌套）、完整 candidate auditor 负例（多余已提交/未跟踪、Base 字节改动、Base 缺失、越权增量、mode、符号链接、S-scope 之外的项）、pinned dependency 负例、A67 既有负例——均未在 A72 G2 轮执行。
3. **真实 WP02 44/44 原始 transcript**：仅父级 diagnostics `WP02_UPSTREAM tests=44…`；oracle 使用的是重建 44，未冒充实际。WP-01 使用的是冻结历史 transcript。
4. **逐组探针**：oracle/变异/负例/integration 组没有前后探针；这些组在离线区间之前于联网主机运行（纯进程内/本地 Git，无 socket/子套件），6 次探针不能代表整个组计划。

### 处置

- 状态 **STOP / G2_EVIDENCE_INCOMPLETE**：A72 §3 的完整 G2 矩阵无法由同期记录闭合；按 A73 §3 不自行补跑，需 Design 另出决定。
- 本 seq 不构成 QA dispatch；不关闭 P1/P2，不声称 G3/G4/G5。
- G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 未触碰；A70/A71 继续暂停。
