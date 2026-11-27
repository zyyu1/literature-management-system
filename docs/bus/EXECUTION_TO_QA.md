<!-- BUS from=EXECUTION to=QA seq=34 re=MANAGEMENT_TO_EXECUTION.md@51 status=STOP updated=2026-11-27T15:52+01:00 -->
# Execution → QA

## STOP — P0-STORE R3 上线准备切片 G2 已提交；等待 Design；本轮不派 QA

按 `MANAGEMENT_TO_EXECUTION.md` seq 51（DEC-39=A，P0-STORE R3 G1）执行；绑定规范
`docs/handoffs/P0-STORE/R3_LIVE_READINESS.md` 与 `D007_A96…`。**离线可测切片，不发起真实请求、不设置真实凭证**。
（派单写 “seq 33 或 latest+1”；seq 33 已被 seq50 的 DONE 占用，故本窗口按 latest+1 用 **seq 34**。）

### 1. 交付对象

- PR **#9** — https://github.com/zyyu1/literature-management-system/pull/9
  - 同一分支 `exec/P0STORE-nutstore-probe-r1`；Base **`663556bc68dc0472f2f392f09ca4bee7c668d2f5`**。
  - 起点 `b6fec8e3…`；**R3 证据提交 `ba4351947528cfd3881d3f64601dbaa63b4242ff`**（单亲，父 `b6fec8e`）；
    **最终 exact HEAD `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`**（仅追加 `QA_HANDOFF.md` 的 docs-only 提交）。
  - R3 允许改动 `b6fec8e..ba43519`：9 文件 / +966 −113；**冻结文件** `gate/secret/trace/oracle/verdict/support/example-plan` 相对 `b6fec8e` **逐字节不变**（`git diff --quiet` exit 0）。
- **G2 评论 #7221313989**（exact final head，A86 DEC-27 逐项表）：
  https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7221313989
- **Design QA 计划路径（只传路径）**：`docs/handoffs/P0-STORE/R3_LIVE_READINESS.md` §5。

### 2. G2 证据摘要（在 `ba43519` 上实测；手动 A59 区间 `14:39:18Z–14:49:50Z`）

- 探针 **5/5 `EGRESS_PROBE=PASS`**（loopback 正；外部 IPv4/IPv6/LAN TCP 与 `.invalid` DNS 负；无 proxy/凭证变量）；未接触真实主机、未设置任何凭证。
- **suite 85/85 PASS**（fail/skip/todo/cancelled 全 0，115.3 s）；P1-15 新增 8 项 live 门控测试，P1-12 已改写为 7 条件矩阵。
- 严格上游（P1-13）PASS：WP-01 **67/67**、WP-02 **44/44**（nested 67）、WP-03 **103/103**、WP-04 **91/91**；**94/94** 受保护 Base blob。
- **audit PASS**：证据提交 `commits=5 basePaths=275 approvedAdditions=31 protectedPaths=94 headPaths=306`；最终 head 重跑（git-only）`commits=6`，计数不变。
- **mutation PASS**：`MUTATION_SUMMARY killed=22/22`（M01–M16 保留 + M17 缺 approval、M18 畸形 approval、M19 不同 host、M20 前缀越界、M21 跳过 Node 检查、M22 授权前读凭证）。
- live 门控：7 条全部在 secret 读取/gate/socket/子进程之前判定，各自原因码、**零传输、零 trace**，1–4 前不读凭证值（poisoned env 证明）；全满足 + 注入桩传输（无 socket）时首请求精确指向 `https://dav.jianguoyun.com:443/dav/LMS-P0STORE/<runtime-runId>/…`，金丝雀不入 trace/log/error；真实主机字面量恰好两处（live plan + `src/plan.mjs` 固定常量）。
- 披露：`PHASE1_LIVE_ENABLED` 仅保留为冻结 `support/harness.mjs` re-export 所需的死兼容导出，无 live 代码使用；移除会破坏冻结文件字节不变。

### 3. NOT_RUN 与边界

- QA-owned 定向 G3 项均 `NOT_RUN`：QA live 门控矩阵/零传输与未读凭证证明、桩传输目标 URL + canary 扫描、计数中性审计负例、QA 字节证明、≥3 个 QA gating mutants、Linux A54/A55。
- 第 3 阶段真实运行 / ACCESS-02 / G6 / G7 未授权；无真实主机/账号/凭证/数据；P0-STORE 仍 **BLOCKED**；A70/A71 暂停。
- 未合并、未派 QA、未 force-push/rebase、未改冻结路径、未加依赖/提权、未联网跑测试；PR #9 保持 OPEN。

**EXECUTION STOP**
