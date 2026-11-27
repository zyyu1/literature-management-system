<!-- BUS from=MANAGEMENT to=EXECUTION seq=63 re=DECISION_BOARD.md@60 status=OPEN updated=2026-11-27T19:06+01:00 -->
# Management → Execution（DEC-47=A：释放 P0-STORE R4+R4.1 定向独立 G3 给 QA）

## 1. 记录同步

- **Execution40**（`5d9c650`）与 PR #9 的增量 G2 `#7225015533`，exact HEAD
  **`b2b008295736dc09829e5272638c19aedc9c1442`**（单亲 `6c59f35`，只加 `QA_HANDOFF.md`）。
- Design 复核：`a168ee9..6c59f35` 只改 4 个文件（runner / p1-16 / mutation-check / README），
  **正是 A100 §4 的允许列表**；`6c59f35..b2b0082` 只改 `QA_HANDOFF.md`；
  runner 的 live 早停确实以 `authenticated === true`（`request.auth !== false`）为门槛。
- 报告（同一有效 A59 区间、16/16 探针）：完整 suite **94/94**（此次 P1-13 在套件内为绿）、
  上游直跑并发 1 → **67/44/103/91**、**P1-16 9/9**（U-07 = 3 次调用 `[false,false,true]` → `UNEXPECTED_401@L0`；
  U-10 通过 L0 进入 L1 `MKCOL`）、audit 275/32/94/307、mutants **26/26**（M26 被 U-10 击杀）、
  对照 `16f0cb0` 的传递字节证明全部 exit 0。
- **DEC-47 = A**（用户在 Design 窗口选定）：**放行定向独立 G3**。

## 2. 本轮派单（独立 QA，按 A104 §4）

- 对象：PR **#9**，**exact HEAD `b2b008295736dc09829e5272638c19aedc9c1442`**。
- **首次且唯一** `git ls-remote <repo> refs/pull/9/head` 必须 `exit 0` 且等于该 SHA，否则 STOP（落盘命令/时间/stdout/stderr）。
- A59 离线区间；固定 Node **v22.23.5 x64**（完整路径、非提权）；**每组前后 guard + probe**。

### 必做内容

1. **完整 suite 至少 1 次**。
2. **P1-13 与上游沿用 A103 传递规则**：QA **自己做**字节证明（对照 `16f0cb0`，覆盖 P1-13、
   `packages/` 去掉 R4.1 的 4 个文件、冻结守卫、`support/`），并**直接用 `--test-concurrency=1`** 跑上游；
   P1-13 若**仅**因守卫超时失败，记录但**不阻断**（前提是字节证明成立）。
3. **QA 自写认证身份矩阵**（QA 自己的桩传输、仅合成值 `*@example.invalid`；每次拒绝都要证明
   **零传输、trace 为空、毒化密码环境变量未被读取**）：
   用户变量缺失 → `CREDENTIAL_USER_MISSING`；用户变量为空 → 同上；
   含 `:`、空格、无 `@`、控制字符、255 字符 → `CREDENTIAL_USER_MALFORMED`；
   live 计划缺 `credentialUserEnvVar` → `PLAN_REJECTED`。
4. **QA 自写早停矩阵**：(i) 无认证 401 + 认证 401 → **恰好 3 次**调用、`UNEXPECTED_401@L0`；
   (ii) 无认证 401 + 认证 207 → **能到 L1**；(iii) 无认证 401 + 认证 403 → 3 次调用并停止；
   (iv) mock/local 模式的 401 行为与 R3 一致。
5. **Canary 与 Authorization**：canary 用户名与密码在 trace / console / 预检 / result / 错误中
   （明文、`user:pass`、base64 三种形式）**均不得出现**；桩观察到的头**精确解码**为 `<user>:<password>`；
   local/mock 仍用 `probe`。
6. **字节证明**：全部冻结文件对照 **`6a59ce9` 与 `a168ee9`**；live 计划相对 `6a59ce9` **只差那一个键**；
   R3 的三个门负例（错误主机、审批缺失、Node 不符）**仍然被拒**。
7. **audit 正例 + 计数中性负例**（A88 规则）；committed mutants **26/26** + **≥3 个 QA 自写 mutant**。
8. 交付：PR #9 发**逐项 G3**（A86 DEC-27 表：每行 PASS 附输入/断言/退出码，或 FAIL/NOT_RUN/NOT_RECORDED）；
   然后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **24**（或 latest+1），
   header `re=MANAGEMENT_TO_EXECUTION.md@63`，含 PR / exact SHA / QA 评论 ID / verdict / 关键数字 / P0-P2；
   只提交该文件，`bus(qa): seq 24`，**QA STOP**。

## 3. 边界

- **Execution 本轮无任务**：若被唤醒，只回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@63`
  并注明“本轮为独立 QA 的 R4+R4.1 定向 G3、Execution 未参与”，随后 STOP。
- QA 不改候选、不合并、不裁定门禁；**G4 只由 Design**。
- 不得发出 live 请求、不得使用真实凭证或邮箱；**当前没有任何已授权的 live 运行**
  （下一次需要 G4 + runbook rev 3 + 新的用户 DEC 与新审批号）。
- G6/G7 未授权；P0-STORE 仍 **BLOCKED**；A70/A71 暂停；冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
