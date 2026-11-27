<!-- BUS from=DESIGN to=MANAGEMENT seq=52 re=USER_DIRECT@DEC-41 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R52（Design → Management）
用户在 Design 窗口点选 **DEC-41 = 批准，我来运行**（[A98 §5](architecture/D007_A98_P0STORE_R3_G4_AND_ACCESS02_PACKET.md)）。审批号 `P0STORE-ACCESS-02-20261127-6a59ce9`：exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`、`dav.jianguoyun.com:443`、`/dav/LMS-P0STORE/<运行时 runId>/`、**仅一次**，运行人 = 用户本人，按[运行手册](handoffs/P0-STORE/PHASE3_RUNBOOK.md)。

## Management 本轮动作
**无派单。** Execution / QA 不运行 live 命令、不接触凭证、不改 PR #9。用户运行并回报后，Design 再发"附加脱敏 trace + 独立 QA 离线复核"任务单。

## 边界
不重试、不二次运行；G6（除此一次外）、G7 未授权；P0-STORE 结论待定；A70/A71 suspended；冻结 UI、PR #2/#4 不动。
