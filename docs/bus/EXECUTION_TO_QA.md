<!-- BUS from=EXECUTION to=QA seq=36 re=MANAGEMENT_TO_EXECUTION.md@57 status=STOP updated=2026-11-27T17:44+01:00 -->
# Execution → QA

## STOP — P0-STORE R4 认证身份修复 G2 已提交；等待 Design；本轮不派 QA

按 `MANAGEMENT_TO_EXECUTION.md` seq 57（DEC-42=A，P0-STORE R4 G1）执行；绑定规范
`docs/handoffs/P0-STORE/R4_AUTH_IDENTITY.md` 与 `D007_A99…` §5。**无 live 请求、无真实凭证/邮箱、无真实主机接触。**

### 1. 交付对象

- PR **#9** — https://github.com/zyyu1/literature-management-system/pull/9
  - 同一分支 `exec/P0STORE-nutstore-probe-r1`；Base **`663556bc68dc0472f2f392f09ca4bee7c668d2f5`**。
  - 起点 `6a59ce94…`；**R4 证据提交 `16f0cb0af8d1622067a7b57b05be0acaa97039c6`**（单亲，父 `6a59ce9`）；
    **最终 exact HEAD `a168ee9c91bf7b49f4571ced6046a1bc6da38a54`**（仅追加 `QA_HANDOFF.md` 的 docs-only 提交）。
  - R4 允许改动 `6a59ce9..16f0cb0`：11 文件 / +493 −65；**冻结文件** `support/**`、`example-plan.json`、
    `gate/oracle/verdict` 相对 `6a59ce9` **逐字节不变**（`git diff --quiet` exit 0）；P1-13 与 94 路径清单未动。
- **G2 评论 #7223579792**（exact final head，A86 DEC-27 逐项表）：
  https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7223579792
- **run-1 脱敏产物附加评论 #7223574650**（console 1892 B + trace 1660 B；独立扫描 0 命中）：
  https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7223574650
- **Design QA 计划路径（只传路径）**：`docs/handoffs/P0-STORE/R4_AUTH_IDENTITY.md` §3。

### 2. G2 证据摘要（在 `16f0cb0` 上实测；手动 A59 区间 `16:28:30Z–16:39:19Z`）

- 探针 **5/5 `EGRESS_PROBE=PASS`**（loopback 正；外部 IPv4/IPv6/LAN TCP 与 `.invalid` DNS 负；无 proxy/凭证变量）；无 live 请求、无真实凭证/邮箱。
- **suite 93/93 PASS**（fail/skip/todo/cancelled 全 0，119.0 s；P1-16 新增 8 项 U-01…U-08）。
- 严格上游（P1-13）PASS：WP-01 **67/67**、WP-02 **44/44**（nested 67）、WP-03 **103/103**、WP-04 **91/91**；**94/94** 受保护 Base blob。
- **audit PASS**：证据提交 `commits=7 basePaths=275 approvedAdditions=32 protectedPaths=94 headPaths=307`；最终 head 重跑（git-only）`commits=8`，计数不变。
- **mutation PASS**：`MUTATION_SUMMARY killed=25/25`（M01–M22 保留 + M23 硬编码 probe 用户、M24 用户名不脱敏、M25 首个 401/403 不早停）。
- R4 行为：live 计划强制 `credentialUserEnvVar:"P0STORE_WEBDAV_USER"`（缺键 `PLAN_REJECTED`）；运行时用户名 3–254/邮箱正则/无控制字符/无 `:`，失败 `CREDENTIAL_USER_MISSING`/`CREDENTIAL_USER_MALFORMED`（零传输、空 trace、密码不读）；用户名按机密脱敏（预检只 `user=<redacted, N chars>`）；live `Basic base64(user:pass)`、local/mock 仍 `probe`；live 首个 401/403 立即停止（恰 1 次传输、无清理、INCONCLUSIVE，`UNEXPECTED_401@L0`）；R3 其余条件不变。
- run-1 产物独立扫描：关键词 `Authorization|Basic |password|PASSWORD=|secret` 0 命中、邮箱正则 0 命中；仅合成 host/prefix/runId/approvalId 与脱敏 trace 字段。

### 3. 披露与 NOT_RUN

- “首轮 G2”：本轮为 R4 首轮 Execution G2；QA-owned 定向 G3 项均 `NOT_RUN`（QA auth-identity 矩阵、零传输/未读凭证证明、canary/桩 Authorization、计数中性审计负例、QA 字节证明、≥3 个 QA mutants、Linux）。
- **当前没有任何已授权的 live 运行**：run-1 approval 已消耗；下一次真实运行必须在 G4 之后、Design 发 runbook rev 3（多一行掩码用户名）并且用户给新 DEC + 新审批号。P0-STORE 结论仍开放（INCONCLUSIVE/认证缺陷）；P0-STORE 仍 **BLOCKED**。
- 未合并、未派 QA、未 force-push/rebase、未改冻结路径、未加依赖/提权、未联网跑测试；PR #9 保持 OPEN。

**EXECUTION STOP**
