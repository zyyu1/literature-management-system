<!-- BUS from=EXECUTION to=QA seq=9 re=MANAGEMENT_TO_EXECUTION.md@11 status=STOP updated=2026-11-25T11:22+01:00 -->
# Execution → QA

**status=STOP — A60 五个路径已实现且离线实测完成，但被 A60 自身的「路径 + 计数」冲突阻断：Node v22.23.5 会把 `packages/wp-01-synthetic-auth-api/support/test-platform.mjs` 当作测试文件发现，WP-01 变成 68/68，Q2-11 的嵌套 67 断言必然失败。** 未提交、未推送；PR #6 HEAD 仍 `222763dad068fc226e500b14250cbb7fffc0a2de`。

## 1. 任务与预检

- seq 11 = DEC-9=A / A60（替代 seq 10；A58 保持 STOP；本轮**未**改 `identity.test.mjs`、未加入 Q2-02-CASE-01）。
- 预检（全部 PASS）：首次远程 ref 读回精确 START `222763d…`；Base `a0fb04f6…` 为祖先；Base..START 3 提交、0 merge、27 文件；`packages/wp-01-synthetic-auth-api` 相对 Base 无 diff；夹具 `c4fc68af…f888` / `86c47a5a…be65`；clone-local `core.autocrlf=false`；起始测试计数 **67/43**。

## 2. 实现（仅在仓库外 scratch 克隆，未提交）

五个白名单路径全部完成，且只有这五个：

1. `support/test-platform.mjs`（新增）：只读、fail-closed 的共享前置条件。Linux 保留 `Object.keys(os.networkInterfaces()) == ['lo']`；Windows 用显式解析的 `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`（`-NoProfile -NonInteractive`、8s 超时、无 PATH 查找）执行**只读** `Get-NetAdapter -IncludeHidden / Get-NetIPInterface / Get-NetIPAddress / Get-NetRoute`，按 ifIndex 关联；不接受接口名、DNS/UDP 结果或手写 PASS 字符串。判定：任一可用（Up+Connected+IP Connected）非回环接口携带任何非回环地址、或可用默认路由、未知/歧义关联、空/畸形清单、缺回环、查询失败/超时、代理变量、非 linux/win32、非 v22.23.5、非 x64 → 全部拒绝；断开适配器上的陈旧 IP/默认路由仅在适配器不可用且状态自洽时接受。IPv6 zone（`fe80::1%16`）按数字 zone 归一化。
2. `test/auth-contract.test.mjs`：仅平台允许列表 → `linux` 或 `win32`；Node/arch 及其余断言不变。
3. `test/transport-negative.test.mjs`：egress 前置条件改用 helper；Q08 断言全保留。
4. `test/transport.test.mjs`：同样经相对路径使用 helper；provenance 的平台行改为 `linux|win32`，其余断言不变。
5. `test/wp01-regression.test.mjs`：19 条原始 `BASE_MANIFEST` 逐条保留；新增显式 A60 overlay（仅 `auth-contract`、`transport-negative`、新 helper 三个 SHA-256），其余 17 个文件仍用 Base 值；期望清单 = 原 19 + helper = 20，逐文件比对，无运行时推导/通配排除。

WP-01 清单核对：20/20 文件、哈希 0 不符；静态测试计数仍 67/43。

## 3. 离线实测（A59 边界，Windows x64 / Node v22.23.5）

`EGRESS_PROBE=PASS`：loopback CONNECTED；`1.1.1.1:443`、`8.8.8.8:53`、`140.82.112.3:443`、`192.168.5.1:80`、`10.0.0.1:80` 全 `EHOSTUNREACH`；IPv6 `ENETUNREACH`；DNS `LOOKUP_FAILED`；`blocking-on-usable=0`、`routes-on-usable=0`（`default-routes-total=1`，陈旧路由位于已断开适配器）。

| 组 | exit | tests | pass | fail | 说明 |
| --- | --- | --- | --- | --- | --- |
| syntax-check（5 文件） | 0 | — | — | — | 全部通过 |
| WP-01 套件 | 0 | **68** | 68 | 0 | 67 个原有测试 + `ok 1 - support\test-platform.mjs`（helper 被当作测试文件） |
| WP-02 套件 | 1 | 43 | 42 | 1 | `Q2-11 the unchanged WP-01 suite still passes 67/67`：`68 !== 67` |
| 变异驱动 | 2 | — | — | — | 基线非绿，驱动按自身保护 `BASELINE_NOT_GREEN` 中止，13/13 不可达 |
| A60 scratch 验证 | 1 | — | 28 | 1 | 见下 |

scratch 结果：19 条 helper 纯策略负例全过；**真实 Windows 离线查询通过且 `net.Socket.connect` 调用数为 0**（无对外探测）；Q2-11 三个完整性负例（多余文件 / 未授权文件改字节 / 已授权文件改字节但未更新 overlay）全部被检出；helper 的 5 个具名变异（平台守卫、忽略活跃路径、接受查询失败、代理绕过、Linux `lo` 绕过）全部被杀死。唯一 `not ok` 是 Q2-11 overlay 变异——因下面同一个 68/67 原因，嵌套断言先行失败，overlay 检查的效果无法判定（**inconclusive，不是通过**）。

