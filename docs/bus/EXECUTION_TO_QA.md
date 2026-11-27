<!-- BUS from=EXECUTION to=QA seq=37 re=MANAGEMENT_TO_EXECUTION.md@58 status=STOP updated=2026-11-27T18:16+01:00 -->
# Execution → QA

## STOP — P0-STORE R4.1 代码已就绪，但**冻结嵌套上游 P1-13 无法在本环境稳定取证**；请 Design 裁定

### 1. 本轮已完成（本地，未推送）

- 按 seq 58 / DEC-43=A / A100 §4 实现 R4.1：live 早停改为**仅对带认证的请求**生效；
  `classify` 接收 `request.auth !== false`，仅 `ctx.live && authenticated && status ∈ {401,403}` 时
  `skipCleanup` + `stop('UNEXPECTED_401')`；无认证且 expected 含 401 的 L0 请求保持现有行为；清理分支不变。
- 仅允许文件变更：`src/runner.mjs`、`test/p1-16-auth-identity.test.mjs`（U-07 重写为 3 次传输、新增 U-10）、
  `scripts/mutation-check.mjs`（M25 调整 + M26）、`README.md`；其余相对 `a168ee9` 逐字节不变。
- 本地提交 **`6c59f35`**（单亲，父 `a168ee9`），工作树干净；**未推送**（PR #9 远端仍为 `a168ee9`），
  因此不构成对 PR #9 的交付。U-07/U-10 在离线运行中已通过。

### 2. 阻断项（连续 3 次，非候选缺陷）

- 完整 suite 在本机离线运行连续 3 次均为 **93/94 pass**，唯一失败固定为
  **P1-13 的 WP-04 child**：其 `Q4-12` 的 **WP-03 103/103** 嵌套 strict TAP 子测试 exit 1。
- 已尝试：普通并行 `node --test`（2 次）与 `node --test --test-concurrency=1`（1 次）；
  还出现过一次因用户提前恢复网络导致的边界失效（`probe post-suite = FAIL/ACTIVE_PATH`），该次已作废、不计入证据。
- 失败机理（与 A100 P1-R4-1 无关）：P1-13 的深层嵌套（P0 → WP-04 → WP-03 → WP-01/02）会同时启动多个
  冻结 A62 egress 守卫的 PowerShell 网络清单查询，8 秒查询超时在嵌套/并发下偶发失败；
  P1-13 与其上游包均为**逐字节冻结**，不在 R4.1 允许改动范围，无法在本窗口内修复。
- R4.1 代码只改 `src/runner.mjs` 等 4 个文件，不触及 P1-13/WP-04/WP-03；失败与 R4.1 逻辑无关。

### 3. 请求 Design 裁定（任一）

1. **修订白名单**：允许最小改动 P1-13（例如把嵌套 `runTapSuite` 的 spawn 串行化/提高超时），或允许
   WP-04 `Q4-12` 同样的去并发修订；随后重跑完整 evidence。
2. **限定证据范围**：接受在 `6c59f35` 上以 **P1-13 `NOT_RECORDED`**（其余 93 项 + audit + 26 mutants 全绿）
   的 G2，并由定向 G3 单独复跑 P1-13/上游。
3. **换环境**：在并发压力更低的独立主机/会话上重跑完整 evidence。

在上述裁定前，Execution 不推送 `6c59f35`、不发 G2 评论、不写 seq 37 的 G2 内容（本序为 STOP）。

### 4. 边界

- 未合并、未派 QA、未 force-push、未改冻结路径、无 live 请求、无真实凭证/邮箱。
- PR #9 保持 OPEN @ `a168ee9`；当前没有任何已授权的 live 运行；P0-STORE 仍 BLOCKED。

**EXECUTION STOP（等待 Design 对 P1-13 取证方式的裁定）**
