<!-- BUS from=MANAGEMENT to=EXECUTION seq=43 re=DECISION_BOARD.md@37 status=OPEN updated=2026-11-26T20:16+01:00 -->
# Management → Execution（DEC-25=A：WP-04-R1 G1 派发）

**来源:** `docs/DECISION_BOARD.md` seq 37（R37）§2，用户选定 **DEC-25 = A**。
**授权（G1）:** `D007_A85_WP04_R1_G1_DRAFT.md` §3；**绑定规范文本**：
`docs/handoffs/WP-04/DESIGN.md`（全文为准）与 `docs/handoffs/WP-04/QA_INSTRUCTION.md`（后续独立 G3 计划）。
**性质:** 新工作包实现授权（唯一 G1）。**零真实存储、零 UI、零 Zotero/Provider、零部署**。

## 1. Base / 分支 / 白名单（不可动）

- Immutable execution Base：**`bcc4eaad5183c923f782da0475eea1751be2de3b`**（含 WP-03 merge `6cc8e2a` 并经 A84 回归验证）。
  **不得** rebase、不得从移动的 main 合并。
- 新分支：**`exec/WP-04-research-notes-r1`** → 新 PR 到 `main`。
- 白名单**仅**：`packages/wp-04-research-notes-r1/**` 与 `docs/handoffs/WP-04/QA_HANDOFF.md`。
- 冻结只读：`packages/wp-01-*`、`packages/wp-02-*`、`packages/wp-03-*`、两个 fixtures、`tools/**`、
  其余全部 docs 与所有其他路径。允许对 WP-01/02/03 已导出模块做**只读 ES import**；
  一旦需要编辑或 hook 它们 → **STOP**。
- 无依赖、无 `npm install`、无 lockfile、无 CI、无 UI、无 provider、无网络或系统设置改动。
  Node **精确 v22.23.5 x64**。

## 2. 必须实现的内容（DESIGN.md 为准，这里只列硬约束）

- 仅三条路由（新 server，127.0.0.1 临时端口，未显式 listen 前惰性）：
  `GET .../research-note`、`PUT .../research-note`（整篇 CAS 写）、`GET .../research-note/export`（**仅已保存版本**）。
  无 DELETE/PATCH/批量/quote/Project/status/Important/import/provider 路由；405/404/中性 403 与 WP-02/03 一致。
- 五个键固定顺序 `researchQuestion / argumentsAndContent / theoriesAndMethods / contributionsAndInnovations / limitations`；
  每次写必带全部五个 JSON 字符串，缺失/多余/重复/非字符串/null → 422；无逐字段 PATCH。
- **字节保真**：JSON 解码后按原样存储与返回，不做 Unicode 归一化、trim、换行转换（CRLF/LF/CR 原样）、tab 展开或 HTML 转换。
  唯一拒绝项：孤立代理/非法 UTF-8、U+0000、单字段 >16 KiB 或合计 >48 KiB。
- 导出严格按 DESIGN §5：`text/markdown; charset=utf-8`、`Content-Disposition` 的 ASCII fallback + `filename*=UTF-8''`、
  `Cache-Control: no-store`、文件名 `<safe-title>_<itemKey>.md` 的清洗/保留名/120 字节上限规则、固定模板正文、
  空字段保留标题+空行、缺失元数据行省略、输出末尾恰一个 LF；导出不改 revision、不写 ledger；无已保存 note → 409 NO_SAVED_NOTE。
- 安全与结果模型沿用 WP-03：loopback、WP-01 限流/大小（64 KiB 硬上限）、Origin、Fetch Metadata、`application/json`、
  Session/CSRF/role/scope 在披露 revision 或 ledger 之前判定；Workspace 只读且导出中性 403；
  operationId ledger（改指纹 → 409 OPERATION_ID_REUSE，精确重放不二次派发）；
  四结果矩阵（CONFIRMED / conflict 412/428 / 202 / 504 / socket drop）用**测试注入**，无运行时 flag；
  UNKNOWN 绝不显示 saved 或 definite failure，target 隔离直到读确认。
- WP-03 教训**从第一个提交起**强制：无 waiver flag、严格 TAP 语法、**固定受保护清单**（不遍历仓库）、
  候选审计脚本放在 `node --test` 发现范围之外、任何 socket/子进程之前先跑冻结的 egress 前置守卫。

## 3. 测试与证据（只报实际数字，不设固定总数）

- 必须覆盖 DESIGN §8 的 **Q4-01…Q4-12**（含严格上游：WP-01 67/67、WP-02 44/44 嵌套 67、WP-03 103/103）；
- mutation driver 在**仓库外** scratch 树、在 egress 前置守卫之后，**≥12 个具名 mutant**，
  每个都必须被**预期断言**杀死（崩溃/超时不算）；覆盖 DESIGN §8 列出的具名类别；
- 代码清洁、`src/` 与 `support/` 分工、README、`package.json`（private、type module、engines 22.23.5、空依赖、`"test": "node --test"`）、
  `scripts/verify-candidate-scope.mjs`（Base/白名单/受保护审计，不被测试发现）、`docs/handoffs/WP-04/QA_HANDOFF.md`；
- 环境：A59 Windows 用户控制离线区间或已合规 A54/A55 Linux；所有测试与子进程在隔离边界内，
  组前后 guard+probe、脱敏 OS 事实与原始日志；**不得在联网状态跑测试**；不得改系统/装依赖/提权；
  Linux 未跑记 `NOT_RUN`。首次 subject 读取与 TLS 准备按既有标准（openssl + CA、校验开启、无重试豁免）。

## 4. 交付

- PR 新评论（同 exact SHA）给出完整 **G2 报告**：Base/分支/exact SHA、diff 与白名单自证、
  受保护清单比对、每条命令/计数/退出码、mutation 击杀清单、隔离与探针映射、NOT_RUN 清单；
  任何缺失如实写 `NOT_RUN`/`NOT_RECORDED`；失败如实报 `FAIL`，不得修补后谎称通过。
- 然后整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **28**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@43`，含 PR 号、exact SHA、G2 报告评论 ID、
  以及 **Design QA 计划路径** `docs/handoffs/WP-04/QA_INSTRUCTION.md`（只传路径，不传测试内容）；
  只提交该文件，`bus(execution): seq 28`，**EXECUTION STOP**。

## 5. 边界

- **不得合并**；G2 由 Design 评审，G3 必须由独立 QA 按 QA_INSTRUCTION 执行，G4 由 Design 裁定，
  **G5 另行 DEC**。本轮不授予 G5/G6/G7。
- P0-STORE 仍 blocked；真实持久化、真实身份、UI/UI 修订、Typora 认证、Key Quotes、Zotero API、
  本地草稿/恢复/自动保存、Export Local Draft、Provider、部署一律**不做**。
- 任何需要触碰冻结路径、增加依赖或扩范围的情形 → **STOP 并上报**，不得自行放宽。
