<!-- BUS from=MANAGEMENT to=EXECUTION seq=53 re=DECISION_BOARD.md@52 status=OPEN updated=2026-11-27T16:38+01:00 -->
# Management → Execution（DEC-41 记录：一次真实运行由用户本人执行；各窗口无派单）

## 1. 记录同步（用户在 Design 窗口作出的决定）

- **R51 / A98**：P0-STORE R3 **G3 VERIFIED / G4 PASS_LOCAL** at exact
  `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`（QA23 `#7222172332`）；状态 **ACCESS02_REQUEST_READY**；
  第 3 阶段运行手册 `docs/handoffs/P0-STORE/PHASE3_RUNBOOK.md` 已发布（运行人 = 用户本人）。
- **DEC-41 = “批准，我来运行”**（R52，`re=USER_DIRECT@DEC-41`）：
  **一次性**真实运行授权，审批号 **`P0STORE-ACCESS-02-20261127-6a59ce9`**，
  仅对 exact `6a59ce9…`、`dav.jianguoyun.com:443`、`/dav/LMS-P0STORE/<运行时 runId>/` 有效，**仅一次**，
  **运行人 = 用户本人**，按 `PHASE3_RUNBOOK.md` 在 A59 Windows 机器、非提权 PowerShell、完整路径的 Node v22.23.5 x64 执行。

## 2. 本轮各窗口动作（重要边界）

- **Management**：仅记录与转发，**不运行 live 命令、不接触凭证、不改 PR #9**。
- **Execution**：**本轮无任务**。若被唤醒，只回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@53`
  并注明“DEC-41 由用户本人执行、Execution 未参与”，随后 STOP。
  **不得**运行 live 命令、不得设置/读取任何真实凭证、不得修改 PR #9 或任何候选文件。
- **QA**：**本轮无任务**；不得运行 live 命令或接触凭证。
- 用户运行并回报之后，Design 会另发“附加脱敏 trace + 独立 QA 离线复核”任务单；届时才由 Management 派发。

## 3. 必须遵守的运行纪律（供各窗口据以拒绝越界）

- **不重试、不二次运行**；审批号一次性，只对上述 exact SHA。
- 除这一次外 **G6 未授权**；**G7 未授权**；P0-STORE 结论**待定**（不预判 GO/PARTIAL/INCONCLUSIVE/NO-GO）。
- 运行产物 `p0store-live-trace.jsonl` 与 `p0store-live-console.txt` 在被确认**不含密码**之前不得提交、不得粘贴进任何窗口或 PR。
- 运行后按手册 U6 立即**吊销**应用密码，并在坚果云 Web UI 检查 `/LMS-P0STORE/` 是否已清空。
- 任何 SHA / Node 版本 / 哈希不符、PowerShell 提权、出现非 `dav.jianguoyun.com` 的主机、证书告警、
  或运行超过约 10 分钟 → **中止并告知 Design**，不得自行重试。

## 4. 不变量

A70/A71 暂停；冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN 且本阶段不得修改；
仓库内不得出现任何真实凭证、真实用户数据或未脱敏 trace。
