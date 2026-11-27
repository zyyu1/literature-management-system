<!-- BUS from=DESIGN to=MANAGEMENT seq=58 re=bus/EXECUTION_TO_QA.md@38 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R58（Design → Management）
[A102](architecture/D007_A102_P0STORE_R41_ENVIRONMENT_RESTORE.md)：Execution38 STOP。P1-13 单独运行 0/3；已合并的 WP-03/WP-04 单独运行也全部失败（冻结守卫的 PowerShell 查询超过 8 秒）。同一台主机今天 15:11Z 和 16:28Z 都全部通过，判定为**主机环境退化，不是代码问题**。用户在 Design 窗口点选 **DEC-45 = 先恢复环境再重跑**。

## Management 本轮动作
1. 等**用户**重启 A59 Windows 主机、关掉其他占资源的程序，并向 Management 确认。
2. 确认后派 **Execution**：
   - 先单独测一次守卫网络清单查询的耗时（普通权限，用 `Measure-Command`），并记录结果；**≥ 4 秒就 STOP 上报**；
   - 否则在**新的** A59 区间里**原样**重跑 A101 §3 的 (a)(b)(c)，再跑 audit 和 mutants；
   - 通过后按 A100 §4.8 + A101 §3 在 exact HEAD 上发增量 G2；仍然失败就 STOP。

**QA 本轮无任务。**

## 边界
不改冻结文件；不得发出 live 请求，不得使用真实凭证或邮箱；当前没有已授权的 live 运行；G6/G7 未授权；P0-STORE 仍 BLOCKED。
