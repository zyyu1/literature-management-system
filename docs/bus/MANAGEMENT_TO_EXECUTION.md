<!-- BUS from=MANAGEMENT to=EXECUTION seq=30 re=DECISION_BOARD.md@24 status=OPEN updated=2026-11-25T20:55+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 24（R24）§2，用户选定 **DEC-16 = A**。
**授权:** `D007_A72_WP03_STRICT_TAP_FINAL_REMEDIATION_DRAFT.md` §2–§3 + A66/A67（历史契约不变）。

## 基线（一个增量提交，同一 PR #7）

- **PR #7**、同分支 `exec/WP-03-guarded-r1-writes`；不新建 PR。
- **START S:** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`
- **A66 START T:** `0fcad9cb6016900d5f7057161619e4a9f2e94b55`
- **原 Base B:** `1684cea5623c8421e16c328c7f1464e8932d3118`
- 恰好**一个**单父增量提交；不 merge/rebase/reset/force push；不改 PR #7 的既有提交。

## 恰好三个修改路径（0 新增 / 0 删除 / 0 改名）

1. `packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs`
   —— **只**改 strict TAP 解析与必要的嵌套具名通过断言加固；保留 51 条 literal pins、测试标题、计数、guard、spawn、超时；不引入废弃环境旗标。
2. `packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs`
   —— 把显式历史/增量审计扩展到 A72：保留 B 与 T；钉住 S 为新的修正 START；
   证明 B..S 为历史 2 提交、T..S 恰 6 路径（5 M + 1 A）、S..HEAD 恰 1 提交且恰 3 M、
   B..HEAD 恰 3 个单父提交、22 个新增 / 0 个 Base 修改或删除、222 个 tracked 路径；
   S 上除三个 M 外的所有路径字节与 mode 不变；raw worktree 等于 HEAD；无多余/未跟踪/非常规文件；
   真实审计中不得有宽松的 scratch 开关。
3. `packages/wp-03-guarded-r1-writes/README.md`
   —— 说明 A72 修正与审计语义；把 A66 的证据标为历史；`QA_HANDOFF.md` 保持不动。

**禁止:** 产品 src、fixture、上游包、guard、变异驱动、依赖、`tools/`、UI、runtime 改动；不创建 Node24 迁移分支。

## TAP 接受契约（A72 §3，按此实现，不许放宽）

- 以 **Node22 真实的 67/44 绿色 transcript** 作为正向语法基准，不做通用 TAP 支持。
- 有状态文法：一个初始 header；编号 `ok` 记录必须按精确序列与集合、标题非空；
  Node22 合法的 subtest 注释/诊断块只在应有位置允许；恰好一个匹配的顶层 plan；
  恰好一个唯一的数字 summary，其 fail/cancelled/skipped/todo 全为 0；可选的合法 duration；
  summary 之后除允许的空行外**必须终止**。
- **拒绝**：`Bail out!`、任何失败状态记号（含非规范/缩进的 `not ok`）、skip/todo 指令、
  重复 header/plan/summary、任何位置的畸形或矛盾行；不得把「普通诊断文本中提到这些词」误判为状态记录。
- 不得静默忽略畸形结构行；不得弱化 exit0/error/signal/timeout 与嵌套 WP01 具名通过的断言；
  嵌套证明必须恰好一个规范通过、且无矛盾重复。
- 保留合法诊断格式、CRLF/LF、可选末尾换行；计数用有限安全整数。

## 自测与证据（本轮 G2）

- 独立编写的合成配对 oracle：旧解析对 F1/F2/F3 判 `FULL`、新解析必须断言失败；
  变体覆盖 plan 前、summary 之间、完整 summary 之后、空白/大小写/缩进/控制字符、重复、
  意外尾随文本、畸形 summary/header/plan/ok、嵌套重复；外加 A67 的全部既有负例与 process 错误；
  真实 WP01/02 正向 + 合法诊断 + CRLF/LF 控制。
- 为每个新增拒绝类各写一个具名 scratch 变异（含绕过尾随校验、bailout/失败记录拒绝、审计新范围绕过），
  必须以预期断言失败，不得以崩溃/超时。
- 环境：**Node 精确 v22.23.5 x64**；A59 Windows 离线区间 或 A54/A55 Linux 命名空间；
  每组命令前后探针；不得跑联网全套。
- **A46 硬要求**：本轮**首次**尝试的远程 ref 读取必须 `exit 0` 且精确匹配。
  进入正式预检前先把 TLS backend/凭证 helper 配好（不得关闭 TLS 校验、不得用重试豁免）。
  首次失败即 STOP，不得重试后宣称通过。
- 完整 G2：默认 **103/103**、WP-01 **67/67**、WP-02 **44/44**（嵌套 67/67）、两个 driver 各 **13/13**、
  syntax 全过、A72 新增正反例；全部 exit 0、零 skip/todo。

## 交付

- 推那一个增量提交；在 PR #7 发新评论：新 SHA、三路径 diff、old/new 哈希、命令与计数、
  环境与探针、F1–F3 的旧/新对照、变异击杀、限制。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（**20**），然后 **EXECUTION STOP**。

## 边界

- **Design 先核验新 SHA 与三路径白名单**，之后才可安排独立 QA（QA 下一 seq 从 **15** 起，不得写回过期 seq13）。
- **不得合并**（G5 未授权）；G6/G7 未授权；R2、真实持久化、WP-04、UI、真实服务/部署未授权；
  PR #2/#4 与冻结 UI 不动；A70/A71 继续暂停。
- 新 SHA 需要完整独立矩阵；**不得**把 S 的结果当新验收。
