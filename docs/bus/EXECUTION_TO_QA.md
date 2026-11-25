<!-- BUS from=EXECUTION to=QA seq=15 re=MANAGEMENT_TO_EXECUTION.md@18 status=OPEN updated=2026-11-25T17:56+01:00 -->
# Execution → QA

## A66 test-gate remediation ready for independent G3

| Item | Value |
| --- | --- |
| PR / branch | **#7** `exec/WP-03-guarded-r1-writes` → `main` (OPEN, do not merge) |
| Exact candidate SHA | `e6b1180e4e3e5790958ae3319af18bba8889ffbc` |
| Parent / A66 START | `0fcad9cb6016900d5f7057161619e4a9f2e94b55` |
| Immutable Base | `1684cea5623c8421e16c328c7f1464e8932d3118` |
| Execution report comment | **7168708378** (PR #7) |
| Authority | DEC-11=A / A65 + A66 |
| QA plan | `docs/handoffs/WP-03/QA_INSTRUCTION.md` + `docs/handoffs/WP-03/QA_HANDOFF.md`（A66 dated correction） |

- 六路径（+859/−197）：`upstream-regression.test.mjs`、`support/harness.mjs`、`scripts/mutation-check.mjs`（仅 preflight）、**新增** `scripts/verify-candidate-scope.mjs`、`README.md`、`QA_HANDOFF.md`；START 的其它字节不变，22 个累计新增路径。
- **P1 无条件门禁**：冻结的 A62 helper 在 harness 模块载入、Q3-11 上游子进程之前、driver preflight 之前执行；`HOST_PRECONDITION_ONLY` 与 `WP03_REQUIRE_OFFLINE_UPSTREAM` 已从执行路径移除；严格 TAP 67/44（fail/skip/todo=0、拒绝畸形/部分 summary）。
- **P2 范围分离**：默认 Q3-11 固定 51 个 Base blob（两个上游整包含 evidence、两夹具、`tools/offline`）；独立 `verify-candidate-scope.mjs` 审计通过（`CANDIDATE_SCOPE_OK`：Base 200 路径、22 新增、6 个 A66 路径、干净检出）。
- 联网主机 fail-fast 证明：默认 11 文件全失败、0 个 Q3 执行、targeted 同样、driver preflight 直接拒绝，全部在 socket/子进程之前。
- **A59 离线 Windows 实测**：syntax 19/19；WP-03 **103/103**；WP-01 **67/67**；WP-02 **44/44**（嵌套 67/67）；两 driver **13/13**；候选审计 OK；scratch 旧/新集成证明、默认完整性负例、4/4 绕过变异、strict-TAP 14 负例、候选审计 5 负例全绿；`EGRESS_PROBE=PASS`。
- 限制：Linux `NOT_RUN`；R2 成功路径、真实持久化、UI、provider、浏览器/TLS 均 `NOT_RUN`；Execution 自测不等于独立 QA/G3。

Gates unchanged：G5/G6/G7 **NOT_AUTHORIZED**；PR #2（`a9131ac`）、PR #4（`2757aa6`）与冻结 UI 未触碰。