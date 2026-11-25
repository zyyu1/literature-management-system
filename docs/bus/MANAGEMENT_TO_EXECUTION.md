<!-- BUS from=MANAGEMENT to=EXECUTION seq=16 re=DECISION_BOARD.md@16 status=DONE updated=2026-11-25T16:25+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 16（R16）§2–§3。用户在 Management 窗口选定 **DEC-10=A**（批准 G5）。

## 记录：DEC-10 = A（G5 合并 PR #6）

| 项 | 值 |
| --- | --- |
| 决策 | **DEC-10=A**：仅合并 PR #6 的 exact HEAD 到 `main`，正常 merge commit |
| PR | **#6** `exec/WP-02-project-paper-read` → `main` |
| 合并前 exact HEAD | `8751dd2b4f041d5a17af894ac9cca8bd28560d66`（合并前复核未漂移，`mergeable=true`） |
| 合并前 main | `1963168e15129f33bcfb7da0b84916d2d07ee60d` |
| **实际 merge commit** | **`f1e3ac3e1ed0244ad5a5f4af31228d3015dea87d`** |
| 父链 | `1963168e`（合并前 main）+ `8751dd2b`（PR head） |
| 合并后 main | `f1e3ac3e1ed0244ad5a5f4af31228d3015dea87d` |
| PR 状态 | `closed` / `merged=true` |
| 合并方式 | **merge commit**，未 squash、未 rebase、未 force push、未改代码、未绕过 checks |

## 合并后核验

- merge commit 恰为 `f1e3ac3e`，父提交为原 main 与 PR head，父链正确。
- 相对第一父提交（原 main）变更 **30 个文件**，与决策板所述范围一致（A56 的 27 个路径 + A60 的三个 WP-01 测试路径）。
- `packages/wp-02-project-paper-read/test/identity.test.mjs` 在合并后 blob 为 `48a6b38f9adbffb12fcc202653e1264df4701915`，与 PR head `8751dd2b` 上的 blob **逐字节相同**。
- 分支**未删除**。

## 不变项

- A64 的 **G4 PASS_LOCAL** 与 `P2-WP02-QA-1 CLOSED_LOCAL` 保持不变；G4 不等于合并成功，本记录只记 G5 事实。
- **WP-03 G1 NOT_AUTHORIZED**；G6 真实服务 / G7 部署 **NOT_AUTHORIZED**；不接真实数据或服务，不发布。
- P0-STORE 未 GO，真实持久化写入仍阻断；PR #2（`a9131ac`）与 PR #4（`2757aa6`）保持 OPEN 存档，冻结 UI 不动。
- Linux 新 SHA **NOT_RUN**；不声称双平台认证。
