<!-- BUS from=EXECUTION to=QA seq=29 re=MANAGEMENT_TO_EXECUTION.md@44 status=STOP updated=2026-11-27T09:43+01:00 -->
# Execution → QA

## STOP — WP-04-R1 G2 最终 SHA 对齐；等待 Design 核验；本轮不派 QA

本序仅更新 seq 28 的 **exact SHA / 评论引用**（任务、证据与边界不变）。seq 28 的 WP-04-R1 G2 主体仍有效。

### 1. 最终对象

- PR **#8** — https://github.com/zyyu1/literature-management-system/pull/8
  - branch `exec/WP-04-research-notes-r1` → `main`；Base **`bcc4eaad5183c923f782da0475eea1751be2de3b`**；
    **最终 exact HEAD `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`**（2 个单亲提交；23 个白名单新增；工作树干净）。
  - `6056b59` = 实现/首轮证据提交；`f951f71` = 仅 `docs/handoffs/WP-04/QA_HANDOFF.md` 的 docs-only 提交（`git diff 6056b59..f951f71` 仅该文件），随后在 `f951f71` 上**重跑全套离线证据**。
- **G2 原始评论 #7202444023**（证据提交 `6056b59`，含 DEC-27 逐项表）：
  https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7202444023
- **G2 addendum #7213804565**（最终 HEAD `f951f71` 的同一套证据重跑）：
  https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7213804565
- **Design QA 计划路径（只传路径）**：`docs/handoffs/WP-04/QA_INSTRUCTION.md`。

### 2. 最终 SHA 证据摘要（手动 A59 离线区间）

- Node 精确 **v22.23.5 x64**；区间 **`2026-11-27T08:38:41Z–08:40:18Z`**（用户手动断网/恢复，测试进程不改网络）。
- 探针 **5/5 `EGRESS_PROBE=PASS`**（loopback 正；外部 IPv4/IPv6/LAN TCP 与 `.invalid` DNS 负；无 proxy/凭证变量）。
- **suite 91/91 PASS**（fail 0 / skipped 0 / todo 0 / cancelled 0，27.4 s）；严格上游 WP-01 **67/67**、WP-02 **44/44**（nested 67）、WP-03 **103/103**。
- **audit PASS**：`CANDIDATE_SCOPE_OK base=bcc4eaa… head=f951f71… commits=2 basePaths=243 approvedAdditions=23 protectedPaths=72 headPaths=266 worktreePaths=266`。
- **mutation PASS**：`BASELINE exit=0 failing=0`；`MUTATION_SUMMARY killed=14/14`。
- DEC-27 逐项状态见 #7202444023（全部 Q4/组/mutant/追溯项 PASS；QA-owned 审计负例、独立 raw HTTP/byte oracle、QA 独立 mutants、Linux 为 `NOT_RUN`，属 G3）。

### 3. 边界

- 未合并、未改候选代码/测试/脚本（最终 delta 仅 QA_HANDOFF 文档）、未加依赖/提权、未触碰冻结 UI 与 PR #2/#4。
- G2 由 Design 评审；G3 待 Design 通过后由 Management 另行释放，QA 在那之前不得开工；G4 由 Design 裁定，G5 另行 DEC。
- G6/G7 NOT_AUTHORIZED；A70/A71 suspended；P0-STORE blocked。

**EXECUTION STOP**
