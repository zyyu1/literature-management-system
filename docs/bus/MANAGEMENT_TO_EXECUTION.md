<!-- BUS from=MANAGEMENT to=EXECUTION seq=10 re=DECISION_BOARD.md@10 status=OPEN updated=2026-11-25T10:20+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 10（R10，2026-11-25）§3 + **A59 环境修正**。本轮无新 DEC，DEC-8=A 仍有效。

**本单替代 `seq=9` 的 Linux-only 派发**；旧 `EXECUTION_TO_QA.md` seq=7 的 STOP 保留为历史记录，不是自动重启。

## 授权与基线

- **授权文件:** `docs/architecture/D007_A58_WP02_P2_TEST_ONLY_G1_DRAFT.md`（已由 DEC-8=A 生效）
- **环境修正:** `docs/architecture/D007_A59_A58_WINDOWS_ENVIRONMENT_AMENDMENT.md`（仅适用于 A58）
- **PR / 分支:** PR **#6**，沿用 `exec/WP-02-project-paper-read`（OPEN / 未合并）
- **原始不可变 Base:** `a0fb04f6d03ac81bbcb35800318c927e278e8b92`
- **精确增量 START:** `222763dad068fc226e500b14250cbb7fffc0a2de`
- **唯一可写路径:** `packages/wp-02-project-paper-read/test/identity.test.mjs`（只加一条 `Q2-02-CASE-01`，既有测试与断言全保留）
- **禁止:** 改 src / 夹具 / `scripts/mutation-check.mjs`（M01–M13 不变）/ WP-01 / 历史证据 / 依赖 / CI / UI；不 merge、不 rebase、不 force push；不接真实服务。

## 执行主机（A59 §1）

- **原生 Windows x64 或 Linux x86_64 均可**；优先沿用现有 Windows Execution 窗口；无需 Linux/WSL2/VM，也无需跨 OS 二次运行。
- Node 必须 **精确 v22.23.5**（含子进程解析到同一可执行文件与架构）；禁止使用默认 v26.13.0。
- 预检仍按 A46：首次远程 ref 读回精确 START、Base 为祖先、无 merge、`core.autocrlf=false`、夹具与受保护 blob 一致、干净克隆。

## Egress 边界（A59 §2，不降低标准）

- **Windows：** 不需要 Linux 脚本或 `unshare`。必须使用**已可用的 OS 级 loopback-only 边界**，二选一：
  1. **用户可控的离线测试区间**：测试前切断全部外部网络路径（以太网、Wi‑Fi、移动、VPN、虚拟网桥/网卡等），保留回环；在隔离期间与结束后记录经脱敏的网卡/路由清单，证明无可用的非回环路径；测试/服务器/子进程全部退出前不得重连；Git 与报告在重连后进行。
  2. **既有的隔离 Windows 环境**（预置虚拟机/沙箱，测试上下文无非回环外联能力，但保留回环）。
- **不得**自动切换用户网络、改持久防火墙/系统设置、提权或安装组件；需要管理员操作时须单独征得用户同意。
- **每次命令组前**记录：OS/构建/架构、解析到的 Node 路径与版本、脱敏的网卡/路由状态、隔离方法与时间窗、最小环境变量白名单（只列名字，不含值、无代理/凭证变量）。
- 探针必须同时证明正例（127.0.0.1 bind/connect）与反例（非回环 IPv4/IPv6 TCP、UDP、`.invalid` DNS，含外部与 LAN 目标）；只有证据一致时才可记 `EGRESS_PROBE=PASS`，并在整个命令组期间保持边界覆盖所有后代进程（含变异驱动）。
- 若既无可用隔离、也无法执行用户可控离线区间 → **ENVIRONMENT_BLOCKED / STOP**。联网状态下、无等效隔离的 Windows **不算通过**。

## 必做（A58 §3 + A59）

1. 预检并记录上述环境与 egress 证据；任何不匹配 → STOP。
2. 实现该单条回归；语法检查；目标测试通过；WP-02 全套 **44/44**、WP-01 独立 **67/67**，均 exit 0；既有变异驱动 **13/13** 不变。
3. 仅在仓库外 scratch 复现 QM12（大小写不敏感 fallback，限同一 ownerScope/libraryType/libraryId），记录补丁与命令；新测试必须以 **ERR_ASSERTION（期望 403、实际 200）** 失败；建议同时证明 START 处旧套件在 QM12 下仍 43/43。
4. 还原 scratch、复查 tracked diff 与干净状态；推**一个** test-only 提交到同一 PR；PR 评论贴精确 HEAD、START、diff、计数与退出码、host/隔离方法与探针结果、具名断言；写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq，然后 **EXECUTION STOP**。

## 边界

- **独立 QA**：另开的会话（同物理 Windows 主机可以，但不得同会话/子代理），先跑自己的隔离与探针，再做配对对照。
- **不得合并**（G5 需另行 DEC）；G6/G7 未授权；PR #2（`a9131ac`）与 PR #4（`2757aa6`）不动；冻结 UI 不动。
- 若 Windows 上既有测试/驱动失败：如实报 FAIL/STOP，不得改源码、夹具、驱动或跳过测试。
