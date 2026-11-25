<!-- BUS from=MANAGEMENT to=EXECUTION seq=29 re=DECISION_BOARD.md@23 status=OPEN updated=2026-11-25T20:40+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 23（R23），用户选定 **DEC-15 = C**：暂停 A70 Node24 迁移，回原 PR #7 做 Node22 的 A67 零可写专项。
**A69 的运行时处置仍有效**：PR #7 基线保持 **Node 精确 v22.23.5**。

## 性质：零可写 tracked 路径

- **PR #7**，分支 `exec/WP-03-guarded-r1-writes`，**HEAD 必须保持** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`
- A66 START `0fcad9cb6016900d5f7057161619e4a9f2e94b55`；Base `1684cea5623c8421e16c328c7f1464e8932d3118`
- **不允许**：任何实现、新提交、新 PR、merge/rebase/reset/force push、tracked 路径修改。
- A70 的迁移分支/PR **不得创建**。

## Execution 本轮只做三件事

1. 核对远程 HEAD 仍精确等于 `e6b1180e…`、工作树干净、既有报告 `#7168708378` 仍在；PR 仍 OPEN/未合并。
2. 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq（19），内容：
   - PR #7 / exact HEAD；声明这是 **A67 只读续作**，不重跑全量、不产生新的 Execution 报告；
   - QA 计划指向 **`docs/architecture/D007_A67_WP03_A66_FOCUSED_INDEPENDENT_QA.md` §3**；
   - 引用既有报告 `#7168708378` 与既有 QA 评论 `#7168907120`。
3. **EXECUTION STOP**。若 HEAD 漂移 → STOP 报告，不自行修复。

## 给 QA 的任务（写进总线，由用户另开会话执行）

**环境**：独立 Windows 会话（可同物理机，但必须单独开、不得是 Execution 会话或其子代理）；
Node **精确 v22.23.5 x64**（本机已有便携版 `.work/node22/node-v22.23.5-win-x64/`，用它并记录实际路径与版本）；
**A59 离线区间**：由用户切断全部外部网络路径（以太网/Wi‑Fi/移动/VPN/虚拟网卡），保留回环，
隔离期间与结束后记录脱敏网卡/路由清单；所有测试/服务器/子进程在该区间内；禁用代理变量；
不得自动改机器网络或提权。若无法取得离线区间 → `ENVIRONMENT_BLOCKED` / STOP。

**预检**：首次远程 ref 读取一次 exit 0 且等于该 SHA；fresh full clone、detach、
`core.autocrlf=false`、工作树干净；核对父/A66 START/Base 祖先、1 个增量提交、
恰好 6 个 A66 路径、22 个累计新增、0 个 Base 修改/删除；受保护文件字节不变。

**保留、不重跑**（均来自 QA seq11 在同一 SHA 的已通过证据）：
WP-03 103/103、WP-01 67/67、WP-02 44/44、两个 driver 13/13、raw 48 探针、13 个行为变异、egress 探针、候选审计 OK。
本聚焦轮**不重复**这些全量与探针。

**必须独立补齐 A67 §3 五类矩阵**（全部自写 scratch，不复用 Execution 脚本/结果）：
1. strict TAP 正反例与旧/新对照（畸形/部分/重复/缺失 summary、plan、not‑ok、skip/todo、错误计数、非零/信号/超时），含嵌套 WP01 证明；
2. 四个具名绕过 mutant：上游失败容忍、pre-child guard 缺失（用 stub 计数证明守卫先于 spawn/listen/connect）、pinned 完整性绕过、candidate audit 绕过；必须以预期断言失败，不得以崩溃/超时代替；
3. 模拟 main-only 文档的旧/新对照；并在该集成树上完整跑**默认 103/103**（含嵌套 67/67）；
4. candidate auditor 负例：多余已提交/未跟踪路径、Base 字节被改、Base 路径缺失、越权增量；
5. pinned dependency 负例：上游多余/缺失/改动（含 evidence）、夹具改动、`tools/offline` 改动。
**禁止在联网状态跑全套**（包括“为了演示被拒绝”）；只允许零流量守卫式的单独检查。

**交付**：在 PR #7 发一条新评论（同 SHA，引用 `#7168907120` 与 A67），逐类列出实际输入、命令、
断言/错误原文、退出码、正负例计数、旧/新对照、mutant 击杀断言、findings/NOT_RUN、干净树；
然后写 `docs/bus/QA_TO_DESIGN.md` 下一 seq（13），STOP。

## 边界

- **不得合并**（G5 独立批准）；G6/G7 未授权；R2、真实持久化、WP-04、UI、真实服务/部署未授权；
  PR #2/#4 与冻结 UI 不动；A70 迁移保持暂停，等合格宿主。
- Design 只有在核验 seq11 + 本轮新 seq 两份证据后，才出该 SHA 的 G4；**不等于合并 PR**。
- 不把 Node24 上的任何结果、也不把 Node22 的历史数字，当作新证据混用。
