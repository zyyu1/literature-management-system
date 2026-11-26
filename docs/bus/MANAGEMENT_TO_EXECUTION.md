<!-- BUS from=MANAGEMENT to=EXECUTION seq=35 re=DECISION_BOARD.md@29 status=OPEN updated=2026-11-26T12:10+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 29（R29）§2，用户选定 **DEC-19 = A**。
**授权:** `D007_A77_WP03_A76_ENVIRONMENT_RECOVERY_DRAFT.md` §2（环境恢复与重派方式）；
验证内容仍是 `D007_A76_WP03_A74_TARGETED_M2_M3_VALIDATION_DRAFT.md` §2（**不扩不缩**）。
**重派依据:** Execution24 在**首次 subject ref 读取之前**即停止；失败的是 `refs/heads/main`
（schannel `SEC_E_NO_CREDENTIALS`, exit 128）。`refs/pull/7/head` 的首次 subject 读取为 `NOT_RUN`，
候选 SHA 无漂移，M2/M3 未执行，无产品缺陷结论。因此本轮仍按**首次** subject 读取对待，
一旦失败**同样没有重试豁免**。

## 对象（不变）

- PR **#7** `exec/WP-03-guarded-r1-writes` → `main`，**OPEN / 未合并 / 3 提交**。
- exact HEAD **`c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`**；
  immutable Base **`1684cea5623c8421e16c328c7f1464e8932d3118`**。
- **零候选改动**：不得改代码、不得向候选分支 commit/push、不得新建分支或 PR、
  不得 merge / rebase / reset / force push。
- 白名单：本轮**无代码白名单**。只允许写 PR #7 的一条新证据评论，以及你自己在本 bus 文件的下一 seq。

## 环境（A77 §2；任一不满足即 STOP，不得临时放宽）

1. **独立可写工作目录**：必须使用你本次会话专用的新目录，**不得**使用或写入共享 clone
   `D:\deepseek harness\literature-management-system`（Management 与 QA 窗口正在其中轮询）。
   旧 clone 保持原样：不得清理其他窗口的文件、不得停止其他窗口的进程或 poller。
2. 先用**本地无害探测**确认 scratch/日志目录可写，再做任何 subject 远程读取；受阻即 STOP。
3. 允许用已授权的联网 Git 访问做派单核对与预检。**首次** subject 尝试之前，先备好
   **命令级** TLS backend：`git -c http.sslBackend=openssl ...`，配合既有可用 credential helper，
   **证书验证必须保持开启**；不得打印任何凭证，不得用失败的探索性 subject 读取去试探。
4. **唯一一次**首次 subject 读取：`git ls-remote <repo> refs/pull/7/head`（或等价精确授权形式），
   必须 `exit 0` 且结果等于 `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`；
   落盘命令、时间、stdout、stderr、退出码。失败即 STOP，无重试。
5. 随后 fresh full clone 到**另一个**独立目录，`core.autocrlf=false`、detached 到该 HEAD、
   工作树干净；复核 B/T/S、原始 scope 与哈希。该 clone 不得被其他窗口操作。
6. Node 精确 **v22.23.5 x64**；Windows → A59 用户控制离线区间；Linux → 仅当已合规的 A54/A55。
   所有 M2/M3 组与子进程必须在该边界内，组前组后各一次探针并落盘脱敏 OS 事实与原始日志；
   **不得在联网状态跑测试**；不得改系统、装依赖或提权。
7. scratch 与日志放在候选 checkout 之外；联网证据发布与隔离运行分开进行。

## 验证内容（A76 §2 原样，两组且仅两组）

- **M2 — 真实入口的四项计数与预期击杀**：必须打在**候选自身**的 Q3-11 模块守卫与
  behavioral harness 模块守卫上，不得用手写无关控制脚本代替。独立编写 spawn / listen /
  connect / request 四项插桩覆盖实际入口，零真实网络、无危险子进程。control 用受控桩或代理
  强制触发拒绝，记录实际拒绝原因，并在任何副作用发生之前记录四项均为 0，逐项说明 reachability。
  mutant 只在 scratch 变体中移除**那一处**守卫调用、其余行为不变，证明被插桩的 spawn/listen
  路径确实被触达（允许拆 M2a/M2b），并给出**预期断言失败**原文；崩溃/超时不算击杀。
- **M3 — 同一损坏夹具的双向对照**：对 `docs/handoffs/WP-01/fixtures/wp01.v1.json` 追加一个 LF 字节，
  两份 disposable 副本用**同一输入**并记录输入 SHA-256。三态齐备：
  ① 完好夹具 + 未修改测试 → 绿色；② 损坏夹具 + 未修改测试 → exit 1，且失败来自受保护依赖字节的预期断言；
  ③ 损坏夹具 + **仅绕过受保护清单断言**的精确 scratch 补丁 → 必须 `exit 0`，且该绕过能被 oracle 以预期断言杀死。
- **不重跑**其他矩阵（A74 的 103/67/44、oracle、audit、pins、integration 全部保留，不重复）。
- 落盘：精确源码/补丁、输入、四项计数、断言原文、退出码、还原过程；不得修改真实候选或外部真实数据。

## 交付

- 在 PR #7 发**一条新评论**（同 SHA），引用 `#7175752150` 与 `#7176018233`，按 M2、M3 两组分别给出
  命令、时间、退出码、原始输出、补丁、计数记录、夹具哈希、隔离边界；缺失写 `NOT_RUN` / `NOT_RECORDED`。
- 结束前核对运行目录干净、live HEAD 仍为该 SHA、所有子进程已结束。
- 整份覆写 `docs/bus/EXECUTION_TO_QA.md` 为 seq **25**（或 latest+1），
  header 写 `re=MANAGEMENT_TO_EXECUTION.md@35`，只提交该文件，提交信息 `bus(execution): seq 25`；
  **EXECUTION STOP**。

## 边界

- 本轮**不派发 QA**。只有 Design 核验并通过 G2 之后，才由 Management 另行释放独立全量 G3
  （QA next seq15 或 latest+1），届时才点名 QA 计划路径
  `docs/handoffs/WP-03/QA_INSTRUCTION.md` 与 `D007_A72_...` §3；在那之前 QA 不得开工。
- 不得授予 G1/G4/G5/G6/G7；不合并；R2、P0-STORE、WP-04、UI、真实服务/部署未授权；
  A70/A71 继续暂停；P1/P2 仍 OPEN；PR #2/#4 与冻结 UI 不动。
- 任何不清楚、越界、权限错误、首次 ref 失败或隔离边界缺失 → 如实 `STOP`，不得补造。
