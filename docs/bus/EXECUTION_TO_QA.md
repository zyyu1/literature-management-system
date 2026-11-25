<!-- BUS from=EXECUTION to=QA seq=23 re=MANAGEMENT_TO_EXECUTION.md@33 status=STOP updated=2026-11-25T23:10+01:00 -->
# Execution → QA

## A75 聚焦补证 — 三处原文已贴；M3 缺“绕过下接受”一半、M2 缺 connect/request（STOP）

**新 PR 评论：[#7176018233](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7176018233)**（同 exact HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`；引用 #7172989882、#7173685843、A74 报告 #7175752150；未编辑任何既有评论）。

### 本轮只读整理，未跑新测试

- 对象不变：PR #7 OPEN/未合并，HEAD `c40e927…`；候选未改、无新提交/分支/推送。
- 仅摘录 A74 已落盘日志与现存的 disposable scratch 树；未重跑、未补造。

### 1. M3（pinned 完整性绕过）

- 记录的施加内容：在 disposable mutant clone 中对 `docs/handoffs/WP-01/fixtures/wp01.v1.json` 追加一个 LF 字节，再跑实际 Q3-11 protected 测试（`scripts/bypass.mjs` lines 128–145）。
- 记录结果：`{"controlExit":0,"mutantExit":1,"mutantHasByteChange":true,"killed":true}`（`logs/09-bypass/bypass.out.txt`、`scratch/bypass/bypass-results.json`）。
- **缺失**：日志中没有“同一损坏夹具在 bypass 变异下被接受”的那一半；没有 bypass patch 原文；完整断言原文也未落盘（仅布尔 substring 检查）。故该项为 **`NOT_RECORDED`**，不能声称 M3 绕过完整性已被证明。

### 2. M2（pre-child guard 缺失）

- control：`m2-control-counters.json` = `{"spawn":0,"listen":0,"guardReason":"EGRESS_PRECONDITION_FAILED: PROXY_ENV"}`；计数来源 `scratch/bypass/m2-control.mjs`（实际 guard + `http_proxy` 强制拒绝）。
- mutant：`m2-mutant-counters.json` = `{"spawn":1,"listen":1}`；来源 `scratch/bypass/m2-mutant.mjs`（无 guard）。
- **缺失**：`connect` / `request` 两项从未插桩，计数为 **`NOT_RECORDED`**；mutant 侧没有断言失败原文（脚本只写计数、exit 0），也是 **`NOT_RECORDED`**。因此只能证明 spawn/listen 的先后，不能证明四项全部为 0。

### 3. Integration（父子提交与运行时哈希）

- 从现存 disposable 树只读得到（非新运行）：
  - old T + pinned docs：merge HEAD `f656203d8915e328cabb1153e4295c95b6b9d36f`，parents `0fcad9cb…`（T）与 `8589753b4fb0db0dd091cd65b66ab9b1e5a9c762`。
  - new HEAD + pinned docs：merge HEAD `f8dcad8664694914a69e9fc8a450af0f019441b0`，parents `c40e927…` 与 `8589753b…`。
- 记录的 runtime 对照是 **Git subtree object ID**（命令 `git rev-parse HEAD:<path>`），不是逐文件 blob 哈希；5 个 runtime 树 old/new 全部相同（WP01 `e52af45a…`、WP02 `fadc6a7a…`、tools `2de45ee9…`、两 fixtures `7a74993d…` / `415535cb…`）。逐文件哈希 **`NOT_RECORDED`**。
- 103/103：commit `f8dcad8…`，目录 `scratch/integration/new-HEAD/packages/wp-03-guarded-r1-writes`，命令 `node --test`（Node v22.23.5），exit 0，`tests=103 pass=103 fail=0`，嵌套 `nested67=true` / `nested44=true`；日志 `logs/10-integration/integration.out.txt`。
- old/default 拒绝原文：`unexpected new path outside the whitelist: docs/architecture/D007_A65_WP02_G5_VERIFIED_AND_WP03_R1_G1_DRAFT.md`（`# fail 1`）。

### 处置

- A74 的 candidate gates/matrices 仍按原报告；但 A75 要求的三项完整原文中，M3 的“bypass 下接受”一半、M2 的 connect/request 计数与断言原文、integration 的逐文件哈希均为 **`NOT_RECORDED`**。
- 未自行补跑（A75 §2 禁止）；如 Design 需要这些证据，应另出决定。
- 状态 **STOP**；不派 QA，不构成 G4/G5。G5/G6/G7 NOT_AUTHORIZED；P1/P2 仍 OPEN；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 未触碰；A70/A71 继续暂停。
