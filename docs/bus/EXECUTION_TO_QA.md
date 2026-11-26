<!-- BUS from=EXECUTION to=QA seq=24 re=MANAGEMENT_TO_EXECUTION.md@34 status=STOP updated=2026-11-26T12:03+01:00 -->
# Execution → QA

## STOP — A76 §2 预检失败；M2 / M3 NOT_RUN

本轮**未执行** M2/M3，**未发** PR #7 评论，**未派** QA。原因如下。

### 1. 收件箱与授权核对（通过）

- `docs/bus/MANAGEMENT_TO_EXECUTION.md`：`seq=34 re=DECISION_BOARD.md@28 status=OPEN`；正文 **DEC-18=A**，授权 A76 §2，对象 PR #7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`。
- `docs/DECISION_BOARD.md` seq 28：DEC-18 选项 **A**（推荐项）。
- 接收时工作区 main 为 `70ed5a9fa2f41daa3ea1b714628ce4a349525b6f`（2026-11-26 11:55:21 +01:00 的 Design resume 提交）。

### 2. STOP 原因 A — 首次 subject ref 读取在 TLS backend 就绪前失败（A76 §2 无重试豁免）

- 按启动指令先执行 `git fetch origin`：**exit 255**，stderr：
  `error: cannot open '.git/FETCH_HEAD': Permission denied`
  未返回任何 ref（本地沙箱写限制）。
- 随后首次远程 ref 读取 `git ls-remote origin refs/heads/main`：**exit 128**，stderr：
  `fatal: unable to access 'https://github.com/zyyu1/literature-management-system.git/': schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030E)`
  在返回任何 ref 前失败。当时系统默认 `http.sslbackend=schannel`；`credential.helper=manager` 虽在系统配置中存在，但 TLS backend 未经事先验证/切换。执行该首次读取时，**未按 A76 §2 先配好可用的 TLS backend**。
- A76 §2 / Management seq34 环境条款：**首次** subject ref 读取前先配好 TLS backend / 凭证 helper（不得关闭 TLS 校验），一次 `exit 0` 且精确返回该 SHA，并落盘命令/stdout/stderr/退出码/时间；**失败即 STOP，无重试豁免**。该前置条件已被破坏；事后切换 OpenSSL 再读取不能重新标为 “first attempt”。
- 因此 PR #7 live HEAD（OPEN / 未合并 / 3 提交）**未做合规确认**：`NOT_CONFIRMED`。未运行任何测试。

### 3. STOP 原因 B — 原始 clone 存在并发外部写入，隔离/干净性不成立

- `.git/logs/HEAD` 显示 **2026-11-26 11:56:50 +01:00** 有非本会话进程执行 `pull --ff-only`，main 由 `e999198` 快进到 `70ed5a9`；本会话未执行该 pull。
- **2026-11-26 11:59:48 +01:00** 工作区出现非本会话创建的 `.qa-r4/`（`poll.py`、`poll.log`、`state.json`；内容为 QA gate poller，state 记录 main=`70ed5a9`、exec seq=23、mgmt seq=34）。该目录为 untracked。
- 本会话默认 pwsh 沙箱仍拒绝写入 `.git`（`Set-Content .git\probe.tmp` → `access denied`；`git fetch` 因此曾 exit 255），原始 clone 是否可提交/推送需环境确认。
- 因此“全新/干净、单一写入者”的环境前提不成立；无法保证停止时原始 clone 干净。本会话自己的临时探测文件 `.probe-dsh.txt` 已删除；`.qa-r4/` 非本会话创建，未触碰。

### 4. 未执行项

| 项 | 状态 |
| --- | --- |
| M2（候选自身 Q3-11 守卫与 behavioral harness 模块守卫；四项插桩与计数） | `NOT_RUN` |
| M3（LF 损坏夹具；完好/损坏/bypass 三态） | `NOT_RUN` |
| PR #7 新评论（引用 #7175752150、#7176018233） | `NOT_POSTED` |
| QA plan 路径传递 | `NOT_SENT` |
| 任何 clone、scratch、变异、测试 | `NOT_RUN` |

### 5. 边界与请求

- 未改候选、未建分支/PR、未 commit/push 候选、未 merge/rebase/reset/force push、未安装/提权、未联网跑测试、未发 PR 评论。
- 请求：先清理/隔离工作区（其他窗口的并发 poller 与本地 clone 共享），并在**新 dispatch** 中先配置 `http.sslBackend=openssl`（TLS 校验保持开启）与 credential helper，再作首次 subject ref 读取；是否重派由 Management / Design 决定。
- **EXECUTION STOP**
