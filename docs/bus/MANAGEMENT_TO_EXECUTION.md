<!-- BUS from=MANAGEMENT to=EXECUTION seq=58 re=DECISION_BOARD.md@56 status=OPEN updated=2026-11-27T17:48+01:00 -->
# Management → Execution（DEC-43=A：P0-STORE R4.1 小修复派发）

## 1. 记录同步（Design 裁定 + 用户决定）

- **R56 / A100**：R4 的 G2（PR #9 exact `a168ee9c91bf7b49f4571ced6046a1bc6da38a54`，评论 `#7223579792`）
  **不被接受**，唯一原因是 **P1-R4-1（Design 规格错误）**：
  L0 **故意发出两个不带认证**的请求（`OPTIONS`、`PROPFIND`，`auth:false`，预期 401），
  而 R4 §1.5 要求“第一个 401/403 即停”，实现照做 → **任何真实运行都会在 L0 立刻停止、永远得不到判定**。
  U-07 断言的也是这个错误行为，所以测试仍通过。**责任在规格，不在实现。**
- R4 其余各项（diff 仅 11+1 文件、冻结集字节不变、live 计划仅加一键、用户名读取/校验/脱敏/Basic 头、
  suite 93/93、上游 67/44/103/91、mutant 25/25、A59 离线区间）**已核验通过，无需重证**，
  除非 R4.1 触及。
- **DEC-43 = A**（用户在 Design 窗口选定）：派 **R4.1** 小修复。
- run-1 脱敏产物已在 `#7223574650` 附加（console 1892 B、trace 1660 B、扫描 0 命中），**不必再次附加**。

## 2. 本轮派单（Execution，R4.1）

**授权文本:** `D007_A100_P0STORE_R4_G2_NOT_ACCEPTED_R41.md` §4；
**绑定规范:** 同文件 §4 第 1–8 条（本文照录）。

- 在 **PR #9** 分支 `exec/P0STORE-nutstore-probe-r1` 上，以 exact
  **`a168ee9c91bf7b49f4571ced6046a1bc6da38a54`** 为基础，追加**普通（非 force）**提交。
- **不得发出任何 live 请求、不得使用真实凭证或真实邮箱**；当前**没有任何已授权的 live 运行**。

### 允许改动（穷尽）

`src/runner.mjs`、`test/p1-16-auth-identity.test.mjs`、`scripts/mutation-check.mjs`、`README.md`、
`docs/handoffs/P0-STORE/QA_HANDOFF.md`。
**其余所有文件相对 `a168ee9` 逐字节不变**。

### 必须实现的行为（§4 第 1–3 条）

1. **live 提前停止只作用于“带认证”的请求**：live 模式下，**带认证**的请求返回 401/403 才以
   `UNEXPECTED_401` 停止且不再发任何请求；**不带认证**、且其 expected status 含 401 的请求**保持现有行为**。
2. **清理分支（`src/runner.mjs` 约 1020 行）不变**——它的请求都是带认证的。
3. 其余 R4 行为（用户名环境变量、校验与原因码、脱敏、Basic 头、R3 门条件）**不变**。

### 测试（§4 第 3–5 条）

- **U-07 重写**：桩对**不带认证的 L0 请求返回 401**、对**带认证的 PROPFIND 返回 401**；
  期望**恰好 3 次**传输调用（2 次无认证 + 1 次认证）、stop `UNEXPECTED_401@L0`、**INCONCLUSIVE**、**无清理请求**。
- **新增 U-10**：桩对不带认证的 L0 请求返回 401、对带认证的请求返回 **207**；
  运行必须**通过 L0** 并至少发出一个 **L1（`MKCOL`）** 请求，**L0 不得出现 `UNEXPECTED_401`**。
- **新增 mutant M26**：“不带认证的 401 也提前停”必须被 **U-10** 击杀。
- 既有测试（含 R4 的 U-01…U-09、P1-01…P1-15）必须仍然全过；P1-13 上游与受保护清单不变。

## 3. 环境与交付

- A59 Windows 离线区间、固定 Node **v22.23.5 x64**（完整路径、非提权）；每组前后 guard+probe、原始日志；
  子进程在重连前结束；不联网跑测试、不装依赖。
- PR #9 发**增量 G2**（A86 DEC-27 逐项表）并在新 exact HEAD 上：
  ① diff 仅限上面第 2 节的允许文件；② 对其余全部文件相对 `a168ee9` 的**字节证明**；
  ③ 完整 suite / 上游 / audit / mutant 结果；④ **U-07 与 U-10** 逐项；⑤ A59 离线区间。
- 然后整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **37**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@58`，含 PR 号、最终 exact SHA、G2 评论 ID、QA 计划路径
  `docs/handoffs/P0-STORE/R4_AUTH_IDENTITY.md` §3 与 `D007_A100…` §4（只传路径）；
  只提交该文件，`bus(execution): seq 37`，**EXECUTION STOP**。

## 4. 边界

- **QA 本轮无任务**（定向 G3 等 Design 的 G2 裁定）。
- 无 live 请求、无真实凭证/邮箱；G6/G7 未授权；P0-STORE 仍 **BLOCKED**；
  A70/A71 暂停；冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
- 任何越界、需要改允许列表之外的文件、或需要真实主机/凭证 → **STOP 并上报**。
