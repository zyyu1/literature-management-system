<!-- BUS from=MANAGEMENT to=EXECUTION seq=17 re=DECISION_BOARD.md@17 status=OPEN updated=2026-11-25T16:40+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 17（R17）§2–§3。用户在 Management 窗口选定 **DEC-11=A**（批准 WP-03-R1 synthetic-only G1）。

## 授权与基线

- **授权文件:** `docs/architecture/D007_A65_WP02_G5_VERIFIED_AND_WP03_R1_G1_DRAFT.md`
- **设计 / QA 计划:** `docs/handoffs/WP-03/DESIGN.md`、`docs/handoffs/WP-03/QA_INSTRUCTION.md`（均在 main，作为 authority 阅读；执行检出以 Base 为准）
- **Exact immutable Base:** `1684cea5623c8421e16c328c7f1464e8932d3118`（已含合并后的 WP-01/WP-02 两个包）
- **新分支:** `exec/WP-03-guarded-r1-writes`，向 `main` 开**新 PR**
- 从 Base 起一个增量分支；不得 rebase 或把移动的 main 合入。

## 唯一可写路径

- `packages/wp-03-guarded-r1-writes/**`
- `docs/handoffs/WP-03/QA_HANDOFF.md`

**全部只读冻结:** WP-01 与 WP-02 包、两者的 fixture、既有 helper/manifest（A60/A61/A62 已验收）、mutation driver、`tools/`、UI、历史证据、CI、依赖、PR #2/#4。
若需要 hook 或重构既有包才能实现 → **STOP 回 Design**，不得自行改。

## R1 范围（A65 §2）

- 只在隔离的合成内存 HTTP 契约替身中实现**受控写入**：Project 创建、改名、归档、恢复；全局 Reading Status；关联级 Important；精确 revision、operation identity、CAS/operationId/UNKNOWN 语义与故障/结果测试。
- **R2 动作一律禁用**：Project 永久删除、**Current** unlink、All unlink —— 只允许实现「拒绝」的负向控制；它们需要单独的 step-up / intent / UI-AMEND 与持久化决策。
- 不做批量写入、笔记、引用、导入、新 UI、真实 provider、真实账户或持久化存储。**R1 通过不代表 WP-03 完成。**

## 环境与隔离

- Node **精确 v22.23.5 x64**；无外部依赖、无 `npm install`、无 lockfile、无 CI、无网络/系统设置改动。
- **本包专属**的 A59 等效资格（因 DEC-11=A 生效）：Windows 原生优先；Linux 走 A54/A55 wrapper；两种都由用户另开独立会话做 G3。不构成对 A47 R4 的普遍修订。
- 每组命令前独立探针；所有测试/服务器/子进程都在 loopback-only 边界内；不得自动改机器网络或提权。另一平台未实测记 `NOT_RUN`，不声称双平台。

## 测试与证据

- 按 `docs/handoffs/WP-03/QA_INSTRUCTION.md` 覆盖 **Q3-01..Q3-11**；上游回归 WP-01 **67/67**、WP-02 **44/44**、committed driver **13/13**，全部 exit 0、零 skip/todo。
- 独立 raw HTTP 探针（自己写，不复用执行测试结论）；R2 负向控制的具名断言；至少一个具名 mutant 被杀。
- A47 LIGHT：确定性全量各跑一次；记录实际命令、计数、退出码与环境事实。

## 交付

- 推分支、开 PR、发 Execution 报告（精确 SHA、diff、计数、环境与探针、限制）。
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq，然后 **EXECUTION STOP**。

## 边界

- **不得合并**（G5 需你单独批准）；G6/G7 **NOT_AUTHORIZED**；不接真实数据/服务；不部署。
- P0-STORE 未 GO；真实持久化写入仍阻断；R2 与 WP-04 均未授权。
- PR #2（`a9131ac`）、PR #4（`2757aa6`）与冻结 UI 不动。
