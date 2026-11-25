<!-- BUS from=EXECUTION to=QA seq=20 re=MANAGEMENT_TO_EXECUTION.md@30 status=OPEN updated=2026-11-25T20:58+01:00 -->
# Execution → QA

## A72 strict-TAP final remediation ready for independent new-SHA G3

| Item | Value |
| --- | --- |
| PR / 分支 | **#7** `exec/WP-03-guarded-r1-writes` → `main`（OPEN / 未合并；G5 未授权，禁止 merge） |
| Exact candidate | `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` |
| 父提交 / A72 START S | `e6b1180e4e3e5790958ae3319af18bba8889ffbc` |
| A66 START T | `0fcad9cb6016900d5f7057161619e4a9f2e94b55` |
| 不可变 Base B | `1684cea5623c8421e16c328c7f1464e8932d3118` |
| Execution 报告 | **#7172989882**（PR #7） |
| 既有 QA 评论 | **#7168907120**（历史；不替代新 SHA 的独立 G3） |
| 授权 | DEC-16=A；A65 + A66 + A72 |
| QA 计划 | `docs/architecture/D007_A72_WP03_STRICT_TAP_FINAL_REMEDIATION_DRAFT.md` **§3** |

## 交付事实

- 单个增量提交：S..HEAD 恰 1 个单父提交；B..S 为历史 2 提交；B..HEAD 为 3 个单父提交、0 merge。
- 恰 3 个修改路径（0 新增/删除/改名，+331/−147）：`README.md`、`scripts/verify-candidate-scope.mjs`、`test/upstream-regression.test.mjs`。
- 22 个累计新增、0 个 Base 修改/删除、222 tracked 路径；S 上三路径以外的路径字节与 mode 不变；worktree 干净且等于 HEAD。
- 产品 `src`、fixtures、上游包、guard、mutation driver、依赖、`tools/`、UI、runtime 均未改；`docs/handoffs/WP-03/QA_HANDOFF.md` 保持历史记录；A70 迁移分支未创建。

## G2 证据（A59 离线区间 2026-11-25T20:54:13+01:00–20:55:53+01:00）

- Windows 10.0.19045 x64；Node **v22.23.5** x64；零流量平台守卫 PASS；**6/6** egress probe PASS（loopback `CONNECTED`；外部 `EHOSTUNREACH`；DNS `ENOTFOUND`）。
- syntax **19/19**；WP-03 默认 **103/103**（fail/cancelled/skipped/todo 0）；WP-01 **67/67**；WP-02 **44/44**（嵌套 WP-01 67/67）；两个 driver 各 **13/13**；candidate audit `CANDIDATE_SCOPE_OK`（basePaths=200 / additions=22 / A66=6 / A72=3 / worktree=222）。
- 合成配对 oracle **88/88**；F1–F3 旧解析 `FULL`、新解析断言失败；解析器变异 **5/5 KILLED**，审计新范围绕过变异 **1/1 KILLED**（均为预期断言失败，非崩溃/超时）。

## QA 要求

按 A72 §3 独立执行 full new-SHA G3；在同一 exact SHA 发新 PR 评论（引用 #7172989882、既有 QA #7168907120 与 A72），逐项报告实际输入/命令/断言/exit/计数/findings/NOT_RUN；然后写 `docs/bus/QA_TO_DESIGN.md` 下一 seq（**15**）并 STOP。不得把 S 的结果当作新 SHA 验收；任何 SHA 漂移即 STOP。

Gates unchanged：G3 待独立复核；G4 由 Design 裁定；G5/G6/G7 **NOT_AUTHORIZED**；Linux runtime NOT_RUN；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 未触碰；A70/A71 继续暂停。
