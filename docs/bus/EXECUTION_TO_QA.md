<!-- BUS from=EXECUTION to=QA seq=28 re=MANAGEMENT_TO_EXECUTION.md@44 status=STOP updated=2026-11-27T09:36+01:00 -->
# Execution → QA

## STOP — WP-04-R1 已实现并提交 G2；等待 Design 核验；本轮不派 QA

按 `MANAGEMENT_TO_EXECUTION.md` seq 43（DEC-25=A，WP-04-R1 G1）与 seq 44（DEC-26/27/28 同步、DEC-27 逐项报告要求）执行。**不合并、不派 QA**：G2 由 Design 评审，G3 须由 Design 释放后由独立 QA 执行。

### 1. 交付对象

- PR **#8** — https://github.com/zyyu1/literature-management-system/pull/8
  - branch `exec/WP-04-research-notes-r1` → `main`；Immutable Base **`bcc4eaad5183c923f782da0475eea1751be2de3b`**；exact HEAD **`6056b591e719796d40b8806f5b35ad1d498a57f7`**（单亲 1 提交，23 个白名单新增 / +5140，工作树干净，Base 外 0 改动）。
  - 白名单仅：`packages/wp-04-research-notes-r1/**`（22 文件）+ `docs/handoffs/WP-04/QA_HANDOFF.md`。
- **G2 评论 #7202444023**（同 exact SHA，DEC-27 逐项表已含）：
  https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7202444023
- **Design QA 计划路径（只传路径）**：`docs/handoffs/WP-04/QA_INSTRUCTION.md`。

### 2. G2 证据摘要（全部在 A59 离线区间内；明细见评论）

- Node 精确 **v22.23.5 x64**（`node.exe` SHA-256 `247e9693…bdf38a`）。
- A59 用户授权自动离线：WLAN `connectionmode=manual` → 断网 `20:11:04Z`，恢复 `20:12:58Z`；探针 **5/5 `EGRESS_PROBE=PASS`**（loopback 正；外部 IPv4/IPv6/LAN TCP 与 `.invalid` DNS 负；无 proxy/凭证变量）；所有 suite/audit/mutation 子进程在区间内结束。
- **WP-04 suite：91/91 PASS**（`# pass 91 / fail 0 / cancelled 0 / skipped 0 / todo 0`，28.9 s）；Q4-01…Q4-12 全部按名通过。
- **严格上游（Q4-12）PASS**：WP-01 **67/67**、WP-02 **44/44**（nested WP-01 67/67）、WP-03 **103/103**，strict TAP。
- **Candidate audit PASS**：`CANDIDATE_SCOPE_OK base=bcc4eaa… head=6056b59… commits=1 basePaths=243 approvedAdditions=23 protectedPaths=72 headPaths=266 worktreePaths=266`。
- **Mutation driver PASS**：`BASELINE exit=0 failing=0`，**`MUTATION_SUMMARY killed=14/14`**（M01–M14，各自被预期具名断言杀死，无 crash/timeout）。
- DEC-27 逐项状态：Q4-01…Q4-12、§2 各组、14 个 committed mutants、追溯项均在 PR 评论逐行标注 `PASS`（附实际输入/断言/退出码）；审计负例矩阵、独立 raw HTTP/byte oracle 与 QA 独立 mutants 标 `NOT_RUN`（属 G3）；Linux、UI、local draft、Typora、真实存储/Provider/deployment 标 `NOT_RUN`。

### 3. 披露与限制

- **设计文档不在候选树**：Base `bcc4eaa` 早于 WP-04 文档；`bcc4eaa..main` 变更 11 路径**全部在 `docs/`**（非 docs 改动 0）。候选仅含白名单新增；`DESIGN.md` / `QA_INSTRUCTION.md` / `D007_A85` 的权威文本在 **main@`b04ba32d009d7731f2c8ca797f87c735cd779e25`**，QA/Design 需从 main 读取（`QA_HANDOFF.md` §0 已记录；把文档加入候选会触发审计 `UNEXPECTED_ADDED_PATH`）。
- **Syntax 组**：`node --check` 20/20 PASS，但作为静态检查在离线区间外执行（无 socket/子进程网络能力）；已在 G2 评论中如实标注 `NOT_RECORDED`（仅该组的离线边界），其余网络相关组均在区间内。
- G2 评论于 `2026-11-26T20:14Z` 已发布；本 seq28 因交互 runner 收尾挂起而延迟到 `2026-11-27` 推送，属本窗口工具侧问题，不影响候选/证据内容。

### 4. 边界

- 未合并、未 force/squash/rebase、未改 Base 外路径、未加依赖、未提权、未联网跑测试、未触碰冻结 UI/PR #2/#4/真实数据。
- G2 由 Design 评审；G3 待 Design 通过 G2 后由 Management 另行释放，QA 在那之前不得开工；G4 由 Design 裁定，G5 另行 DEC。
- G6/G7 NOT_AUTHORIZED；A70/A71 suspended；P0-STORE blocked。

**EXECUTION STOP**
