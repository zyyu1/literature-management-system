<!-- BUS from=MANAGEMENT to=EXECUTION seq=54 re=DECISION_BOARD.md@52 status=OPEN updated=2026-11-27T16:46+01:00 -->
# Management → Execution（事故记录：DEC-41 首次尝试未启动；运行手册命令缺陷）

## 1. 事实（来自用户 PowerShell 窗口的原始报错）

- 用户按 `PHASE3_RUNBOOK.md` §2 粘贴命令块时，**命令未被正确执行**：
  1. `"exit=$code"$s = Read-Host ...` 被合并成一行 → `ParserError: UnexpectedToken`；
  2. 因 `$s` 未赋值，`[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)` 抛
     `ArgumentNullException: 值不能为 null`；
  3. `& $node src/runner.mjs ...` → `BadExpression`（该窗口内 **`$node` 未定义**，为空），
     **runner 从未启动**；
  4. `Remove-Item Env:P0STORE_WEBDAV_PASSWORD` → 路径不存在（环境变量从未建立）。
- 结论：**未产生任何网络请求、未设置任何凭证、无 trace/console 产物、审批号
  `P0STORE-ACCESS-02-20261127-6a59ce9` 未被消耗**。这不是一次“运行”，只是一次命令粘贴失败。

## 2. 运行手册缺陷（需 Design 修正）

- `docs/handoffs/P0-STORE/PHASE3_RUNBOOK.md` §2 使用
  `[Runtime.InteropServices.Marshal]::PtrToStringAuth(...)`——**该方法在 .NET 的 `Marshal` 上不存在**
  （正确的是 `PtrToStringBSTR`，并应配 `ZeroFreeBSTR` 释放）；即使 `$s` 有值也会失败。
- 同节命令块依赖**先前同一窗口内定义的 `$node` 变量**，手册未提醒“必须在同一窗口、同一目录、逐行执行”；
  粘贴为整块时容易与上一行合并。
- 请 Design 在下一轮以**新的设计修订**（如 R4 文档修正或 A98 附录）发布更正后的运行手册；
  Management 不得修改 `main` 上的设计文档。

## 3. 用户侧的重试口径（Management 已告知，未派任何窗口执行）

- 同一审批号、同一 exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`、同一一次性运行；
  **不计为第二次运行**（第一次从未启动）。
- 更正要点：先在同一窗口定义 `$node`（完整路径）并校验 `-v`/`process.arch`/SHA-256；
  进入 `packages\p0store-nutstore-probe`；用 `PtrToStringBSTR` + `ZeroFreeBSTR`；
  **逐行**执行，不要整块粘贴；其余参数与 §2 一致。

## 4. 边界（不变）

- 仍然**只有这一次**真实运行；除它之外 G6 未授权，G7 未授权；不重试、不二次运行。
- Management / Execution / QA 均**不运行 live 命令、不接触凭证、不改 PR #9**。
- 若再次失败：先停、把原始报错交给 Design，不得自行修改 runner 或放宽任何检查。
