<!-- BUS from=MANAGEMENT to=EXECUTION seq=19 re=DECISION_BOARD.md@19 status=OPEN updated=2026-11-25T18:15+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 19（R19）§3。DEC-11=A 仍有效；**A67 是同 SHA 的只读聚焦 QA 续作，无新 DEC、不放开 A66、不增功能**。

## 性质：零可写路径

- **PR / 分支:** PR **#7**，`exec/WP-03-guarded-r1-writes`（OPEN / 未合并）
- **HEAD 必须保持不变:** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`
- **A66 START:** `0fcad9cb6016900d5f7057161619e4a9f2e94b55`；**Base:** `1684cea5623c8421e16c328c7f1464e8932d3118`
- **本单不允许**：任何实现、任何新提交、新建 PR、merge / rebase / reset / force push、任何 tracked 路径修改。

## Execution 本轮只做三件事

1. 核对远程 HEAD 仍精确等于 `e6b1180e…`，工作区干净，既有报告 `#7168708378` 仍在。
2. 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（16），内容：
   - PR #7 / exact HEAD `e6b1180e…`；
   - 声明这是 **A67 只读续作**，不重复全量自测、不产生新的 Execution 报告；
   - QA 计划指向 **`docs/architecture/D007_A67_WP03_A66_FOCUSED_INDEPENDENT_QA.md`**（§3 五类矩阵）；
   - 引用既有报告 `#7168708378` 作为历史证据。
3. **EXECUTION STOP**。若 HEAD 漂移或状态不一致 → 直接 STOP 报告，不自行修复。

## 给 QA 的边界（写进总线即可，由用户另开会话执行）

- 独立 Windows（或 Linux，按 DEC-11 主体专属）会话、fresh full detached clone、首次远程 ref 必须精确等于该 SHA、`core.autocrlf=false`、真实 A59/A54/A55 边界与每组前探针；**禁止联网全套**。
- **保留** seq11 在本 SHA 已通过的主门禁证据（103/67/44、双 driver 13/13、raw 48、行为变异 13、egress 12、candidate auditor OK），**不重复**这些全量/48 探针/13 行为变异。
- **必须**独立补齐 A67 §3 的五类矩阵：strict TAP 正反例与旧/新对照、四个具名绕过 mutant、模拟 integration docs 的旧/新对照 + 该树上的默认 103/103（含嵌套 67/67）、candidate auditor 负例、pinned dependency 负例。
- 用**自己的** scratch 探针与变异，不复用 Execution 的脚本/结果；不改候选、不推送；任何 SHA 漂移或不一致 → STOP。
- 完成后在 PR #7 发新评论（同 SHA，引用 `#7168907120` 与 A67），写 `QA_TO_DESIGN` 下一 seq（12），STOP。

## 边界

- **不得合并**（G5 独立批准）；G6/G7 未授权；R2、真实持久化、WP-04、UI、真实服务/部署均未授权；PR #2/#4 与冻结 UI 不动。
- Linux 未实测记 `NOT_RUN`；不声称双平台认证。
- 本轮 Design 只有在 seq11 与 seq12 两份证据都核验通过后，才会出新的 exact-SHA G4；**不等于合并 PR**。
