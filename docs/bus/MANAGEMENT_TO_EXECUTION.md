<!-- BUS from=MANAGEMENT to=EXECUTION seq=51 re=DECISION_BOARD.md@49 status=OPEN updated=2026-11-27T15:27+01:00 -->
# Management → Execution（DEC-39=A：P0-STORE R3 上线准备切片 G1 派发；并记录 R48）

## 0. 记录同步（用户在 Design 窗口作出的决定，不是 Management 推断）

- **R48 / A95**：P0-STORE R2 判定修正 **G3 VERIFIED / G4 PASS_LOCAL** at exact
  `b6fec8e3b0ec217b142b428080454588e6866744`（QA22 `#7220233158`）；**LIM-P0S-1 已关闭**；
  第 2 阶段 **PHASE2_READY**（U5/U6 在运行当天完成）。R48 **无派单**。
- **DEC-39 = A**（R49 / A96）：批准 **P0-STORE R3 上线准备切片 G1**。
  **R3 不授权任何真实请求，任何人都不设置真实凭证**；真实运行（第 3 阶段 / ACCESS-02 / G6）仍需之后单独批准，
  且必须点名 R3 的 exact SHA。

## 1. 本轮派单（Execution，R3）

**授权文本:** `D007_A96_P0STORE_R3_LIVE_READINESS_G1.md`；
**绑定规范:** `docs/handoffs/P0-STORE/R3_LIVE_READINESS.md`（从 `main` 读取，全文为准）。

- **同一分支** `exec/P0STORE-nutstore-probe-r1`（**PR #9**，保持 OPEN），基于 exact
  **`b6fec8e3b0ec217b142b428080454588e6866744`** 追加**单亲**提交；
  Base 仍 `663556bc68dc0472f2f392f09ca4bee7c668d2f5`；**不 rebase、不合并、不 force**。

### 允许改（R3_LIVE_READINESS §1）

`src/runner.mjs`（**仅** live 授权与运行时检查）、`src/plan.mjs`（**仅**为 `mode:"live"` 接受固定 live 主机）、
新增 `plans/live-nutstore-plan.json`、`test/p1-01-plan-loader.test.mjs`、
`test/p1-12-live-inert.test.mjs`（改写为 live 门控）、新增 `test/p1-15-live-gating.test.mjs`、
`scripts/mutation-check.mjs`、`scripts/verify-candidate-scope.mjs`（仅已批准路径清单）、`README.md`、
`docs/handoffs/P0-STORE/QA_HANDOFF.md`。
**若还需改其他测试文件的期望** → 先在 G2 报告列出并 **STOP 等 Design 确认**，不得直接提交。

### 逐字节不变（相对 `b6fec8e`）

`src/gate.mjs`、`src/secret.mjs`、`src/trace.mjs`、`src/oracle.mjs`、`src/verdict.mjs`、`support/`、
`plans/example-plan.json`。

## 2. Live 授权（7 条同时满足，且在任何 secret 读取 / gate / socket / 子进程之前判定）

1. CLI `--live`；
2. 计划 `mode:"live"`、`protocol:"https:"`、`host` **精确** `dav.jianguoyun.com`、`port` 443、
   `probeParent` `/dav/LMS-P0STORE/`、`pathPrefix` = `/dav/LMS-P0STORE/<runId>/`、`pinnedCaFile: null`
   （系统信任库、严格 TLS、不跟随重定向——gate 行为不变）；
3. CLI `--approval <id>`，格式 `^P0STORE-ACCESS-02-\d{8}-[A-Za-z0-9]{4,16}$`；
   **已提交的 live 计划里 `accessApprovalId: null`**（提交的文件永不能自授权），CLI id 只写入 trace 头（非机密）；
4. `runId` 运行时由 16 随机字节（hex）生成、永不复用；计划自带 runId → 拒绝；
5. 凭证环境变量 `P0STORE_WEBDAV_PASSWORD` 存在且非空（**在 1–4 全部通过之前不得读取其值**）；
6. `process.version === 'v22.23.5'` 且 `process.arch === 'x64'`，否则 `NODE_RUNTIME_MISMATCH`；
7. 每种失败有**各自的原因码**且**零传输调用**；`PHASE1_LIVE_ENABLED` 被这些检查替换/移除。

- **真实主机字面量只允许出现两处**：`plans/live-nutstore-plan.json` 与 `src/plan.mjs`/`src/runner.mjs` 中**一个**固定主机常量；
  测试里的“无真实主机”扫描必须**恰好允许**这两处、拒绝其他任何出现。
- 首个请求前必须打印**脱敏预检摘要**（host/port/prefix/runId/approvalId/预算/文件上限/Node 版本），任何不符以非零退出。

## 3. 测试（全部离线）

- **P1-12 / P1-15 live 门控矩阵**：7 个条件逐个缺失或错误 → 各自原因码、**零传输调用**、**未读凭证**；
  错误主机变体（`dav.jianguoyun.com.evil`、`jianguoyun.com`、IP 字面量、未规范化的全大写等）、错误端口、
  前缀越出 `/dav/LMS-P0STORE/`、已提交 approval 非 null、approval 格式非法、计划自带 runId、Node 版本不符（打桩）。
- **全部条件满足 + 注入计数/桩传输（无 socket）**：首个计划请求的目标必须**精确**为
  `https://dav.jianguoyun.com:443/dav/LMS-P0STORE/<runId>/…`（L0 语义）；金丝雀凭证**绝不**出现在 trace/log/error。
- 既有 Phase 1 与 R2 测试语义不变；**P1-13 上游 67/44/103/91 与受保护清单不变**。
- **≥5 个新具名 mutant**：接受缺失 approval、接受不匹配/畸形 approval、接受不同主机、
  接受越出前缀、跳过 Node 运行时检查、在授权前读凭证；**M01–M16 仍须全部击杀**。

## 4. 环境与交付

- Node **v22.23.5 x64（完整路径、普通权限）**；A59 Windows 离线区间或已具备资格的 A54/A55 Linux；
  每组前后 guard+probe、原始日志；子进程在重连前结束；不联网跑测试、不装依赖。
- **不得接触真实坚果云主机、不得设置任何真实凭证**；无真实请求、无真实数据。
- PR #9 发**一条新评论**：A86 DEC-27 **逐项表** G2 报告（exact head、允许改动 diff、冻结文件字节证明、
  命令/计数/退出码、受保护清单、mutant 表、`NOT_RUN`）。
- 然后整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **33**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@51`，含 PR 号、exact SHA、G2 评论 ID、QA 计划路径
  `docs/handoffs/P0-STORE/R3_LIVE_READINESS.md` §5（只传路径）；只提交该文件，`bus(execution): seq 33`，**EXECUTION STOP**。

## 5. 边界

- **不合并、不派 QA、不做真实运行**；G2 由 Design 评审，定向 G3 之后由 Management 释放。
- **第 3 阶段真实运行 / ACCESS-02 / G6、G7 均未授权**；P0-STORE 仍 **BLOCKED**；A70/A71 暂停；
  冻结 UI、PR #2/#4 不动；PR #9 保持 OPEN。
- 任何越界、需要真实主机/凭证/网络、或需要改冻结文件 → **STOP 并上报**。