**所有 67 个原有 WP-01 测试、42 个 WP-02 测试本身全绿**；失败仅来自 helper 文件的“测试发现”计数。

## 4. 根因（可复现）

- Node v22.23.5 默认测试发现模式包含 `**/test-*.mjs`；TAP 顶部出现 `# Subtest: support\test-platform.mjs` / `ok 1 - support\test-platform.mjs`，故 `# tests 68`。
- 独立最小实验（临时目录，非仓库）：`support/test-empty.mjs`（无任何测试）与 `support/test-exit.mjs`（`process.exit(0)`）都会被 `node --test` 计入 `# tests`——文件本身固定贡献 1。
- 因此 A60 的两项硬要求互斥：helper 路径必须恰为 `.../support/test-platform.mjs` **且** WP-01 必须 67；在 Node 22 下无法同时成立（除非改路径或改变发现范围）。

## 5. 未做 / 边界

- 未提交、未推送、未建分支、未 rebase/force push；未在 PR #6 发评论。
- 未改 src、夹具、既有 harness、`package.json`、变异驱动、历史证据、CI、wrapper、UI、依赖；`tools/` 未进分支。
- 未跳过/弱化任何断言；未把 68 当作通过。

## 6. 需要的修正（Design 决定，Execution 不自作主张）

- **推荐 A（最小）**：把 helper 改名为不匹配 Node 发现规则的文件，例如 `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs`；同步四个引用文件与 Q2-11 overlay 哈希。行为与安全契约完全不变，67/43 立即恢复。这是对 A60 五路径清单的一处替换。
- **B（不推荐）**：明确授权改变测试发现范围（Execution/QA 用 `node --test test`，并把 `wp01-regression` 的嵌套 spawn 改为 `test` 目录）。这超出 A60「仅 overlay/标题」的限制，且 QA 若裸跑 `node --test` 仍会看到 68。
- **C（不推荐）**：接受 WP-01 = 68 并同步修改 Q2-11/A60 计数——与 A60 的“保留 67”目标冲突。

## 7. 五路径 old/new blob 与 SHA-256（A60 §4）

| Path | old blob | new blob | old SHA-256 | new SHA-256 |
| --- | --- | --- | --- | --- |
| `wp-01.../test/auth-contract.test.mjs` | `c97b884a9d39aa90c482836bd3f30ad32ef2bb5f` | `a37aec84156ef0b4aaf4141bfbe814b977f50b9a` | `42f229ca7cd9cf204c61de41c2e7aa78b396df21704e67cff3c3f97264d9c073` | `243a5523b4bf285aa7e8e85b6757535e34379d3b10e514cca903c4c4fcbfe753` |
| `wp-01.../test/transport-negative.test.mjs` | `4fd46780a7ed89839ccff0d6f81551ccb3b0f167` | `6fd3db7e47214c7053ee4580c2e3c2a0c9289829` | `c85a3c5d5e0ce39fe5245e4f7253bdcaf6192b05b45ea6c75d7b220dfe01a343` | `2dd67349078a8083304a67352094c5c6c141dbaabb6cc6d0d5665c1406992e4c` |
| `wp-01.../support/test-platform.mjs` | (new) | `da76b253e7dc03726a6c43da4c7738b1b947cb81` | (new) | `5e67d2e482ceb53c5a4e3a77c37791355665727558eb89b8dd2469b774975bdf` |
| `wp-02.../test/transport.test.mjs` | `984f2177b743a911df411675c2732ef062a55bbe` | `eaa92e9c0ff2c48056ab29584445ce34faa158ae` | `ca0f580b0f45a13180812e7d197b833789a60e7ef13311d6621339f275b22b18` | `afaca14196c97a0c66874a1bb8685c19c46772735ab107b7d9f24df6b8d1aa5d` |
| `wp-02.../test/wp01-regression.test.mjs` | `bc4e8987f87cc68014bec7e686a49007644f2f00` | `0d9382581752d907e5d28b310ef8393468d4569b` | `768681bea4584fe959121599217f8f8f79c4e057ae8bb7e798df1a8e0ba1aa0f` | `da098ec4646c5c0531f4f632046332145fbffd00169fa7ee24349436aa47e487` |

## 8. 证据位置（本地 scratch，不在仓库）

`.work/ex/a60-run/`：`a60-evidence.json|md`、`egress-probe.txt`、`console.log`、`tap/*.out`；`.work/ex/a60-clone/`：未提交的五路径实现。需要时可转贴 PR #6，但本轮未动 PR。

Gates unchanged：A58 仍 STOP、P2-WP02-QA-1 OPEN_NON_BLOCKING；G5/G6/G7 NOT_AUTHORIZED；PR #2（`a9131ac`）/ PR #4（`2757aa6`）与冻结 UI 未触碰。
