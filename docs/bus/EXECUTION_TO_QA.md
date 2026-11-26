<!-- BUS from=EXECUTION to=QA seq=25 re=MANAGEMENT_TO_EXECUTION.md@35 status=STOP updated=2026-11-26T13:15+01:00 -->
# Execution → QA

## STOP — A76 §2 的 M2/M3 已完成；候选零改动；本轮不派 QA

按 `MANAGEMENT_TO_EXECUTION.md` seq 35（DEC-19=A）与 A77 §2 重派，执行 A76 §2 的 **M2、M3 两组且仅两组**。
PR #7 保持 OPEN / 未合并，候选未改；**QA 不启动**：G3 需 Design 先核验 G2，再由 Management 另行释放。

### 1. 收件箱、首次 subject 读取与对象核对（通过）

- 收件箱：`seq=35 re=DECISION_BOARD.md@29 status=OPEN`；正文 DEC-19=A；授权 A77 §2，验证内容 A76 §2 不扩不缩。
- **唯一一次首次 subject 读取**：`git -c http.sslBackend=openssl -c http.sslCAInfo=D:/Git/mingw64/etc/ssl/certs/ca-bundle.crt ls-remote https://github.com/zyyu1/literature-management-system.git refs/pull/7/head`
  - `2026-11-26T11:28:34.919Z` → `11:28:37.055Z`，**exit 0**，stderr 为空，stdout `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86	refs/pull/7/head`。
  - TLS 证书校验保持开启（未用 `http.sslVerify=false`，显式使用既有 CA bundle）；credential helper=manager；未打印任何凭证。
- PR #7 **OPEN / 未合并 / 3 提交**；发评论前复核 live HEAD 仍为 `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`（exit 0）。
- fresh full clone：detached `c40e927…`、`core.autocrlf=false`、222 个 tracked 文件、工作树干净；B=`1684cea…`、T=`0fcad9c…`、S=`e6b1180…`，B..HEAD 恰好 3 个单亲提交、22 个新增路径、200/200 Base blob 字节不变；五个受保护子树哈希与 A74/A76 一致（WP01 `e52af45…`、WP02 `fadc6a7…`、`tools/offline` `2de45ee…`、两个 fixtures `7a74993…` / `415535c…`）。

### 2. 环境（A59 用户控制离线区间，通过）

- Node 精确 **v22.23.5 x64**：`execPath = D:\deepseek harness\lms-execution\runtime\node-v22.23.5-win-x64\node.exe`，`node.exe` SHA-256 `247e9693…bdf38a`；便携 zip 与 nodejs.org 官方 SHA-256 `4a191082…d9a0e3` 一致。
- OS 事实（只读 `Microsoft-Windows-NetworkProfile/Operational`）：**10001 断网 2026-11-26T12:39:41+01:00**；**10000 联网 13:10:09+01:00**。
- 独立探针 4/4 `EGRESS_PROBE=PASS`（`11:39:49.789Z`、`11:40:14.304Z`、`11:40:23.240Z`、`11:40:56.706Z`）：classifier `OFFLINE_PROVEN`（15 适配器、3 个无 IP 的 `Up|Connected` 伪适配器、1 条 stale 默认路由、loopback index 1）；loopback 正/外部负（IPv4 `EHOSTUNREACH`、IPv6 `ENETUNREACH`、LAN `EHOSTUNREACH`、`.invalid` DNS `ENOTFOUND`）；无 proxy/凭证变量；UDP 无回调错误仅记录、不作为隔离证明。
- 全部测试腿 `11:39:58Z–11:40:54Z`，均早于最后一次离线探针 `11:41:03Z`。

### 3. M2（PASS）— 候选自身 Q3-11 模块守卫 + behavioral harness 模块守卫，四项插桩

独立编写的 `instrument.mjs` 在候选模块图加载前用 `--import` 装上：spawn（`spawn_sync` binding）、listen（`net.Server.prototype.listen`）、connect（`net.Socket.prototype.connect`）、request（`http.request`/`https.request`）；每次命中先落盘计数，再在任何真实子进程/套接字/HTTP 之前抛出 `ERR_ASSERTION`。

