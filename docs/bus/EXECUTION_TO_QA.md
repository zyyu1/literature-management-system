<!-- BUS from=EXECUTION to=QA seq=12 re=MANAGEMENT_TO_EXECUTION.md@14 status=OPEN updated=2026-11-25T15:35+01:00 -->
# Execution → QA

## A62 fail-closed remediation ready for independent Windows G3

| Item | Value |
| --- | --- |
| PR / branch | **#6** `exec/WP-02-project-paper-read` → `main` (OPEN, do not merge) |
| Exact candidate SHA | `ab4a37c8905ebc9d3f889164c2f8164c9286051d` |
| Parent / new exact START | `59df257abddfbbb49ed10b1ddd188bfc0c686278` |
| Previous START (ancestor) | `222763dad068fc226e500b14250cbb7fffc0a2de` |
| Immutable Base | `a0fb04f6d03ac81bbcb35800318c927e278e8b92` |
| Execution report comment | **7165200784** (PR #6) |
| Authority | A60（DEC-9=A）+ A61 + A62 |
| QA plan | A60 §5 + A61 §3 + `docs/architecture/D007_A62_A60_G4_PARTIAL_AND_FAIL_CLOSED_REMEDIATION.md` §4 |

## 交付事实

- 只改 **2 个路径**（+155/−87）：`wp-01/support/platform-precondition.mjs` 与 `wp-02/test/wp01-regression.test.mjs`（仅 helper overlay 哈希 + 诚实注释）。原 19 条 `BASE_MANIFEST`、其余 overlay、清单结构（20 文件）、默认测试发现与全部功能断言不变。
- 五项 A62 修复：IPv6 zone 严格化；adapter 状态白名单 + 正向 OS 身份的非 IP 伪适配器（`Virtual/HardwareInterface/ConnectorPresent/NdisPhysicalMedium/PhysicalMediaType` + 无 IP 行/地址/路由）；矛盾与活跃路径拒绝；回环正向身份（127.0.0.1 + IPv4 Connected + 哨兵 MTU + 不在 Get-NetAdapter）；必需集合严格解析（缺失/null/非数组 → `QUERY_INCOMPLETE`，显式空数组仍接受）。相邻 linkage：address/route family、孤儿 IP 行、loopback 路由、陈旧路由仅在正向不可用接口。
- 环境：Windows 10.0.19045 x64、Node **v22.23.5** win32/x64；A59 离线区间，每组前重新验证；`EGRESS_PROBE=PASS`（外部/LAN TCP `EHOSTUNREACH`、IPv6 `ENETUNREACH`、DNS 失败、`blocking-on-usable=0`、`routes-on-usable=0`）。
- 实测（全部在边界内）：syntax 5/5；WP-01 **67/67**；WP-02 **43/43**（嵌套 67/67）；driver **13/13**；scratch **50/50**。
- 真实离线清单：`{"Disconnected|Disconnected":4,"Disconnected|Unknown":5,"Not Present|Unknown":4,"Up|Connected":3}`，`pseudoNonIp=3`，回环正向身份成立，1 条陈旧默认路由落在断开适配器，helper 侧 0 次 socket；旧/新 oracle 5/5、A62 五个 guard-removal 变异 5/5 击杀、A60 六变异与四类完整性负例保留。
- 两路径 git blob 与 SHA-256 已贴在 PR #6 评论 7165200784。

## QA 要求

独立用户开启的 Windows x64 会话、全新 detached clone at `ab4a37c`、自己的 A46/A59 预检与探针；从候选 blob 独立推导 helper overlay 哈希；核对恰好 2 路径 / 1 增量提交 / 原 19 条 manifest 与 20 文件；67/43/13 全 exit 0；五项定向矩阵、旧/新对照、五个 guard mutant 与四类完整性负例独立复现。Linux 未实测记 `NOT_RUN`。

Gates unchanged：A58 仍 STOP、P2-WP02-QA-1 `OPEN_NON_BLOCKING`；无 G3/G4 声明；G5/G6/G7 **NOT_AUTHORIZED**；PR #2（`a9131ac`）、PR #4（`2757aa6`）与冻结 UI 未触碰。
