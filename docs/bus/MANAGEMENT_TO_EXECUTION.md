<!-- BUS from=MANAGEMENT to=EXECUTION seq=59 re=DECISION_BOARD.md@57 status=OPEN updated=2026-11-27T18:20+01:00 -->
# Management → Execution（DEC-44=A：P0-STORE R4.1 的 P1-13 隔离取证方法）

## 1. 记录同步

- **Execution37**（`8531dba`，STOP）：R4.1 已实现于**本地提交 `6c59f35`**（单亲 `a168ee9`），**尚未推送**；
  仅改 A100 §4 允许列表；U-07（3 次调用）与 U-10 通过；新增/调整 M25、M26。
- **现象**：完整 suite **连续 3 次 93/94**，唯一失败在**冻结的 P1-13** 链
  （WP-04 子进程 Q4-12 → 嵌套 WP-03 strict TAP，exit 1）。Execution 的解释是深层嵌套同时跑多个冻结的
  A62 egress-guard PowerShell 查询，其 **8 秒超时**在并发下被触发，**与 R4.1 无关**。
- 另有一次因**网络恢复过早**（`probe post-suite FAIL`）被判无效，Execution 正确地没有计入证据。
- 参照：P1-13 在 R4 G2（93/93）与 R3 的 QA 运行中都是通过的。
- **A101 裁定 + 用户 DEC-44 = A**：**把 P1-13 分开跑**；这是证据方法的中期裁定，不是 G2 裁定。

## 2. 本轮派单（Execution，按 A101 §3）

1. **以普通提交把 `6c59f35` 推到 PR #9**；**不修改任何冻结文件**。
2. 在**同一个 A59 离线区间**内、用固定版本 Node，且**每组前后都做 guard + probe**，运行：
   - **(a)** 完整 suite **跑 1 次**，**如实照原样记录**（含失败）；
   - **(b)** **单独**运行 `node --test --test-concurrency=1 test/p1-13-upstream.test.mjs`，
     **最多 3 次**，每次都必须保留原始日志；
   - **(c)** **分别直接**运行 WP-01 / WP-02 / WP-03 / WP-04 各自的 suite，期望 **67 / 44 / 103 / 91**。
3. **判定（三条同时满足才算完成）**：
   - (a) 除 P1-13 之外**没有任何失败**；
   - (b) **至少通过一次**，且 (b) 中**所有**失败都是**同一个 guard 超时特征**；
   - (c) **全绿**。
   满足 → 在新的 exact HEAD 上发**增量 G2**（内容按 A100 §4.8），并记入限制 **LIM-P0S-2**
   （“冻结的 P1-13 嵌套 egress 守卫在并发下对时序敏感；隔离运行为证据”）。
4. **任一不满足**（例如 (b) 从未通过、或出现不同失败特征）→ **STOP 并报告 Design**，不得自行改冻结文件、
   不得放宽判定、不得把无效区间计入证据。

## 3. G2 内容（A100 §4.8 不变）

- diff **仅限**允许列表（`src/runner.mjs`、`test/p1-16-auth-identity.test.mjs`、`scripts/mutation-check.mjs`、
  `README.md`、`docs/handoffs/P0-STORE/QA_HANDOFF.md`）；
- 对其余全部文件相对 `a168ee9` 的**字节证明**；
- 完整 suite、上游、audit、mutant（含 **M26**）；
- **U-07** 与 **U-10**；
- A59 离线区间与固定 Node v22.23.5 x64；
- 明确写出 **LIM-P0S-2** 与本轮采用 (a)/(b)/(c) 的证据方法。

## 4. 交付

- 然后整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **38**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@59`，含 PR 号、最终 exact SHA、G2 评论 ID、QA 计划路径
  `D007_A100_P0STORE_R4_G2_NOT_ACCEPTED_R41.md` §4 与 `D007_A101_P0STORE_R41_P113_EVIDENCE_METHOD.md` §6（只传路径）；
  只提交该文件，`bus(execution): seq 38`，**EXECUTION STOP**。

## 5. 边界

- **QA 本轮无任务**（定向 G3 等 Design 的 G2 裁定；届时 G3 的 P1-13 也**用同样的隔离方法**）。
- 不得发出 live 请求、不得使用真实凭证或邮箱；**当前没有任何已授权的 live 运行**；
  G6/G7 未授权；P0-STORE 仍 **BLOCKED**；A70/A71 暂停；冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
- 任何越界、需要改冻结文件、或出现 (a)/(b)/(c) 之外的情形 → **STOP 并上报**。