| 腿 | 入口 | exit | spawn/listen/connect/request | 结果 |
| --- | --- | --- | --- | --- |
| 控制 A | Q3-11 模块守卫，`HTTP_PROXY` 受控拒绝 | 1 | **0/0/0/0** | `EGRESS_PRECONDITION_FAILED: PROXY_ENV`（任何副作用前） |
| 控制 B | harness 模块守卫，`HTTP_PROXY` 受控拒绝 | 1 | **0/0/0/0** | `EGRESS_PRECONDITION_FAILED: PROXY_ENV` |
| mutant A | 仅删 Q3-11 守卫调用 | 1 | **3/0/0/0** | 首个命中即真实入口 `git hash-object --no-filters`（51 条 pinned 路径），另有两次被拦的 `node --test` 子进程；`M2_SPAWN_REACHED …`，`ERR_ASSERTION`，无 signal/超时 |
| mutant B | 仅删 harness 守卫调用，`startServer()` | 1 | **0/1/0/0** | `M2_LISTEN_REACHED …`（127.0.0.1:0），`ERR_ASSERTION` |
| mutant B-req | 同上，`createRawClient().request` | 1 | **0/0/0/1** | `M2_REQUEST_REACHED …`，`ERR_ASSERTION` |
| mutant B-con | 同上，`createRawClient().raw` | 1 | **0/0/1/0** | `M2_CONNECT_REACHED …`，`ERR_ASSERTION` |

- 守卫移除补丁只删一行 `assertPlatformEgressPrecondition();`（其余字节不变），SHA-256：Q3-11 `5f433c81…253e3`、harness `3d40988c…606c`。
- 可达性：Q3-11 守卫之后是 spawn-only 路径，故 listen/connect/request 为 0；harness 守卫之后依次是 listen 与客户端 request/connect，用三个独立 scratch 腿覆盖。全部腿在第一个桩点终止，未执行真实网络或真实危险子进程。

### 4. M3（PASS）— 同一 LF 损坏夹具三态 + oracle 击杀

同一输入：`docs/handoffs/WP-01/fixtures/wp01.v1.json` 追加一个 `0x0A`。完好 `4573 B / sha256 86c47a5a…be65`（git blob `0965c45e…`）→ 损坏/绕过两份均为 `4574 B / sha256 73537b74…4a09`（git blob `bb935b36…`）。

| 状态 | exit | 结果 |
| --- | --- | --- |
| ① 完好夹具 + 未修改测试 | **0** | `ok 1`，`# pass 1 / # fail 0` |
| ② 损坏夹具 + 未修改测试 | **1** | `protected dependency bytes changed from the pinned original Base Git blob IDs (git hash-object --no-filters)`，`ERR_ASSERTION` |
| ③ 损坏夹具 + 精确 bypass 补丁 | **0** | `ok 1`，`# pass 1 / # fail 0`（同一损坏输入仅在绕过该断言后通过） |
| oracle A：frozen fixture oracle | **1** | `Q3-01 frozen fixture raw bytes …`，`AssertionError`，expected `4573` / actual `4574` |
| oracle B：candidate scope audit | **1** | `CANDIDATE_SCOPE_FAILED: CLEAN_CHECKOUT: … M docs/handoffs/WP-01/fixtures/wp01.v1.json` |

- 每个状态只跑命名的 Q3-11 protected-bytes 测试（`--test-name-pattern`）；其他 Q3-11 测试与其他矩阵未重跑。
- bypass 补丁只中和最后一条 protected-inventory 断言（inventory 遍历与 `git hash-object` 计算保留），SHA-256 `f40ad419…ba3cc`；夹具追加补丁 SHA-256 `23ee9424…f8650`。

### 5. 交付

- PR #7 新评论：**#7191708901** — https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7191708901
  （引用 #7175752150、#7176018233；同 SHA；按 M2/M3 给出命令、时间、退出码、原始输出、补丁、计数、夹具哈希与隔离边界。）
- 证据目录：`D:\deepseek harness\lms-execution\logs\run-2026-11-26T11-39-43-428Z\`（每腿 stdout/stderr/record.json、每腿计数文件、四份探针 JSON、`os-network-events.json`、`summary.reconstructed.json`）。
- **QA plan 路径未传递**：本轮不派 QA。

### 6. NOT_RECORDED / 限制

- 交互 runner 在等待联网恢复期间结束，未写出自己的 `summary.json`；上述 verdict 由已落盘的每腿 record/计数与探针原始记录重建（`summary.reconstructed.json` 有标注）。
- 联网恢复时间以 OS 网络事件日志为准（runner 未记录该时间戳）；重连发生在最后一次离线探针之后，所有测试腿此前已结束。
- 未重跑 A74 的 103/67/44、oracle、audit、pins、integration 等矩阵；原始 A74/A76 证据不被本轮改写。

### 7. 边界

- 未派 QA；未授予 G1/G4/G5/G6/G7；未合并；A70/A71 继续暂停；PR #2/#4 与冻结 UI 未动；无候选代码/夹具/测试改动、无候选 commit/push、无新分支/PR、无 merge/rebase/reset/force push；未安装依赖、未提权、未联网跑测试、未修改系统或外部真实数据。
- **EXECUTION STOP**
