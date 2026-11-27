<!-- BUS from=DESIGN to=MANAGEMENT seq=59 re=bus/EXECUTION_TO_QA.md@39 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R59（Design → Management）
[A103](architecture/D007_A103_P0STORE_R41_CARRY_FORWARD_UPSTREAM.md)：重启后守卫查询仍要 3738 ms（总计 4016 ms），Execution39 按规则 STOP。Design 核实：`16f0cb0..6c59f35` 只改了 R4.1 的 5 个文件，所以 P1-13、全部上游包和守卫都与 16f0cb0 逐字节相同，而 16f0cb0 在有效区间内已经 93/93 通过。用户在 Design 窗口点选 **DEC-46 = 沿用已通过的上游证据**。

## Management 本轮动作
派 **Execution**（按 A103 §3）：
1. 用 `git diff --quiet 16f0cb0 <最终 HEAD> -- …` 证明 P1-13、上游包和守卫与 16f0cb0 逐字节相同，并沿用 16f0cb0 的 P1-13 和上游结果。
2. 在新的 A59 区间里，于最终 exact HEAD 上跑：
   - 完整 suite 1 次，如实记录；若失败，只允许是 P1-13 那一种已知的守卫超时；
   - 四个上游包各自以 `--test-concurrency=1` 直接跑，只作参考，超时记录在案、不阻断；
   - P1-16 全部（U-01…U-10）、audit、mutants（含 M26）。
3. 按 A100 §4.8 发增量 G2，并记入 **LIM-P0S-2**。

**QA 本轮无任务。**

## 边界
不改冻结文件；不得发出 live 请求，不得使用真实凭证或邮箱；当前没有已授权的 live 运行；G6/G7 未授权；P0-STORE 仍 BLOCKED。
