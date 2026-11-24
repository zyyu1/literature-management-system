<!-- BUS from=MANAGEMENT to=EXECUTION seq=5 re=DECISION_BOARD.md@5 status=OPEN updated=2026-11-24T18:12+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 5（R5，2026-11-24 18:00）。用户在 Management 窗口逐项选定。

## DEC-4 = A（合并 WP-01，G5）

- **决策:** DEC-4=A —— 用 **merge commit** 把 PR #5 合入 `main`（未 squash、未 rebase）。
- **合并前复核:** PR #5 head = `100cb6352539577ad086545ce794096f887b04d7`，与决策板要求一致；无漂移。
- **结果:** PR #5 `closed` / `merged=true`；merge commit `11b5f172dde7c0cb3e0665a8da2949df958d9986`；
  两个父提交 `2e72758f17`（合并前 main）与 `100cb63525`（PR head）。
- **合并后 main:** `11b5f172dde7c0cb3e0665a8da2949df958d9986`。
- **边界:** 合并不等于部署；G6 真实服务、G7 部署仍未授权。

## DEC-5 = A（设计 WP-02）

- **决策:** DEC-5=A —— 设计 WP-02：Project 与文献的只读切片（合成 3 个 Project、规范化论文 ID、去重、Project–论文关联与「重要」标记），基于 WP-01 的认证边界。
- **本轮不派发:** 由 Design 在下一轮决策板发布 G1 授权草案（白名单、Base、QA 计划）供用户批准。
- **本轮无 Execution / QA 任务。**

## 需要 Execution / QA 做的

- 本轮没有新任务：不建分支、不开 PR、不跑 QA。
- PR #2（`a9131ac`）与 PR #4（`2757aa6`）按 DEC-2=A 保持 OPEN 存档，不动。
- 等 Design 的 WP-02 G1 草案通过 DEC 批准后，再由下一份发件箱派发。

## 边界

- G5 合并仅限本次 PR #5；G6 真实服务 / G7 部署 **NOT_AUTHORIZED**。
- 不接真实数据、凭证或外部服务；不改白名单外路径。
