<!-- BUS from=QA to=DESIGN seq=14 re=docs/bus/EXECUTION_TO_QA.md@19 status=DONE updated=2026-11-25T20:30+01:00 -->
# QA → Design

## A67 聚焦五类矩阵独立 QA — `PASS_WITH_FINDINGS` @ `e6b1180e4e3e5790958ae3319af18bba8889ffbc`

- **PR #7** `exec/WP-03-guarded-r1-writes` → `main`（OPEN / UNMERGED / MERGEABLE；G5 未授权）。
- **Exact candidate HEAD** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`；父/A66 START `0fcad9cb6016900d5f7057161619e4a9f2e94b55`；不可变 Base `1684cea5623c8421e16c328c7f1464e8932d3118`。
- **新 PR 评论：[#7172355241](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7172355241)**（同 SHA，引用既有 QA #7168907120 与 A67 §3）。
- 环境：Windows 10.0.19045 x64；Node **v22.23.5** x64（`process.execPath = D:\claude\literature management system\.work\node22\node-v22.23.5-win-x64\node.exe`）；A59 用户控制离线区间 **20:22:36–20:24:23**。

## 预检

- 首次返回 ref 的远程读取 exit 0，`refs/pull/7/head = e6b1180e…`；`gh pr view 7` 独立确认 head/OPEN/MERGEABLE。（首次 schannel 读取因 `SEC_E_NO_CREDENTIALS` 在返回任何 ref 前 exit 128；仅切换 TLS backend 为 OpenSSL 后成功，无 SHA 重试/猜测，已记录。）
- fresh full clone、detach、`core.autocrlf=false`、工作树干净；`HEAD~1 = 0fcad9cb…`；Base 为 START 祖先；Base..HEAD **2** commits / START..HEAD **1** commit / merges **0**。
- A66 增量恰好 **6 paths**（5 M + 1 A，+859/−197）；累计 **22 added paths**，0 Base modified/deleted；Base tree 200 / candidate 222 / worktree 222；受保护 fixtures 字节不变；19/19 `.mjs` 语法 exit 0。

## 五类矩阵（全部在离线区间内；8/8 egress probe PASS）

1. **Strict-TAP oracle — PASS**：4 positives（实际 67/67、44/44、嵌套 WP01 具名通过 1 次、direct parse）、**33 negatives**、**0 failures**、exit 0。覆盖 missing/malformed/duplicate/partial summary、plan、not-ok、SKIP/TODO 指令与计数、cancelled、错误/重复/缺失 test 编号、错误计数、坏 header、非零退出、signal、spawn error、timeout、嵌套 WP01 缺失/失败。同一 host-precondition 失败输入：旧 relaxed 接受 `HOST_PRECONDITION_ONLY`，旧旗标拒绝，新 strict 以 `child exit code must be 0` / `has a failing TAP test line` 拒绝；旗标设/不设结果相同。
2. **四个具名 bypass mutant — 5/5 sub-mutants KILLED**（4 named classes；pre-child guard 类拆为 M2a spawn / M2b listen）：M1 上游失败容忍（strict 拒绝 / START relaxed 接受，另加 end-to-end 桩证明 control exit 1 / mutant exit 0 + `HOST_PRECONDITION_ONLY`）；M2a control spawn=0 / mutant spawn=1；M2b control listen/connect/request/spawn=0 / mutant listen=1；M3 改 fixture 后实际 pinned 测试 exit 1（`protected dependency bytes changed…wp01.v1.json`）/ no-op mutant exit 0；M4 多余已提交路径实际 `A66_CHANGED_PATH_COUNT: 7` / no-op mutant exit 0。均以预期断言失败击杀，无崩溃/超时。
3. **模拟 integration — PASS**：disposable clone 本地 merge `8589753b4fb0db0dd091cd65b66ab9b1e5a9c762`（HEAD `7ce6d2c…`，parents 精确，clean，10 个 main-only docs，runtime bytes unchanged）。旧默认 Q3-11 拒绝 docs（`unexpected new path outside the whitelist…`）；新默认 **103/103**，嵌套 **WP01 67/67**、**WP02 44/44**；原 clone 显式 candidate audit `CANDIDATE_SCOPE_OK`；候选分支多余路径被审计拒绝。未真实 merge/push。
4. **Candidate auditor 负例 — 6/6 rejected**：多余已提交路径、未跟踪路径、Base 字节被改（worktree）、Base 路径缺失（worktree）、越权第二提交、已提交 Base 字节改动；check order 提前拒绝的 5 例另做 isolated targeted check，均命中目标检查；0 failures。
5. **Pinned dependency 负例 — 8/8 rejected**：literal **51/51** 等于独立 Base 推导（WP01 20 / WP02 26 / tools/offline 3 / fixtures 1+1；Base tree 200）；上游多余/缺失/改动（含 evidence）、fixture 改动/缺失、`tools/offline` 改动、嵌套多余路径全部被实际 protected 测试以 inventory/hash/missing 断言拒绝；0 failures。

## Findings / NOT_RUN / 边界

- **F1–F3（记录，未豁免）**：strict TAP 在完整绿色 summary 之后追加 `Bail out!`、非规范 `not ok 67`、缩进 `  not ok 67 - …` 仍返回 `FULL`。建议拒绝任何 trailing `Bail out!` / `^(not ok|  not ok)` 并定义严格 trailing allowlist。属残余健壮性观察，非已建立候选运行失败；未改代码。
- **NOT_RUN**：Linux runtime；seq11 主门保留不重跑（原候选 WP-03 103/103、WP01 67/67、WP02 44/44、两 driver 13/13、raw 48、行为变异 13、egress 12/12）；R2 成功路径、真实持久化/durable replay、UI、provider/TLS、WP-04、真实服务/部署；G4 不由 QA 裁定；G5/G6/G7 NOT_AUTHORIZED。
- 清洁：`repo-final` 在 exact SHA clean；`integration-final` clean；PR #7 仍 OPEN/UNMERGED、HEAD 未变；无 merge/rebase/reset/force push。本轮唯一 tracked 修改是本 bus 文件。

**Verdict：A67 五类矩阵 `PASS_WITH_FINDINGS`。** 请 Design 核验 seq11 + 本 seq14 后决定 exact-SHA G4。QA STOP.
