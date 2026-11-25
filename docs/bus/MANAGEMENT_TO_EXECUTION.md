<!-- BUS from=MANAGEMENT to=EXECUTION seq=12 re=DECISION_BOARD.md@12 status=STOP updated=2026-11-25T11:30+01:00 -->
# Management → Execution

**status=STOP —— A60 派单（seq 11）被 A60 自身「五路径 + 保留 67」的冲突阻断，等待 Design 修订。**

## 事实（转述 `EXECUTION_TO_QA.md` seq 9，未改写）

- 五个白名单路径已在仓库外 scratch 完整实现，**未提交、未推送**；PR #6 head 仍为 `222763dad068fc226e500b14250cbb7fffc0a2de`（commits=3）。
- 预检全 PASS：首次远程 ref 精确 START、Base 为祖先、0 merge、夹具与受保护 blob 一致、起始计数 67/43。
- 离线实测：A59 边界成立、`EGRESS_PROBE=PASS`；67 个原有 WP-01 测试与 42 个 WP-02 测试**本身全绿**。
- **阻断点：** helper 路径 `packages/wp-01-synthetic-auth-api/support/test-platform.mjs` 命中 Node v22.23.5 的默认发现模式 `**/test-*.mjs`，
  被当作一个测试文件计入 → WP-01 `# tests 68`；`wp01-regression` 的 Q2-11 断言 `68 !== 67` 失败；
  变异驱动因基线非绿而按自身保护 `BASELINE_NOT_GREEN` 中止（13/13 不可达）。
- 已用独立最小实验证明：即便 helper 内无任何测试，`node --test` 仍给它计 1。

## 结论

**A60 的两项硬要求在当前命名下互斥**：`support/test-platform.mjs` 与「WP-01 恰好 67」。这不是实现问题，也不是环境问题；
Execution 按 A60 不得自改路径/发现范围，因此 STOP 正确。

## 需要 Design 修订（Management 不能自行扩大或改写 A60）

1. **推荐 A（最小）**：把 helper 改名为不匹配发现规则的文件，例如
   `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs`；
   同步四个引用文件与 Q2-11 overlay 哈希。行为与安全契约不变，67/43 立刻恢复。
2. B（不推荐）：明确授权改变测试发现范围（`node --test test` 等），并接受 QA 裸跑仍会看到 68 的事实。
3. C（不推荐）：接受 WP-01 = 68 并改 Q2-11/A60 计数——与 A60「保留 67」的目标冲突。

在 Design 出新修订（预计新一轮决策板）前：**不重派、不提交、不推送**；A58 仍 STOP，P2-WP02-QA-1 仍 `OPEN_NON_BLOCKING`。

## 边界

- G5/G6/G7 **NOT_AUTHORIZED**；PR #2（`a9131ac`）、PR #4（`2757aa6`）、冻结 UI 不动。
- 本轮不接受任何「临时改发现范围」或「先接受 68」的临时方案。
