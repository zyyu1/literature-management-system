<!-- BUS from=MANAGEMENT to=EXECUTION seq=14 re=DECISION_BOARD.md@14 status=OPEN updated=2026-11-25T15:25+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 14（R14）§3；DEC-9=A 仍有效，**A62 是原 Fail-closed 契约内的最小修正，无新 DEC、不扩白名单**。
**本单替代 `seq=13`**；旧 seq 13 的交付已由 G3 验证并被判 `G4 PARTIAL_FAIL_CLOSED`（A62 §1），旧记录保留。

## 授权与基线

- **授权文件:** `D007_A60_CROSS_PLATFORM_TEST_INFRASTRUCTURE_G1_DRAFT.md` + `D007_A61_A60_HELPER_FILENAME_CORRECTION.md` + **`D007_A62_A60_G4_PARTIAL_AND_FAIL_CLOSED_REMEDIATION.md`**
- **PR / 分支:** PR **#6**，`exec/WP-02-project-paper-read`（OPEN / 未合并）
- **原始不可变 Base:** `a0fb04f6d03ac81bbcb35800318c927e278e8b92`
- **上一 START（须为祖先）:** `222763dad068fc226e500b14250cbb7fffc0a2de`
- **新精确 START:** `59df257abddfbbb49ed10b1ddd188bfc0c686278`
- 只推**一个**增量提交；不 merge / rebase / reset / force push。

## 仅两个可写路径（其余一律只读）

1. `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs`
2. `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs`（**只**改 helper 的 overlay SHA-256 与必要的诚实注释；原 19 条 manifest、其它 overlay、清单结构、全部断言与嵌套命令不变）

不得改 src、夹具、driver、package、既有 harness、UI、历史证据、CI、依赖、系统/网络设置；helper 不得进默认测试发现；旧文件名 `test-platform.mjs` 仍禁止。

## 要修的五项（A62 §2，逐项照契约）

- **P2-A60-QA-1**：拒绝非数字/空/多重/IPv4 zone 的 IPv6 地址（`normalizeIp` 不得把非法地址规范化成合法）；数字 zone 正确处理。
- **P2-A60-QA-2**：未知 adapter status/media 一律拒绝；陈旧地址/断连行的接受必须基于明确、可观测的状态组合白名单；含糊即拒。
- **P2-A60-QA-3**：拒绝「Up/Connected 但 IP 行全断连」的矛盾，含混合与缺失必需行；无地址/无默认路由的可用非回环路径也必须拒绝。
- **P2-A60-QA-4**：回环必须有正向 OS 身份证据（真实 loopback 接口 + IPv4 127.0.0.1 Connected 行），不得只凭地址；不得用本地化接口名猜测。
- **P2-A60-DESIGN-1**：`readWindowsInventory` 不得用 `asArray` 把缺失/null 的 defaultRoutes 变成 `[]`；必须区分「显式空数组」与「未知/不完整查询」，对所有必需字段适用，无静默兜底。
- 另加**直接相邻 linkage**检查：地址与路由 family 关联、孤立断连 IP 行的拒绝与例外、陈旧默认路由只允许落在正向不可用的匹配接口上（绝不落在 loopback 或未知接口）。真实状态无法无歧义证明 → **STOP**，不得放宽策略。

## 测试与证据（A62 §4）

- 默认发现：WP-01 **67/67**、WP-02 **43/43**（嵌套 67/67）、driver **13/13**、`node --check`，全部 exit 0，零 skip/todo。
- 保留 A60 的**六类具名变异**与**四类完整性负例**；重跑既有策略用例时按修正后的期望，**不得把历史上的 51 个当作本轮新计数**。
- 独立记录**五项定向用例**：缺失 vs 显式空路由、合法数字 IPv6 zone、非法 IPv4/非数字/空/多重 zone、未知 adapter 带/不带陈旧地址、两种矛盾方向与混合 family 行、活跃 LAN 无默认路由且无地址、合法显式断连陈旧路由、孤立回环 vs IPv4 family 不匹配 vs 真实软件回环正向身份、畸形/缺失集合与 family 关联；并给出**真实 Windows 离线清单正向**结果与「联网主机被零流量守卫拒绝」的反向结果（或独立合成活跃清单，不得在全套联网状态下跑）。
- 用同一独立 oracle 证明：**旧候选接受这五个代表性负例、新候选拒绝它们**；并区分「原始查询缺字段」与「纯分类器」两条路径。
- **A62 针对五项各一个 guard-removal 变异**，必须以预期具名断言失败，不得以崩溃/超时代替。
- 全套计数不变（67/43），scratch 仅在仓库外。

## 环境与隔离（A60 §3 / A59）

Windows x64 优先；Node **精确 v22.23.5**；每组命令前做 A59 主机级边界与探针（回环正例 + 外部/LAN IPv4/IPv6 TCP/UDP/DNS 反例），记录脱敏事实；所有子进程在边界内。Linux 原 `lo`-only 守卫与平台/代理/运行时行为保留。**Linux 未实测则记 NOT_RUN**，不得声称双平台认证。不得改机器网络、提权或安装。

## 交付

- PR #6 评论：精确候选 SHA、新 START、两路径 diff、环境与探针、计数与退出码、五项定向矩阵、旧/新对照、变异与完整性负例、限制。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（引用 A60+A61+A62），然后 **EXECUTION STOP**。

## 边界

- **独立 Windows G3 仍为强制**（A62 §4）；Management 不代跑、不用子代理。
- **A58 保持 STOP**，本轮不得加入 identity 新测试；A62 成功后 Design 会用既有 DEC-8=A 直接出 A58 续作。
- **不得合并**（G5 需你明确批准）；G6/G7 未授权；WP-03 仍被 P2 阻断；PR #2/#4 与冻结 UI 不动。
