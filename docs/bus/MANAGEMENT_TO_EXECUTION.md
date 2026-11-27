<!-- BUS from=MANAGEMENT to=EXECUTION seq=47 re=DECISION_BOARD.md@43 status=OPEN updated=2026-11-27T10:50+01:00 -->
# Management → Execution（DEC-33=A：P0-STORE 第 1 阶段 G1 派发）

**来源:** `docs/DECISION_BOARD.md` seq 43（R43）任务单。
**用户决定（Design 窗口，2026-11-27 10:42）:** **DEC-32** 存储路线只评估坚果云 WebDAV；
**DEC-33 = A** 批准 **P0-STORE 第 1 阶段 G1**。
**授权:** `D007_A90_P0_STORE_NUTSTORE_WEBDAV_ROUTE_DESIGN.md` §3 Phase 1 与 §9；
**绑定规范文本**：`docs/handoffs/P0-STORE/DESIGN.md`（全文）与 `docs/handoffs/P0-STORE/QA_INSTRUCTION.md`（后续 G3）。
**性质:** 仅本地就绪切片：**探针工具 + 回路模拟 WebDAV**。
**不联网、不开账号、不用任何凭证、不出现真实主机**；第 2–4 阶段与 ACCESS-02/G6 均**未授权**。

## 1. Base / 分支 / 白名单

- Immutable Base：**`663556bc68dc0472f2f392f09ca4bee7c668d2f5`**（A90 设计提交；已核实存在且是 main 祖先）。
  **首次读取须 exit 0 并落盘命令/时间/stdout/stderr**；fresh full clone，`core.autocrlf=false`；
  **不得** rebase、不得从移动的 main 合并。
- 新分支：**`exec/P0STORE-nutstore-probe-r1`** → 新 PR 到 `main`。
- 白名单**仅**：`packages/p0store-nutstore-probe/**` 与 `docs/handoffs/P0-STORE/QA_HANDOFF.md`。
  其余全部冻结（WP-01..04 包、fixtures、`tools/**`、docs）；只允许对冻结的 WP-01 egress 前置守卫做**只读 import**。
  需要改冻结路径、加依赖、`npm install`、lockfile、CI、UI → **STOP**。
- Node **精确 v22.23.5 x64**，仅用内置模块。

## 2. 必须实现（DESIGN §2–§3 为准）

- `src/plan.mjs`：冻结 JSON 运行计划的严格加载器（A90 §4 的 L0–L12；封闭 schema；每步 method、合成 target ID、
  期望 oracle、请求预算估算）；未知键、多余步骤、超上限预算 → 拒绝。
- `src/gate.mjs`：**唯一**出网路径。强制：仅 `https:`；计划内固定的 host/port/路径前缀；
  动词白名单 `PROPFIND`(Depth 0/1)、`GET`、`HEAD`、`PUT`、`OPTIONS`、`MKCOL`(仅运行目录)、逐文件 `DELETE`；
  规范路径（拒绝 `..`、编码分隔符/点、控制字节、双重解码、绝对逃逸）；**不跟随重定向**；
  严格 TLS（系统或计划固定 CA，**永不** `rejectUnauthorized:false`）；滚动 30 分钟预算 ≤100 且
  **预保留 12 个清理/中止名额**；≤20 文件、≤1 MiB/文件、≤20 MiB 总量、≤2 写入者；
  **被拒绝的请求产生零出网**。
- `src/secret.mjs`：凭证仅在运行时从计划指定的一个环境变量读取；绝不进入日志/trace/URL/错误；脱敏需测试证明。
- `src/runner.mjs`：执行步骤；L6 竞态用**两个独立 OS 进程**（child_process）由本地 barrier 释放；
  L8 在 body 发出后中止 socket，再由权威读判定。
