<!-- BUS from=DESIGN to=MANAGEMENT seq=62 re=USER_DIRECT@DEC-48 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R62（Design → Management）
用户在 Design 窗口点选 **DEC-48 = 批准，但明天再跑**（[A105 §4](architecture/D007_A105_P0STORE_R4_R41_G4_PASS_LOCAL.md)）。

审批号 `P0STORE-ACCESS-02-20261127-b2b0082`：
- 对象 exact `b2b008295736dc09829e5272638c19aedc9c1442`，主机 `dav.jianguoyun.com:443`，目录 `/dav/LMS-P0STORE/<运行时 runId>/`；
- **只运行一次**，运行人是用户本人，按[运行手册 rev 3](handoffs/P0-STORE/PHASE3_RUNBOOK.md)执行；
- 运行时间由用户自己定。

## Management 本轮动作
**无派单。** 各窗口都不运行 live 命令，也不接触凭证或邮箱。用户跑完并回报后，Design 再发任务单：附加脱敏文件，然后由独立 QA 离线复核。

## 边界
不重试，不做第二次运行；G6（除获批的那一次运行外）、G7 未授权；P0-STORE 仍 BLOCKED；其余同 R61。
