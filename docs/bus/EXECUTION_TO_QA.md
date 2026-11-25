<!-- BUS from=EXECUTION to=QA seq=7 re=MANAGEMENT_TO_EXECUTION.md@9 status=STOP updated=2026-11-25T10:04+01:00 -->
# Execution → QA

**status=STOP — 环境不匹配（A58 §1 Runtime / §5；A54 §4）。** seq 9（DEC-8=A，A58 已生效）已收到，授权与代码基线预检全部通过；但本窗口不是 A54/A58 要求的**云 Linux x86_64** 执行主机，`run-offline.sh` 无法运行，因此不可能产出 `EGRESS_PROBE=PASS`。按规则不得在 Windows 上跑测试或宣称通过，故 STOP，等待重派。

## 1. 收到的任务（inbox seq 9，status=OPEN）

| Item | Value |
| --- | --- |
| 决策 | **DEC-8=A**，A58 自 Management seq 9 起生效 |
| 授权文件 | `docs/architecture/D007_A58_WP02_P2_TEST_ONLY_G1_DRAFT.md` |
| PR / 分支 | **#6** `exec/WP-02-project-paper-read`（OPEN / 未合并）；沿用现有分支，不新建 |
| Exact incremental START | `222763dad068fc226e500b14250cbb7fffc0a2de` |
| 唯一可写路径 | `packages/wp-02-project-paper-read/test/identity.test.mjs` |
| QA 计划 | A58 §4（独立云端 Linux G3 会话） |

## 2. 只读预检结果（全部 PASS，无改动）

| 检查 | 结果 |
| --- | --- |
| PR #6 状态 | OPEN、draft=false、merged=false、mergeable=true |
| 首次远程 ref 读回 HEAD | `222763dad068fc226e500b14250cbb7fffc0a2de` = 精确 START ✔ |
| 不可变 Base | `a0fb04f6d03ac81bbcb35800318c927e278e8b92` 是 START 的祖先（`merge-base --is-ancestor` exit 0） |
| Base..START | 3 个提交、0 个 merge commit、27 个变更文件（与 A57 allowlist 一致） |
| 夹具 `docs/handoffs/WP-02/fixtures/wp02.v1.json` | 4989 B，blob `f1958fd288a3fdac57725e0ac1c7920aee456af0`，SHA-256 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888` = A56/A58 记录 ✔ |
| A55 wrapper blobs（`origin/main`） | `run-offline.sh` `2d06bfc3aee1c1d9b3a8e67fd93e483bc8b1fb20`、`lo-up.py` `55b45a3678fe347155ca54c89110aa1dd0ad1454`、`egress-probe.mjs` `fceeea897156b2f87f240d217f2c93f231a6d662` = A55 硬化版 ✔ |
| 白名单文件 | `packages/wp-02-project-paper-read/test/identity.test.mjs` 存在（blob `cea840bc91f9ed4c577aedbff12c83262e3c4ed7`，7 个 `test()`；套件基线 43/43，加 1 条后应为 44/44） |

## 3. STOP 原因（实测，2026-11-25 10:02 Europe/Berlin）

- **要求：** 云 **Linux x86_64** + Node **v22.23.5**；所有测试/服务器/探针命令必须经 `tools/offline/run-offline.sh`（user+network namespace，仅 loopback）；探针先 `EGRESS_PROBE=PASS`。
- **本窗口实测：**
  - OS：`Microsoft Windows NT 10.0.19045.0` x64（非 Linux）。
  - `unshare` 不存在；Git Bash 存在，但 Windows 内核无 Linux 网络命名空间，`unshare -rn` 无从执行。
  - `wsl -l -q` 退出 1：无 WSL 发行版。
  - `python3`（3.11）无 `fcntl` 模块：`lo-up.py` 无法运行。
  - Node：本机为 `v26.13.0`，另有 v22.23.5 的 **Windows x64** 构建；无 linux/x64 运行时。
  - 本窗口无可达的 Linux 主机（探测已配置的远程主机均 Connection refused）。
- **结论：** `run-offline.sh` 不能在此主机运行 ⇒ 无法满足 A56/A58 的 egress 前置条件 ⇒ A58 §5「egress mismatch → STOP」，且 A54 §4 明确 Windows Execution not permitted。

## 4. 未做（边界保持）

- 未创建/切换分支，未修改 PR #6，未推送任何提交，未在 PR #6 发评论。
- 未运行任何测试、探针或服务器命令；未声称任何通过结果。
- PR #2（`a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`）、PR #4（`2757aa664e2c12c80716fb291f3e3149f06fcfdd`）、冻结 UI、`tools/` 均未触碰。
- 无 QA 派发；本文件仅为 STOP 回报。

## 5. 需要的解决（Design / 用户决定，Execution 不自作主张）

1. 在**云 Linux x86_64** 主机重开 Execution 会话（Node v22.23.5，`unshare` + `python3` 可用），按 A54 §3 取 tools 并让探针 PASS，然后按 A58 原样重派（同 seq 或新 seq）；Execution 会重跑完整预检后执行；**或**
2. Design 发布明确修正：允许 native Windows x64 执行，并给出等效、可验证的 egress 边界，说明它如何取代 A54 §4 与 A58 §1 的 Runtime 行。

在此之前 seq 9 保持未执行。Gates unchanged: G2/G3/new G4 NOT_RUN/NOT_REVIEWED；G5/G6/G7 NOT_AUTHORIZED。
