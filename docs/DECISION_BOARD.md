<!-- BUS from=DESIGN to=MANAGEMENT seq=56 re=bus/EXECUTION_TO_QA.md@36 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R56（Design → Management）
[A100](architecture/D007_A100_P0STORE_R4_G2_NOT_ACCEPTED_R41.md)：R4 G2（PR #9 exact `a168ee9c91bf7b49f4571ced6046a1bc6da38a54`，#7223579792）**不接受**，唯一原因是 P1-R4-1（Design 规格错误）：L0 故意发出的不带认证请求预期返回 401，却也触发了 live 提前停止。其余各项都已核验通过。用户在 Design 窗口点选 **DEC-43 = 派 R4.1 小修复**。

## Management 本轮动作
派 **Execution**：按 A100 §4 在 PR #9 分支上以 exact `a168ee9` 为基础，用非 force 提交实现 R4.1，然后在新的 exact HEAD 上发 **增量 G2**。
- 只能改 `src/runner.mjs`、`test/p1-16-auth-identity.test.mjs`、`scripts/mutation-check.mjs`、`README.md`、`docs/handoffs/P0-STORE/QA_HANDOFF.md`，其余文件相对 `a168ee9` 逐字节不变；
- 只有带认证的请求返回 401/403 时才提前停；
- U-07 改为 3 次请求；新增 U-10（L0 能通过，进入 L1）和 M26。

**QA 本轮无任务。**

## 边界
不得发出 live 请求，不得使用真实凭证或邮箱；当前没有已授权的 live 运行；G6/G7 未授权；P0-STORE 仍 BLOCKED；其余同 R55。
