<!-- BUS from=MANAGEMENT to=EXECUTION seq=15 re=DECISION_BOARD.md@15 status=OPEN updated=2026-11-25T15:50+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 15（R15）§3；**沿用原 DEC-8=A，无新 DEC**。
**A60+A61+A62 已由 A63 判 `G4 PASS_LOCAL` 并冻结**；本单只恢复 A58 的单文件测试补强。

## 授权与基线

- **授权文件:** `D007_A58_WP02_P2_TEST_ONLY_G1_DRAFT.md` + `D007_A59_A58_WINDOWS_ENVIRONMENT_AMENDMENT.md`
  + **`D007_A63_A62_EXACT_G4_PASS_LOCAL_AND_A58_CONTINUATION.md`**（A60/A61/A62 已验收）
- **PR / 分支:** PR **#6**，`exec/WP-02-project-paper-read`（OPEN / 未合并）
- **不可变 Base:** `a0fb04f6d03ac81bbcb35800318c927e278e8b92`
- **祖先链:** `222763d…`（原 A58 START）→ `59df257a…`（A62 START）→ **新精确 START `ab4a37c8905ebc9d3f889164c2f8164c9286051d`**
- 只推**一个**增量提交；不 merge / rebase / reset / force push。

## 唯一可写路径

`packages/wp-02-project-paper-read/test/identity.test.mjs`
—— 只新增一个具名回归 `Q2-02-CASE-01 itemKey is case-sensitive; absent case variant has neutral 403`（必要时最小同文件 `node:http` helper），**保留全部既有测试与断言**。

**冻结（与 new START 逐字节一致）:** A60/A61/A62 的五路径基建、WP-01（20 文件 = 原 19 + overlay，其余 17 不变）、Q2-11、helper、夹具、driver、原 harness、证据、QA_HANDOFF、package、CI、wrapper、UI。
不得新增其它 tracked 测试、依赖、真实服务或系统设置改动。

## 行为契约（A58 §2 仍有效）

- 既有 OWNER 同 Origin 精确 tuple `user/fakeLib01/XFAKE001`：GET 200 且 identity 精确；
- 缺失小写 `user/fakeLib01/xfake001`：403，中性 JSON `{"apiVersion":"v1","error":{"code":"NOT_AVAILABLE"},"outcome":"DEFINITE_FAILURE","dispatched":false}`；
- 普通缺失 `user/fakeLib01/XNOPE999`：403，raw body 逐字节相同、headers 等价（除 Date/connection 噪声）；
- 断言两个 tuple 都不在夹具中、state digest 与 counts 不变、不得 `allowSeedChange`；不做更宽的 case/Unicode 规范化。

## 环境（A59 / A63 §3）

Windows x64 优先；Node **精确 v22.23.5**（含子进程）；A59 用户控制离线区间或既有等效隔离，**每组命令前**重跑探针（回环正例 + 外部/LAN IPv4/IPv6 TCP/UDP/DNS 反例），所有后代进程在边界内；不得改网络/提权/装组件。**Linux 未实测记 NOT_RUN**，不声称双平台。

## 测试与配对证明

- `node --check`；WP-02 **44/44**、WP-01 独立 **67/67**（嵌套 67/67）、committed driver **13/13**，全部 exit 0，零 skip/todo；diff 恰一文件。
- 在仓库外 scratch 复现 QM12（大小写不敏感 itemKey fallback，限同一 ownerScope/libraryType/libraryId），保留大写 200：
  - 旧套件在**新的 A63 START** 上同一 QM12 下仍 **43/43 通过**（否则 STOP 报告不一致）；
  - 新候选的 `Q2-02-CASE-01` 以 **ERR_ASSERTION（expected 403 / actual 200）** 失败，不得是崩溃/超时；
  - 记录 scratch 补丁、命令与退出码；scratch 不推送。
- 独立 raw HTTP 验证中性 403 的字节等价与 digest/counts 不变。

## 交付

- PR #6 评论：精确 HEAD、START、one-file diff、计数与退出码、环境与探针、QM12 配对证据与限制。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（引用 A58+A59+A63），然后 **EXECUTION STOP**。

## 边界

- 旧 `seq 10` 的 A58 STOP **不是**本次派发依据；不得复用旧 scratch 作为验收。
- **独立 Windows/Linux QA 必需**（A59 允许，Windows 优先）；QA 之后 Design 才裁新 G4，之后才可能关闭原 P2。
- **不得合并**（G5 需你明确批准）；G6/G7 未授权；WP-03 仍被原 P2 阻断；PR #2/#4 与冻结 UI 不动。
