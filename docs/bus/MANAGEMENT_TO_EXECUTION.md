<!-- BUS from=MANAGEMENT to=EXECUTION seq=36 re=DECISION_BOARD.md@30 status=OPEN updated=2026-11-26T13:26+01:00 -->
# Management → Execution（含：释放独立全量 G3 给 QA）

**来源:** `docs/DECISION_BOARD.md` seq 30（R30）"Management action — 既有授权内释放独立 G3"。
**授权:** `D007_A78_WP03_A74_A76_G2_ACCEPTED_G3_RELEASE.md` §2；QA 内容依 `D007_A72_...` §3、
`docs/handoffs/WP-03/QA_INSTRUCTION.md`、A66/A67 五类矩阵、A74 §2。
**无新 DEC:** 这是 DEC-16=A、DEC-17/18/19=A 之下已批准的下一道门（Design 已在 A78 §1 记录
**G2_ACCEPTED / PASS @ exact HEAD**），不是扩权。

## 对象（不变，零候选改动）

- PR **#7** `exec/WP-03-guarded-r1-writes` → `main`：**OPEN / 未合并 / 3 提交**。
- exact HEAD **`c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`**；
  Base **`1684cea5623c8421e16c328c7f1464e8932d3118`**；
  T=`0fcad9cb6016900d5f7057161619e4a9f2e94b55`，S=`e6b1180e4e3e5790958ae3319af18bba8889ffbc`。
- 期望谱系：3 个单亲提交、22 个新增路径、200/200 Base blob 不变、222 个 tracked 文件，raw bytes 与 modes 一致。
- **QA 零可写候选路径**：不得 commit/push/merge/rebase/reset/force，不得改候选、夹具、测试、
  mutation driver 或任何 `main` 上文件（自己的下一 seq bus 文件与 PR 评论除外）。

## 执行窗口（Execution）本轮要做的

- 本轮 Execution **无新任务**：A76 §2 的 M2/M3 已在 Execution25 完成并被 A78 §1 接受，
  **不得重复 G2**、不得再跑其他矩阵、不得改候选。若被唤醒，只需确认本 seq 是给独立 QA 的释放，
  在 outbox 回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@36`（不附带验证声明），然后 STOP。

## 独立 QA 窗口（由用户单独开启的会话执行）

1. **隔离环境**：独立可写目录与会话，**不得**与 Management 或 Execution 的 clone / poller 共用
   （`D:\deepseek harness\literature-management-system` 与 `D:\deepseek harness\lms-execution\...` 都不可用）。
   poller 状态、日志、clone 全放在自己的目录。先做**本地**可写/scratch 预检；再做 TLS/credential 准备
   （`-c http.sslBackend=openssl` + 既有 CA bundle，证书校验保持开启，不打印凭证，不做探索性 subject 读取）。
2. **首次 subject 读取只有一次**：`git ls-remote <repo> refs/pull/7/head` 必须 **exit 0** 且等于
   `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`，落盘命令/时间/stdout/stderr/退出码；
   失败即 STOP，**无重试豁免**。
3. 随后 fresh full 非 shallow clone，`core.autocrlf=false`、detached 该 HEAD、工作树干净；
   复核 B/T/S 谱系、3M/22A/200/222、raw bytes 与 modes、live authority（PR 仍 OPEN、HEAD 未漂移）。
4. **宿主**：Node **精确 v22.23.5 x64**；A59 Windows（已确立的合格路线）或已具备的 A54/A55 Linux。
   所有运行/scratch 组必须在该实际隔离边界内：OS 事实、守卫、每命令组前后探针映射到各组，
   落盘精确命令/时间/退出码/原始 stdout/stderr；不得自动改动网络或系统、不得安装、不得联网跑测试。
5. **全量新 SHA G3（不是只做 M2/M3；不得沿用任何历史结果）**：
   - `docs/handoffs/WP-03/QA_INSTRUCTION.md` 的 Q3-01..Q3-11 全量 + 自写 probes/oracles/mutants；
   - 语法；WP01 **67/67**；WP02 **44/44**（含 nested 67）；默认 WP03 **103/103**；两个既有 driver 各 **13/13**；
   - 独立 raw HTTP **48**、独立行为 mutant **13**（全部以预期断言杀死，崩溃/超时不算）；
   - A66/A67 五类矩阵全部；候选实际的守卫 M2 与 pinned bypass M3（同一输入证明）；
   - M1/M4 与 A72 要求的全部新 mutant；严格 TAP 正例 transcript / 负例 / 进程状态；旧/新 F1–F3；
     具名 nested proof；diagnostic / control / blank-whitespace / terminal 变体；
   - 独立 pinned main-docs integration（`8589753b4fb0db0dd091cd65b66ab9b1e5a9c762`）：旧拒绝 / 新 103；
     每个候选前后 runtime subtree 与 byte 相等；audit scope 正负例（含 mode/symlink 与 S-scope）；
     literal 51 pin inventory + 负例矩阵。
   - 报告实际计数、输入、精确补丁、断言与退出码；不得把历史结果或 Execution 的验收值带入 G3。
6. **交付**：在 PR #7 发**新评论**（同 exact SHA），引用 `#7191708901`、`#7175752150`、A78 与原 A72 设计；
   然后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **15**（或 latest+1），
   header `re=MANAGEMENT_TO_EXECUTION.md@36`，含 PR / exact SHA / QA 评论 ID / verdict / 关键数字 / P0-P2；
   只提交该文件，`bus(qa): seq 15`，**QA STOP**。
7. 任何环境不可用、漂移、证据缺失或失败 → 如实 STOP/FAIL；不得伪造 PASS；不得把 PARTIAL 写成 PASS。

## 边界

- G4 由 Design 裁定；**G5/G6/G7 NOT_AUTHORIZED**；R2、real persistence、P0-STORE、WP-04、UI、
  真实服务/部署 blocked；A70/A71 继续暂停；P1/P2 仍 OPEN；PR #2/#4 与冻结 UI 不动。
- 不清楚、越界或权限不符 → 在 outbox 写 `status=STOP` 并告知用户。
