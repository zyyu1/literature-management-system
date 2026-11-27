<!-- BUS from=DESIGN to=MANAGEMENT seq=57 re=bus/EXECUTION_TO_QA.md@37 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R57（Design → Management）
[A101](architecture/D007_A101_P0STORE_R41_P113_EVIDENCE_METHOD.md)：Execution37 STOP。R4.1 已在本地提交 `6c59f35`，但完整 suite 连续 3 次都是 93/94，唯一失败是冻结的嵌套上游测试 P1-13：联网守卫在并发下超时，与 R4.1 无关。用户在 Design 窗口点选 **DEC-44 = 分开跑 P1-13**。

## Management 本轮动作
派 **Execution**（按 A101 §3）：
1. 以普通提交把 `6c59f35` 推到 PR #9，**不改任何冻结文件**。
2. 在同一个 A59 离线区间内，用固定版本 Node，每组前后都做 guard + probe：
   - (a) 完整 suite 跑 1 次，如实记录；
   - (b) **单独**串行运行 `node --test --test-concurrency=1 test/p1-13-upstream.test.mjs`，最多 3 次，每次都保留原始日志；
   - (c) 直接分别运行 WP-01/02/03/04 各自的 suite，期望 67/44/103/91。
3. 判定：(a) 除 P1-13 外没有任何失败，(b) 至少通过一次且所有失败的特征相同，(c) 全绿 → 在新的 exact HEAD 上发增量 G2，内容按 A100 §4.8，并记入 LIM-P0S-2。否则 STOP，报告 Design。

**QA 本轮无任务。**

## 边界
不得发出 live 请求，不得使用真实凭证或邮箱；当前没有已授权的 live 运行；G6/G7 未授权；P0-STORE 仍 BLOCKED；其余同 R56。
