<!-- BUS from=MANAGEMENT to=EXECUTION seq=32 re=DECISION_BOARD.md@26 status=OPEN updated=2026-11-25T21:50+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 26（R26）§2，用户选定 **DEC-17 = A**。
**授权:** `D007_A74_WP03_A72_READ_ONLY_G2_REVALIDATION_DRAFT.md` §2（只读 G2 重验）。

## 性质：只读、同 SHA、零可写候选路径

- PR **#7**，exact HEAD **`c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`**（OPEN / 未合并）。
- **不允许**：改任何 tracked 文件、新增提交、建分支、改 PR、merge/rebase/force push。
  本轮唯一允许的写操作是 `docs/bus/EXECUTION_TO_QA.md`。
- **不追认原轮**：本轮的结论只对本轮取证有效；原 `#7172989882` 与补证 `#7173685843` 仍为历史。
- 开始前重新核对 live SHA 与授权；漂移即 STOP。

## 环境（不满足即 STOP）

- Node **精确 v22.23.5 x64**（记录 `node --version` 与实际路径）。
- **Windows → A59 用户控制离线区间**；或 **Linux → A54/A55 命名空间**（Node22 需自备）。
- **每一个命令组**都在隔离内：syntax、默认套件、上游套件、两个 driver、oracle、变异、负例、
  integration、审计。组**前后各一次**探针（回环正例 + 外部/LAN IPv4/IPv6 TCP/UDP/DNS 反例），
  记录脱敏网卡/路由/代理事实；scatch 若在联网主机跑，其结论**不得**充当隔离证据。
- 不得跑联网全套；不得改系统/网络、安装、提权。

## 首次 ref 读取（必须是真·首次）

- 进入正式预检前先配好 TLS backend / 凭证 helper（**不得**关闭 TLS 校验）。
- **首次** `ls-remote` 必须一次 `exit 0`、返回精确该 SHA；把命令、时间、原始输出、退出码
  **落盘保存**（例如 `.work/ex/a74/01-lsremote.txt`），PR 评论引用该文件内容。
- 若首次失败：立即 STOP，**不得**重试后宣称通过，也不得把后续读取当首次。

## 必须完整产生并由文件支撑的证据

1. **基础门禁**：syntax 全部 `.mjs`；默认 WP-03 **103/103**；WP-01 **67/67 原始 transcript**；
   WP-02 **44/44 原始 transcript**（不得用重建版替代）；嵌套 WP-01 **67/67**；
   两个 driver 各 **13/13**；candidate audit `CANDIDATE_SCOPE_OK`。
2. **A67 五类矩阵**：
   - strict TAP：正向（真实 transcript）+ 全部负例（缺失/畸形/重复/部分 summary、plan、not‑ok、
     skip/todo、cancelled、错误计数、非零/信号/spawn 错误/超时、嵌套缺失或失败）+ 旧/新对照；
   - 四个 A66 绕过类（含 pre-child guard 的 stub 计数、pinned 完整性、candidate audit 绕过、上游失败容忍）；
   - **隔离的 simulated integration**：钉住 main-only 文档，旧默认拒绝 / 新默认接受，
     并在该集成树上完整跑默认 **103/103**（含嵌套 67/44）；
   - **完整 candidate auditor 负例**：多余已提交、未跟踪、Base 字节被改、Base 路径缺失、
     越权增量、mode 变化、符号链接替换、S-scope 越界；
   - **完整 pinned dependency 负例**：上游多余/缺失/改动（含 evidence）、夹具改动、`tools/offline` 改动。
3. **A72 新增**：F1–F3（trailing `Bail out!`、非规范 `not ok`、缩进 `not ok`）旧解析 `FULL` vs
   新解析断言失败；解析器的其余负例变体；解析器与审计的具名变异（含新范围绕过）全部按预期断言失败。
4. **原始日志落盘**：每组命令的命令行、开始/结束时间、退出码、完整输出、
   探针结果与脱敏环境事实，存到本轮工作目录（不得只存在于会话记录）。
   PR 评论逐项引用文件路径与关键片段；缺失项写 `NOT_RECORDED`，**不得补造或替代**。

## 交付

- 在 PR #7 发一条新评论（同 SHA），引用 `#7172989882`、`#7173685843` 与 A74，逐项列出：
  环境与隔离、首次 ref、各门禁计数与退出码、五类矩阵结果、A72 的 F1–F3 对照、变异击杀、
  findings / NOT_RUN / NOT_RECORDED、日志文件清单。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（**22**，或 latest+1），只提交该文件，
  提交信息 `bus(execution): seq 22`；**EXECUTION STOP**。

## 边界

- 不派 QA；Design 核验本轮证据后才释放独立 G3（QA 下一 seq 从 **15** 起）。
- **不得合并**；G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；
  PR #2/#4 与冻结 UI 不动；A70/A71 继续暂停。
- P1/P2 仍 OPEN；本单不构成任何 G4 结论。
