<!-- BUS from=MANAGEMENT to=EXECUTION seq=62 re=DECISION_BOARD.md@59 status=OPEN updated=2026-11-27T18:52+01:00 -->
# Management → Execution（DEC-46=A：R4.1 沿用逐字节相同的上游证据）

## 1. 记录同步

- **Execution39**（`e37531d`，STOP）按 seq 61 第 1 步执行：主机确于 `18:34:48` 重启，
  冻结守卫的 PowerShell 清单查询 **本体 3738 ms**、`Measure-Command` **总耗时 4016 ms**；
  按“总耗时 ≥ 4 s”**立即停止**，未跑 (a)/(b)/(c)、无 audit/mutants、无 G2。**该严格读法是正确的**。
- Design 核实（A103 §2）：`git diff --stat 16f0cb0 6c59f35` **只改了 5 个文件**——
  `src/runner.mjs`、`test/p1-16-auth-identity.test.mjs`、`scripts/mutation-check.mjs`、`README.md`、
  `docs/handoffs/P0-STORE/QA_HANDOFF.md`。因此 **P1-13、WP-01…WP-04 全部上游包、冻结的 A62 守卫、
  `support/*` 在 `16f0cb0` 与 `6c59f35` 之间逐字节相同**。
- 在 `16f0cb0`、**有效** A59 区间 `16:28:30Z–16:39:19Z` 内已记录：suite **93/93（含 P1-13）**、
  上游 **67/44/103/91**、受保护 blob **94/94**。
- **DEC-46 = A**（用户在 Design 窗口选定）：**沿用**该上游证据。

## 2. 本轮任务（按 A103 §3）

### (1) 逐字节证明 + 沿用

- 用 `git diff --quiet 16f0cb0 <最终 HEAD> --` 分别覆盖：**P1-13 测试**、**`packages/` 中除 R4.1 允许文件外的一切**、
  **冻结守卫（A62 平台前置）**；三者都必须退出码 0。
- 在 G2 中明确声明：`16f0cb0` 的 **P1-13 结果与上游 67/44/103/91 结果沿用到最终 HEAD**，
  依据是上述逐字节相同 + R4.1 的 diff 未触及它们。

### (2) 当前运行证据（在**同一个新的** A59 区间内，最终 exact HEAD 上）

- **完整 suite 跑 1 次**，如实照原样记录；若失败，**只允许**是 P1-13 的**已知守卫超时特征**。
- **四个上游包各自直接**用 `--test-concurrency=1` 跑（**仅 CLI 标志，不改任何代码**），各自记录；
  这一项是**参考性健康检查**：出现守卫超时**记录下来但不阻断**。
- **P1-16 全部（U-01…U-10）**。
- **audit**。
- **mutants（含 M26）**。
- 每组前后 guard + probe；固定 Node v22.23.5 x64（完整路径、非提权）；
  任何探针不符即作废该区间，无效区间不得计入证据。

### (3) 交付

- 按 **A100 §4.8** 发**增量 G2**：diff 仅限允许列表、其余文件相对 `a168ee9` 的字节证明、
  完整 suite/上游/audit/mutant（含 M26）、U-07 与 U-10（**外加 P1-16 全量 U-01…U-10**）、
  A59 区间与守卫耗时实测值（3738 / 4016 ms 也一并记录）。
- 并记入限制 **LIM-P0S-2**：“冻结 A62 守卫的 PowerShell 查询在 A59 主机并发下对时序敏感；
  主机偏慢期间 P1-13 以**逐字节相同**方式沿用”。
- 然后整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **40**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@62`，含 PR 号、最终 exact SHA、G2 评论 ID、QA 计划路径
  （`D007_A100…` §4、`D007_A103…` §4）；只提交该文件，`bus(execution): seq 40`，**EXECUTION STOP**。

## 3. 边界（不变）

- 不改冻结文件；不得发出 live 请求；不得使用真实凭证或邮箱；**当前没有任何已授权的 live 运行**。
- G6/G7 未授权；P0-STORE 仍 **BLOCKED**；A70/A71 暂停；冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
- **QA 本轮无任务**；之后定向 G3 也适用**同样的沿用规则**。
