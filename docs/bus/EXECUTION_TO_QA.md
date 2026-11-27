<!-- BUS from=EXECUTION to=QA seq=32 re=MANAGEMENT_TO_EXECUTION.md@49 status=STOP updated=2026-11-27T14:34+01:00 -->
# Execution → QA

## STOP — P0-STORE Phase 1 R2（INCONCLUSIVE 判定修正）G2 已提交；等待 Design；本轮不派 QA

按 `MANAGEMENT_TO_EXECUTION.md` seq 49（DEC-37=A，P0-STORE R2 G1）执行；绑定规范
`docs/handoffs/P0-STORE/R2_VERDICT_FIX.md` 与 `D007_A93…`。只关闭 **LIM-P0S-1**。**不合并、不派 QA**。

### 1. 交付对象

- PR **#9** — https://github.com/zyyu1/literature-management-system/pull/9
  - 同一分支 `exec/P0STORE-nutstore-probe-r1`；Base **`663556bc68dc0472f2f392f09ca4bee7c668d2f5`**。
  - 起点 head `88e1bd76…`；**R2 证据提交 `403218797ffb2fc2aafa3b681d8b461159e09aba`**（单亲，父 `88e1bd7`）；
    **最终 exact HEAD `b6fec8e3b0ec217b142b428080454588e6866744`**（仅追加 `docs/handoffs/P0-STORE/QA_HANDOFF.md` 的 docs-only 提交）。
  - R2 允许改动 `88e1bd7..4032187`：12 文件 / +448 −90；`gate/plan/secret/trace/runner/support` 与
    `PHASE1_LIVE_ENABLED=false` **逐字节不变**（`git diff --quiet` exit 0），`src/oracle.mjs` 未变。
- **G2 评论 #7219591478**（exact final head，A86 DEC-27 逐项表）：
  https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7219591478
- **Design QA 计划路径（只传路径）**：`docs/handoffs/P0-STORE/R2_VERDICT_FIX.md` §5。

### 2. G2 证据摘要（在 `4032187` 上实测；手动 A59 离线区间 `13:20:24Z–13:30:29Z`）

- 探针 **5/5 `EGRESS_PROBE=PASS`**（loopback 正；外部 IPv4/IPv6/LAN TCP 与 `.invalid` DNS 负；无 proxy/凭证变量）。
- **suite 65/65 PASS**（fail/skip/todo/cancelled 全 0，114.5 s）；新增 **P1-14**（15 项：11 性格矩阵 + 原因顺序 + 3 个合成优先级用例）。
- 严格上游（P1-13）PASS：WP-01 **67/67**、WP-02 **44/44**（nested 67）、WP-03 **103/103**、WP-04 **91/91**；**94/94** 受保护 Base blob。
- **audit PASS**：证据提交 `commits=3 basePaths=275 approvedAdditions=29 protectedPaths=94 headPaths=304`；最终 head 重跑（git-only）`commits=4`，计数不变。
- **mutation PASS**：`MUTATION_SUMMARY killed=16/16`（M01–M13 保留 + M14 提前 STOP→PARTIAL、M15 INCONCLUSIVE→GO、M16 原因顺序倒置）。
- 行为：`VERDICTS = ['GO','PARTIAL','INCONCLUSIVE','NO-GO']`；strong GO；weak-etag PARTIAL（`WEAK_VALIDATOR@L3` 先）；stale-read PARTIAL（`STALE_READ_VISIBILITY@L2` 先，cleanup STOP@L12 后）；lost-update/create-overwrite NO-GO；late-ack GO；unresolvable-ack PARTIAL（`UNRESOLVABLE_LATE_ACK@L8` 先）；throttle/server-error/redirect/bad-cert INCONCLUSIVE（L0 STOP）。

### 3. 授权例外与 NOT_RUN

- **唯一白名单例外（用户已授权）**：`test/p1-03-tls-redirect-stop.test.mjs` 中 bad-cert / redirect 两处 verdict 断言
  `PARTIAL → INCONCLUSIVE`，各附一行 R2 说明；其余 P1-03 未动。
- QA-owned 定向 G3 项均 `NOT_RUN`：独立 11 性格矩阵/原因顺序、计数中性审计负例、零出网复核 + canary、≥3 个 QA mutants、
  Linux A54/A55、冻结文件字节不变的 QA 复核。
- 第 2–4 阶段 / ACCESS-02 / G6/G7 未授权；无真实主机/账号/凭证/数据；P0-STORE 仍 **BLOCKED**；A70/A71 暂停。

### 4. 边界

- 未合并、未派 QA、未 force-push/rebase、未改冻结路径、未加依赖/提权、未联网跑测试；PR #9 保持 OPEN。
- G2 由 Design 评审；定向 G3 待 Design 通过后由 Management 另行释放；G4 只由 Design，Phase 3 需另一次显式 ACCESS-02/G6 用户批准。

**EXECUTION STOP**
