<!-- BUS from=DESIGN to=MANAGEMENT seq=17 re=bus/MANAGEMENT_TO_EXECUTION.md@16 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R17

**轮次:** R17 (seq 17) · 2026-11-25 · observed parent `main@1684cea5623c8421e16c328c7f1464e8932d3118`
DEC-10=A；PR #6 G5 已由 Design 核验：merge `f1e3ac3e1ed0244ad5a5f4af31228d3015dea87d`，30/30 tested blobs 一致，原 main 保留。A64 G4 PASS_LOCAL，P2 CLOSED_LOCAL，Linux 新 SHA NOT_RUN。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | MERGED |
| WP-02 | [A65](architecture/D007_A65_WP02_G5_VERIFIED_AND_WP03_R1_G1_DRAFT.md) G5 MERGED VERIFIED |
| WP-03-R1 | [DESIGN](handoffs/WP-03/DESIGN.md) / [QA](handoffs/WP-03/QA_INSTRUCTION.md) G0 ready, G1 DRAFT |
| WP-03-R2 / real persistence / G6/G7 | BLOCKED / NOT_AUTHORIZED |

## 2. 待用户决策 — DEC-11
| 选项 | 含义 |
| --- | --- |
| A（推荐） | 批准 WP-03-R1 synthetic-only G1：Project 创建/改名/归档/恢复、全局 Reading Status、关联 Important、CAS/operationId/UNKNOWN；R2 永久删除、Current/All unlink 只验拒绝；Windows/Linux 独立 QA subject-specific；按 A65 和伴随设计/QA exact scope。 |
| B | 保留 WP-03 G0 设计，不实施。 |

## 3. Management action
A 时记录 DEC-11=A 并写 Management→Execution 下一 seq 17，引用 board seq 17、A65、WP-03 DESIGN/QA。Exact immutable Base `1684cea5623c8421e16c328c7f1464e8932d3118`（已含合并后的两个包；设计文档另作 authority）；新 branch `exec/WP-03-guarded-r1-writes`、新 PR。仅 `packages/wp-03-guarded-r1-writes/**` 和 `docs/handoffs/WP-03/QA_HANDOFF.md` 可写；WP-01/02、fixture、helper/manifest/driver/UI 全冻结。Node v22.23.5 x64，A59 等效隔离 Windows 优先、独立 Windows/Linux QA、另一平台未实测记 NOT_RUN；A47 LIGHT。Q3-01..11、上游 67/44/13、独立 raw probes 和具名 mutants。B 只记录暂缓。不合并、不部署、不接真实数据/服务。未批准不得派发。

## 4. 回传
Execution/QA 各下一 seq 和 PR 原始评论，exact SHA、diff、真实测试计数、退出码、环境、故障/变异/独立证据及限制；Design G4。R1 通过不代表 WP-03 R2 完成。

## 5. 边界
P0-STORE 未 GO，R2 受 A16/UI-AMEND/step-up 门禁；G5/G6/G7 独立审批。PR #2/#4 与冻结 UI 不动。无 WP-04 实施授权。
