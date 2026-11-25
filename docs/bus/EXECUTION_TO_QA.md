<!-- BUS from=EXECUTION to=QA seq=11 re=MANAGEMENT_TO_EXECUTION.md@13 status=OPEN updated=2026-11-25T14:35+01:00 -->
# Execution → QA

## A60 + A61 cross-platform test infrastructure ready for independent Windows G3

| Item | Value |
| --- | --- |
| PR / branch | **#6** `exec/WP-02-project-paper-read` → `main` (OPEN, do not merge) |
| Exact candidate SHA | `59df257abddfbbb49ed10b1ddd188bfc0c686278` |
| Parent / exact START | `222763dad068fc226e500b14250cbb7fffc0a2de` |
| Immutable Base | `a0fb04f6d03ac81bbcb35800318c927e278e8b92` |
| Execution report comment | **7163918139** (PR #6) |
| Authority | A60（DEC-9=A）+ A61 文件名修正 |
| QA plan | `docs/architecture/D007_A60_CROSS_PLATFORM_TEST_INFRASTRUCTURE_G1_DRAFT.md` §4–§5 + `docs/architecture/D007_A61_A60_HELPER_FILENAME_CORRECTION.md` §3 |

## 交付事实

- 只改 **5 个 tracked 路径**（+300/−24）：`wp-01/test/auth-contract.test.mjs`、`wp-01/test/transport-negative.test.mjs`、**新增** `wp-01/support/platform-precondition.mjs`、`wp-02/test/transport.test.mjs`、`wp-02/test/wp01-regression.test.mjs`。旧 `support/test-platform.mjs` 不存在；默认 `node --test` 发现范围、测试命令、嵌套 spawn、既有功能断言均未改。
- Q2-11：19 条原始 `BASE_MANIFEST` 逐字保留 + 显式 overlay（2 个已授权测试哈希 + 新 helper 哈希），期望清单 20 个文件，其余 17 个与 Base 逐字节一致；无运行时推导、无通配排除。
- 环境：Windows 10.0.19045 x64、Node **v22.23.5** win32/x64（portable）；A59 用户控制离线区间，每组命令前重新验证边界，`EGRESS_PROBE=PASS`（外部/LAN TCP `EHOSTUNREACH`、IPv6 `ENETUNREACH`、DNS 失败、`blocking-on-usable=0`、`routes-on-usable=0`）。
- 实测（全部在边界内）：syntax 5/5；WP-01 **67/67**；WP-02 **43/43**（嵌套 Q2-11 精确 67/67）；committed driver **13/13**；scratch **30/30**（19 条 helper 策略用例、真实 Windows 盘点 0 次 socket、Q2-11 四类完整性负例 4/4、6/6 具名变异含此前 inconclusive 的 overlay bypass）。
- 五个路径的 git blob 与 SHA-256 已贴在 PR #6 评论（见 7163918139）。

## QA 要求（A60 §5 / A61 §3）

独立用户开启的 Windows x64 会话、全新 detached clone、自己的 A46/A59 预检与探针；从候选 Git blob 独立推导 overlay 哈希；核对恰好 5 路径、一个增量提交、干净树；WP-01 67/67、WP-02 43/43、嵌套 67/67、driver 13/13 全 exit 0；四类完整性负例与全部具名变异独立复现；无跳过/豁免。Linux 运行时未实测，记 `NOT_RUN`，不得声称双平台认证。

Gates unchanged：A58 仍 STOP、P2-WP02-QA-1 `OPEN_NON_BLOCKING`；无 G3/G4 声明；G5/G6/G7 **NOT_AUTHORIZED**；PR #2（`a9131ac`）、PR #4（`2757aa6`）与冻结 UI 未触碰。
