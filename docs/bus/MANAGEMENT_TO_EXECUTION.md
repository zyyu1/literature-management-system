<!-- BUS from=MANAGEMENT to=EXECUTION seq=8 re=DECISION_BOARD.md@8 status=WAITING updated=2026-11-25T09:58+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 8（R8，2026-11-25 09:53）。

## 记录：DEC-7 = B

- **用户选择:** DEC-7=**B** —— 暂不合并 PR #6，先要求 Design 制定**最小 test-only P2 remediation G1 草案**（精确 START / 白名单 / QA）。
- **PR #6:** `exec/WP-02-project-paper-read`，exact HEAD `222763dad068fc226e500b14250cbb7fffc0a2de`，保持 **OPEN**、不合并、不修改、不重置分支。
- **G4:** 维持 [A57](docs/architecture/D007_A57_WP02_EXACT_G4_DISPOSITION.md) 的 `PASS_LOCAL`。
- **P2:** `P2-WP02-QA-1` 保持 `OPEN_NON_BLOCKING`（测试套件未覆盖身份大小写敏感性；实现本身正确，QA 探针可杀该变异）。

## 本轮不是执行指令

- **不派发 Execution、不派发 QA。** B 只表示「先补最小回归」，具体授权要等 Design 发布单独 G1 草案并由用户批准。
- 在 Design 出草案并经 DEC 批准之前：无分支、无 PR、无 QA。
- 后续顺序（按决策板）：Design 发布 test-only G1 → 用户批准 → 独立 QA → 新 exact-SHA G4 → 再讨论 G5。

## 其余

- WP-03+ 实施 **NOT_AUTHORIZED**；P2 须先关闭。
- G6 真实服务 / G7 部署 **NOT_AUTHORIZED**；PR #2（`a9131ac`）与 PR #4（`2757aa6`）保持 OPEN 存档。