- `src/oracle.mjs` / `src/verdict.mjs`：每步 PASS/FAIL/UNRESOLVABLE + A90 §6 判定（GO/PARTIAL/NO-GO）+ §5 STOP 处理
  （中止 → 仅对身份确定的文件做清理 → 隔离记录）。
- `src/trace.mjs`：脱敏 JSONL（method、路径模板+合成 ID、状态、validator 哈希前缀、body SHA-256、耗时、预算计数）。
- **live 模式存在但第 1 阶段惰性**：需要 `--live` + 非 loopback 的计划 host + `accessApprovalId` + 凭证变量；
  缺任一必须**在任何 socket 之前**拒绝，且测试永不设置它们；**代码与已提交计划中不得出现任何真实主机字面量**。

## 3. 模拟服务器（`support/mock-webdav.mjs`，仅 loopback HTTPS）

测试用 CA/证书在测试时用宿主 `openssl` 生成到临时目录，或放在 `test/fixtures/` 并明确标注 TEST-ONLY。
**11 种性格**（按测试选择，`src/` 内无运行时开关）：`strong`、`weak-etag`、`lost-update`、`create-overwrite`、
`stale-read`、`late-ack`、`unresolvable-ack`、`throttle`、`server-error`、`redirect`、`bad-cert`。

## 4. 测试与变异（只报实际数字，不设固定总数）

- **P1-01..P1-13** 全覆盖（含严格上游 WP-01 67、WP-02 44、WP-03 103、WP-04 91 与固定受保护清单），
  按 DESIGN §4 表逐条实现（判定结果须与表一致：strong→GO；lost-update/create-overwrite→NO-GO；
  weak-etag/stale-read→PARTIAL；late-ack 3/3；unresolvable→UNRESOLVABLE→PARTIAL；throttle/server-error/401→立即 STOP 不重试；
  跨进程竞态记录两个 PID、5 轮、恰好一个赢家；live 惰性）。
- mutation driver 在**仓库外** scratch、egress 守卫之后，**≥12 个具名 mutant**，
  每个必须被**预期断言**杀死（崩溃/超时不算），覆盖 DESIGN §4 列出的 13 类。
- 审计脚本放 `scripts/`，不被 `node --test` 发现；**审计负例必须计数中性**。
- 沿用绑定教训：无 waiver flag、严格 TAP、固定清单而非遍历仓库、任何 socket/子进程前先跑 egress 守卫、
  **逐项报告**（A86 DEC-27）。

## 5. 环境

A59 Windows 用户控制离线区间，或已具备资格的 A54/A55 Linux；所有运行时测试在该边界内，
每组前后 guard + probe、脱敏 OS 事实与原始日志，子进程在重连前结束；不得改宿主/网络、装依赖、提权、
使用真实凭证或真实数据。Linux 未跑记 `NOT_RUN`。

## 6. 交付

- PR 新评论：**G2 报告逐项表**（A86 DEC-27）：exact head、diff/白名单清单、命令/计数/退出码、
  受保护清单比对、mutant 表、NOT_RUN 清单；缺失如实标注。
- 写 `docs/handoffs/P0-STORE/QA_HANDOFF.md`（含 exact SHA 与脱敏事实）。
- 然后整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **30**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@47`，含 PR 号、exact SHA、G2 评论 ID、QA 计划路径
  `docs/handoffs/P0-STORE/QA_INSTRUCTION.md`（只传路径）；只提交该文件，`bus(execution): seq 30`，**EXECUTION STOP**。

## 7. 边界

- **不合并、不派 QA**；G2 由 Design 评审，G3 由独立 QA，G4 由 Design。
- **第 2–4 阶段**（用户准备、真实运行、判定）**均未授权**；ACCESS-02 / G6 / G7 未授权；
  P0-STORE 仍 **BLOCKED**；A70/A71 暂停；冻结 UI、PR #2/#4 不动；不改候选白名单、不加依赖。
- 任何越界、需要真实主机/凭证/网络、或冻结路径改动 → **STOP 并上报**，不得自行放宽。
