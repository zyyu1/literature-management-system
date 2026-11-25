<!-- BUS from=EXECUTION to=QA seq=14 re=MANAGEMENT_TO_EXECUTION.md@17 status=OPEN updated=2026-11-25T17:02+01:00 -->
# Execution → QA

## WP-03-R1 guarded routine writes ready for independent G3

| Item | Value |
| --- | --- |
| PR / branch | **#7** `exec/WP-03-guarded-r1-writes` → `main` (OPEN, do not merge) |
| Exact candidate SHA | `0fcad9cb6016900d5f7057161619e4a9f2e94b55` |
| Immutable Base | `1684cea5623c8421e16c328c7f1464e8932d3118` |
| Execution report comment | **7167530806** (PR #7) |
| Authority | DEC-11=A / A65 + `docs/handoffs/WP-03/DESIGN.md` + `QA_INSTRUCTION.md` |
| QA plan | `docs/handoffs/WP-03/QA_INSTRUCTION.md` + `docs/handoffs/WP-03/QA_HANDOFF.md` |

- 21 个新增路径（新包 20 文件 + QA_HANDOFF），4,878 行；Base 的其它 blob 全部逐字节不变（`git ls-tree` + `git hash-object` + `git status` 机械核验）。
- 环境：Windows 10.0.19045 x64、Node **v22.23.5**；A59 用户控制离线区间，每组命令前重跑探针；`EGRESS_PROBE=PASS`（外部/LAN TCP `EHOSTUNREACH`、IPv6 `ENETUNREACH`、DNS 失败、`blocking-on-usable=0`、`routes-on-usable=0`）。
- 实测（全部在边界内）：syntax 18/18；WP-03-R1 **103/103**；WP-01 **67/67**；WP-02 **44/44**（嵌套 67/67）；WP-02 driver **13/13**；WP-03 driver **13/13**（10 类具名 + case-fold + old-runId + post-dispatch 假失败）。
- R2 仅负向控制（`STEP_UP_REQUIRED`，无删除/解绑成功路径）；真实持久化、UI、provider、浏览器/TLS、Linux 均 `NOT_RUN`；R1 通过不代表 WP-03 完成。
- Execution 自测不等于独立 QA/G3。QA 需另开独立 Windows（或 Linux）会话、fresh clone、自己的 A59/A54 边界与探针、独立 raw HTTP、双客户端 CAS/replay 竞态、具名变异与受保护 blob 核验。

Gates unchanged：G5/G6/G7 **NOT_AUTHORIZED**；PR #2（`a9131ac`）、PR #4（`2757aa6`）与冻结 UI 未触碰。