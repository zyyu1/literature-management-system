<!-- BUS from=MANAGEMENT to=EXECUTION seq=57 re=DECISION_BOARD.md@55 status=OPEN updated=2026-11-27T17:10+01:00 -->
# Management → Execution（DEC-42=A：P0-STORE R4 认证身份修复派发；并附 run-1 脱敏产物）

## 1. 记录同步

- **R54 / A99**：DEC-41 的第 1 次真实运行结果 **INCONCLUSIVE**、`stop=UNEXPECTED_401@L0`、
  3/100 请求、`bytesSent=0`；Design 判定为**探针的认证身份缺陷**（只发密码、没有用户名）。
- **DEC-42 = A**（用户在 Design 窗口选定）：**做 R4 修复**。
- 该次授权已用尽：**当前没有任何已授权的 live 运行**。

## 2. 本轮派单（Execution，R4）

**授权文本:** `D007_A99_P0STORE_LIVE_RUN1_INCONCLUSIVE_PROBE_AUTH_DEFECT.md` §5；
**绑定规范:** `docs/handoffs/P0-STORE/R4_AUTH_IDENTITY.md`（全文为准）。

- **同一分支** `exec/P0STORE-nutstore-probe-r1`（PR #9，保持 OPEN），基于 exact
  **`6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`** 追加**普通（非 force）**提交。
- **不得发出任何 live 请求、不得使用真实凭证或真实邮箱**；测试一律用 `probe-user@example.invalid` 之类的合成值。

### 允许改动（穷尽列表，§2）

`src/secret.mjs`、`src/plan.mjs`、`src/runner.mjs`、`src/trace.mjs`（仅当脱敏确需）、
`plans/live-nutstore-plan.json`（**只加一个键**）、`README.md`、`scripts/verify-candidate-scope.mjs`、
`scripts/mutation-check.mjs`，以及测试 `test/p1-01-plan-loader`、`p1-05-secret`、`p1-10-stop`、
`p1-12-live-inert`、`p1-15-live-gating`；可新增 `test/p1-16-auth-identity.test.mjs`。
**其他任何文件需要先取得 Design 修订**。

**逐字节冻结**：`support/*`、`plans/example-plan.json`、`src/gate.mjs`、`src/oracle.mjs`、`src/verdict.mjs`、
`test/p1-02…04, 06…09, 11, 13, 14`。

### 必须实现的行为（§1，六条）

1. **用户名只在 live 模式从运行时环境读取**：live 计划必须携带 `credentialUserEnvVar: "P0STORE_WEBDAV_USER"`；
   local/mock 计划可省略该键并沿用固定合成用户 `probe`（以便冻结的 `support/harness.mjs` 与
   `plans/example-plan.json` 保持逐字节不变）；封闭 schema 只接受这一个新键；
   **缺该键的 live 计划**在加载阶段以 `PLAN_REJECTED` 拒绝。
2. **任何 secret 读取或传输之前完成校验**：值须 3–254 字符、匹配 `^[^\s:@]+@[^\s:@]+\.[^\s:@]+$`、
   无控制字符、无 `:`。失败码：`CREDENTIAL_USER_MISSING`（未设/空）或 `CREDENTIAL_USER_MALFORMED`；
   两种失败都**零传输调用、trace 为空**；该检查插在 R3 门序中**紧邻密码检查之前**。
3. **脱敏**：用户名属个人数据，按机密处理——`Secret.contains` / `redact` 覆盖明文用户名、明文 `user:password`、
   其 base64 形式与 Basic 头；trace、console、预检摘要、错误与 `result` 中**都不得出现**用户名；
   预检只打印 `user=<redacted, N chars>`。
4. **请求头**：live 模式用 `Basic base64(<user>:<password>)`；local/mock 行为不变。
5. **认证失败早停**：live 模式下**第一个** 401 或 403 立即结束运行，沿用既有规则 `UNEXPECTED_401`
   （若已有 `UNEXPECTED_403` 则用之，否则仍用 `UNEXPECTED_401`）；**不再发任何请求，连清理也不发**（因为什么都没创建）；
   判定按 R2 规则仍为 **INCONCLUSIVE**；不引入新规则名。其他步骤的 mock 401 行为除非测试另有说明，保持不变。
6. R3 的其他部分（7 个门条件、固定主机、审批号正则、runId、Node pin、预算）**全部不变**。

### 测试（§3）：既有 85 项必须仍全过，另加

- **U-01** live 计划缺 `credentialUserEnvVar` → 拒绝；
- **U-02/U-03/U-04** 用户环境变量缺失/为空 → `CREDENTIAL_USER_MISSING`；畸形（含 `:`、空格、无 `@`、>254 字符）
  → `CREDENTIAL_USER_MALFORMED`；各例**零传输、trace 为空、且毒化密码环境变量从未被读取**；
- **U-05** 全条件满足 + 桩传输：Authorization 头解码后**精确**等于 `probe-user@example.invalid:<合成密码>`；
- **U-06** canary 用户名与密码在 trace/console/预检/result/error 中（明文、`user:pass`、base64 三种形式）**均不出现**；
- **U-07** 桩在首个请求返回 401 → **恰好 1 次传输调用**、verdict `INCONCLUSIVE`、stop `UNEXPECTED_401@L0`；
- **U-08** local/mock 仍用 `probe`，与冻结 harness 一致；
- **U-09** ≥3 个新具名 mutant（硬编码用户名；用户名不脱敏；401 不早停）全部被预期断言击杀。

## 3. run-1 脱敏产物（§4.2）

- 文件（本机，用户已确认不含机密）：`C:\lms-p0store-live\p0store-live-trace.jsonl`（1660 B，7 行）、
  `C:\lms-p0store-live\p0store-live-console.txt`（1892 B）。
- **附加前必须你自己重新扫描**：任何密码、邮箱地址或 `Authorization` 命中 → **不得附加**，直接报告 Design。
- 通过扫描后，把它们附到 PR #9（一条评论或附件），并在 G2 里说明扫描方式与结果。
- 注意：Management 此前只做关键词扫描（`Authorization|Basic |password|PASSWORD=|secret` 零命中）；
  你仍需独立复核，并确认 console 中 `runId`/`approvalId` 属可公开的合成标识。

## 4. 交付

- PR #9 发**首轮逐项 G2**（A86 DEC-27）：提交清单与 diff 仅限 §2；相对 `6a59ce9` 的**冻结文件字节证明**；
  语法 / suite / 上游 / audit 结果；**U-01…U-09** 逐项；
  **A59 Windows 离线区间**与固定 Node v22.23.5 x64。
- 然后整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **36**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@57`，含 PR 号、最终 exact SHA、G2 评论 ID、QA 计划路径
  `docs/handoffs/P0-STORE/R4_AUTH_IDENTITY.md` §3（只传路径）；只提交该文件，`bus(execution): seq 36`，**EXECUTION STOP**。

## 5. 边界

- **QA 本轮无任务**（定向 G3 等 Design 的 G2 裁定）。Execution 不得运行 live 命令、不得修改 PR #9 以外任何东西。
- **当前没有任何已授权的 live 运行**；下一次真实运行只能在 **G4 之后**、由 Design 发 runbook rev 3
  （多一行掩码输入用户名）**并且**用户给**新 DEC + 新审批号**之后进行。
- G6（除已用尽的那一次）/G7 未授权；P0-STORE 结论待定；A70/A71 暂停；冻结 UI、PR #2/#4 不动。
- 任何越界、需要真实主机/凭证/邮箱、或需改冻结文件 → **STOP 并上报**。
