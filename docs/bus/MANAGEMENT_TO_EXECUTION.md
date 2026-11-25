<!-- BUS from=MANAGEMENT to=EXECUTION seq=13 re=DECISION_BOARD.md@13 status=OPEN updated=2026-11-25T14:25+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 13（R13）§3；原 DEC-9=A 仍有效，**A61 为最小文件名修正，无新 DEC**。
**本单替代 `seq=12` 的 STOP**；旧 seq 11 派发与 seq 12 STOP 均为历史。

## 授权与基线

- **授权文件:** `docs/architecture/D007_A60_CROSS_PLATFORM_TEST_INFRASTRUCTURE_G1_DRAFT.md`
  \+ `docs/architecture/D007_A61_A60_HELPER_FILENAME_CORRECTION.md`
- **PR / 分支:** PR **#6**，沿用 `exec/WP-02-project-paper-read`（OPEN / 未合并）
- **原始不可变 Base:** `a0fb04f6d03ac81bbcb35800318c927e278e8b92`
- **精确增量 START:** `222763dad068fc226e500b14250cbb7fffc0a2de`
- 只推**一个** test-infrastructure-only 增量提交；不 merge / rebase / reset / force push。

## 五路径白名单（A61 后）

1. `packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs`
2. `packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs`
3. **`packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs`（新增；旧 `support/test-platform.mjs` 不得存在）**
4. `packages/wp-02-project-paper-read/test/transport.test.mjs`
5. `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs`

其余一律只读：应用 src、夹具、既有 harness、`package.json`、变异驱动、历史证据、CI、wrapper、UI、依赖、PR #2/#4。
**默认 `node --test` 发现范围、测试命令、嵌套 spawn、既有功能断言都不得改。**

## 关键要求（A60 + A61）

- **helper**：只读、fail-closed；Linux 保留 `Object.keys(os.networkInterfaces()) == ['lo']`；Windows 用显式 `powershell.exe`（`-NoProfile -NonInteractive`、超时、无 PATH 查找）做只读盘点（NetAdapter/NetIPInterface/NetIPAddress/NetRoute，按 ifIndex 关联）；任一可用非回环路径/默认路由/未知映射/空或畸形清单/查询失败/代理变量/平台不支持 → 拒绝；陈旧路由仅在接口不可用且证据自洽时接受。
- **manifest**：原 19 条 `BASE_MANIFEST` 逐字保留；显式 overlay 只替换两个已授权文件的哈希 + 新 helper 一个哈希；期望清单 20 个文件，其余 17 个不变；QA 必须能从候选 blob 独立推导 overlay。
- **回归**：`node --check` + **WP-01 恰好 67/67** + **WP-02 恰好 43/43**（嵌套 Q2-11 精确 67/67）+ 既有驱动 **13/13**，全部 exit 0；helper 不得被识别为测试；不得跳过、不得改计数。
- **A59 隔离**：Windows 优先；离线区间或既有等效隔离；每组命令前跑探针并记录脱敏环境事实；所有后代进程在边界内。
- **负例与变异**（scratch，事后还原）：平台守卫、忽略活跃路径、接受查询失败、代理绕过、Linux `lo` 绕过、Q2-11 overlay/完整性绕过 —— 全部以具名断言击杀；**含上次 inconclusive 的 overlay 变异必须重新演示**；Q2-11 的四类完整性负例（多余文件、缺失文件、未授权文件改字节、已授权文件改字节但未更新 overlay）全部被检出。
- **A60 §3 的交叉平台结论不得扩大**：未实际跑过的平台记 `NOT_RUN`，不得声称双平台认证。

## 交付

- PR #6 评论：精确候选 SHA、START、五路径 diff、环境与探针、计数与退出码、manifest 证据、scratch 探针/变异结果与限制。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（引用 A60+A61 与新 HEAD），然后 **EXECUTION STOP**。
- 旧 scratch 只有在干净 START、完整五路径 diff 复核与当前授权核对后才能复用；**scratch 结果不构成验收**。

## 边界

- **A58 保持 STOP**，本阶段不得改 `identity.test.mjs`、不得加入 `Q2-02-CASE-01`；待 A60+A61 新 G4 后由 Design 另行恢复。
- **不得合并**（G5 另行 DEC）；G6/G7 未授权；WP-03 仍被 P2 阻断；冻结 UI 与历史证据不动。
