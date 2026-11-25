<!-- BUS from=DESIGN to=MANAGEMENT seq=16 re=bus/QA_TO_DESIGN.md@9 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R16

**轮次:** R16 (seq 16) · 2026-11-25 · observed parent `main@c95906ff613dfb646638b35d45e34507bc95bfb0`
已核验 Management seq 15 / Execution seq 13 / QA seq 9。A64 裁定 PR #6 exact `8751dd2b4f041d5a17af894ac9cca8bd28560d66` G4 PASS_LOCAL，原 P2-WP02-QA-1 CLOSED_LOCAL。Windows 完整回归 44/67/13；Linux 新 SHA NOT_RUN。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合并；A55 历史证据不变 |
| WP-02 | [A64](architecture/D007_A64_WP02_FINAL_EXACT_G4_PASS_LOCAL.md) G4 PASS_LOCAL，原 P2 与五平台 P2 CLOSED_LOCAL |
| G5 | 等 DEC-10 |
| WP-03 | G1 NOT_AUTHORIZED；需独立设计与批准 |
| G6/G7 | NOT_AUTHORIZED |

## 2. 待用户决策 — DEC-10（Management 窗口）
| 选项 | 含义 |
| --- | --- |
| A（推荐） | 批准 G5，仅合并 PR #6 exact HEAD `8751dd2b4f041d5a17af894ac9cca8bd28560d66` 到 main，正常 merge commit；按 A64 §3 核对最新 HEAD、main、授权 diff 和保护规则，合并后核验真实 merge SHA/父链/测试文件字节与范围。不删除分支，不发布、不接真实服务，不授权 WP-03。 |
| B | 暂缓合并，PR #6 保持 OPEN，G5 NOT_AUTHORIZED。 |

## 3. Management action
呈现 DEC-10 并记录用户明确选择。未批准前不得合并。A 时按 [A64 §3](architecture/D007_A64_WP02_FINAL_EXACT_G4_PASS_LOCAL.md) 精确范围执行 G5，使用 expected head SHA；Base..HEAD 6 commits / 30 paths（A56 27 + A60 三个 WP-01 测试路径）；不得 squash/rebase/force push/改代码/绕过 required checks。任何不一致 → STOP。B 则只记录暂缓，不动 PR。无代码执行派单。

## 4. 回传
记录 DEC-10、PR exact HEAD、实际 merge SHA（若已合并）、pre/post main、父链、merged diff/字节核验、限制及原始证据。Management 通过既有 bus 下一 seq 回传；Design 复核后直接发布下一步 WP-03 G1 设计/决策（未批准前不实施）。不把当前 G4 当作 merge 成功。

## 5. 边界
G6/G7 未授权；无真实数据/服务、部署、PR #2/#4 或冻结 UI 修改；P0-STORE 未 GO，真实持久化写入仍阻断。
