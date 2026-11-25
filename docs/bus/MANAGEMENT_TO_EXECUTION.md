<!-- BUS from=MANAGEMENT to=EXECUTION seq=11 re=DECISION_BOARD.md@12 status=OPEN updated=2026-11-25T10:55+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 12（R12，2026-11-25）§3；原 DEC-9 决策轮为 board seq 11。
**DEC-9 = A（用户已在 Design 窗口明确选择）** —— 本文件只做正式记录与派发，不重复询问。

**本单替代 `seq=10`（A58+A59 Windows 重派）**；`EXECUTION_TO_QA.md` seq=8 的 STOP 保留为历史。**A58 保持 STOP**，本轮**不得**改 `identity.test.mjs`、不得加入 `Q2-02-CASE-01`。

## 授权与基线

- **授权文件:** `docs/architecture/D007_A60_CROSS_PLATFORM_TEST_INFRASTRUCTURE_G1_DRAFT.md`（DEC-9=A 生效）
- **PR / 分支:** PR **#6**，沿用 `exec/WP-02-project-paper-read`（OPEN / 未合并）
- **原始不可变 Base:** `a0fb04f6d03ac81bbcb35800318c927e278e8b92`
- **精确增量 START:** `222763dad068fc226e500b14250cbb7fffc0a2de`
- **只推一个** infrastructure-only 增量提交；不 merge / rebase / reset / force push。

## 恰好五个可写路径（其余一律只读）

1. `packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs` —— 只放宽 runtime 的平台允许列表，保留 Node/架构等其余检查。
2. `packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs` —— 用共享 helper 替换平台相关前置条件，保留 Q08 断言。
3. `packages/wp-01-synthetic-auth-api/support/test-platform.mjs` —— **新增**，test-only helper，只用 Node 内置模块，不导入产品代码、不改系统网络设置。
4. `packages/wp-02-project-paper-read/test/transport.test.mjs` —— 同样经相对路径用该 helper，仅平台 provenance，功能断言全保留。
5. `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs` —— 只做 Q2-11 的 manifest overlay 与诚实标题/注释，嵌套 67/67 的 exit/test/pass/fail 检查不变。

**禁止:** 改应用 src、夹具、既有 harness、`package.json`、变异驱动、历史证据、CI、wrapper、UI、依赖；不改 PR #2/#4。测试注册总数保持 WP-01 **67**、WP-02 **43**。

## 平台与安全契约（A60 §3）

- Node **精确 v22.23.5** x64；只接受 `process.platform` 为 `linux` 或 `win32`；其它 fail-closed。
- Linux 保留原 `Object.keys(os.networkInterfaces()) == ['lo']` 与 A54/A55 wrapper/探针；Windows 用 A59 等效隔离。
- 共享 helper 必须**只读、fail-closed**：平台不支持、查询失败/超时、清单为空或歧义、未知适配器映射、存在可用非回环路径（即使无默认路由）、IPv6/VPN/虚拟/LAN 路径、缺失回环、继承代理变量 —— 任一命中即拒绝。不得依赖接口名、DNS 失败、UDP 返回、环境标记或手写 PASS 字符串；不得伪造成功或降级绕过。
- 主机级隔离与 A59 探针仍需在**每组命令前**执行；in-suite 检查不能替代持续隔离。若必须在联网主机上验证负例，只允许在与应用/测试套件隔离的零流量守卫中跑，或用独立合成清单；**不得在未隔离主机上跑全套**。
- 不得自动改动机器网络、提权或安装组件。

## Q2-11 完整性过渡（A60 §4）

- 原 19 条 `BASE_MANIFEST` 逐条保留；新增显式 A60 overlay，仅替换 `auth-contract` 与 `transport-negative` 的 SHA-256，并加入新 helper 的哈希。
- 新期望清单 = 原名单 + 恰好一个 helper；其余 17 个 WP-01 文件哈希不变；逐文件比对，不得运行时推导期望值、不得通配排除。
- 记录五个路径的旧/new blob 与 SHA-256（新 helper 无旧 blob）。

## 必做（A60 §5）

1. 预检：首次远程 ref 精确 START、干净全新检出、Base 为祖先、无 merge、受保护字节与当前派发/STOP 状态核对；不匹配 → STOP。
2. Windows x64 优先（A59 边界）：语法 + WP-01 **67/67** + WP-02 **43/43** + 既有驱动 **13/13**，全部 exit 0；不跳过、不加 todo、嵌套 WP-01 计数精确。
3. 自写 scratch 平台 helper 测试：Linux lo-only 接受 / 多接口拒绝；Windows 断网+陈旧路由（须完整证据）接受、活跃 LAN（含无默认路由）拒绝、可用默认路由拒绝、IPv6/VPN/虚拟拒绝、未知映射拒绝、查询失败/超时/畸形/空清单拒绝、缺回环拒绝、代理变量拒绝、平台不支持拒绝；并证明 fail-closed 且无网络/系统副作用。至少覆盖 guard bypass、忽略活跃路径、接受查询失败、代理绕过、Linux lo 检查绕过、Q2-11 overlay/完整性绕过 —— 以具名断言击杀（scratch，事后还原）。
4. PR #6 评论贴：精确候选 SHA、START、五路径 diff、环境/探针、计数与退出码、manifest 证据、scratch 探针/变异结果与限制；写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq；然后 **EXECUTION STOP**。

## 边界

- **不得合并**（G5 另行 DEC）；G6/G7 未授权；WP-03 仍被 P2 阻断。
- A58 的 Q2-02-CASE-01 只能等 A60 新 G4 后再由 Design 出续作授权，本轮不得混入。
- PR #2（`a9131ac`）、PR #4（`2757aa6`）、冻结 UI 不动；不使用真实数据/服务。
