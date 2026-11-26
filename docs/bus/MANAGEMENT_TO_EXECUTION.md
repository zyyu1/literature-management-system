<!-- BUS from=MANAGEMENT to=EXECUTION seq=41 re=DECISION_BOARD.md@35 status=OPEN updated=2026-11-26T19:57+01:00 -->
# Management → Execution（DEC-23=A：派独立 QA 执行 A83 合并后离线回归）

**来源:** `docs/DECISION_BOARD.md` seq 35（R35）§2，用户选定 **DEC-23 = A**（按 A83 原样批准）。
**授权:** `D007_A83_POST_MERGE_OFFLINE_REGRESSION_DRAFT.md` §2–§4（**不扩不缩**）。
**性质:** 只做合并后常规回归；**不派 Execution、不重跑 G3、零代码改动**。

## 主体（S_main）

- 对象 = **QA 首次且唯一一次** `git ls-remote <repo> refs/heads/main` 读到的 exact main SHA（S_main）；
  该次读取必须 `exit 0`，落盘命令/时间/stdout/stderr；**无重试豁免**，失败即 STOP。
- S_main 前置条件（只读核对，任一不符即 STOP）：
  1. merge **`6cc8e2ad1f65f752d9846012531e52d9af647f3b`** 是 S_main 的祖先；
  2. `6cc8e2a..S_main` 只改 `docs/`（不得有 `packages/`、`tools/`、fixtures 改动）；
  3. 22 个 WP-03 blob 与 tested HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` 相同。
- 全新 full detached clone 到 S_main，`core.autocrlf=false`，工作树干净；**不得**共用
  Management 或 Execution 的 clone/目录。

## 环境

- Node **精确 v22.23.5 x64**；A59 Windows 离线宿主，或已具备资格的 A54/A55 Linux；
  **Linux 可选，未跑记 `NOT_RUN`**。
- 仅对那一次 ref 读取与 clone 使用命令级 TLS（`-c http.sslBackend=openssl` + 既有 CA/helper，校验开启）。
- 所有测试进程与子进程在该离线隔离边界内；每组前后 guard + probe、脱敏 OS 事实与原始日志；
  全部子进程在重连前结束；不得改宿主/网络、安装、提权或用真实数据。不可用即 STOP。

## 只跑这三条命令（不得增删）

| 组 | 命令 | 期望 |
| --- | --- | --- |
| G1 | `cd packages/wp-01-synthetic-auth-api && node --test` | **67/67**，exit 0 |
| G2 | `cd packages/wp-02-project-paper-read && node --test`（无 npm script，同一 runner） | **44/44**（含 nested WP-01 67/67），exit 0 |
| G3 | `cd packages/wp-03-guarded-r1-writes && node --test` | **103/103**（含 Q3-11：受保护清单 56 blob、strict upstream 67 与 44），exit 0 |

- 每组零 fail / skip / todo / cancelled；保存原始 TAP；**各跑一次**，重试不计为通过。

**本轮明确排除：** `scripts/verify-candidate-scope.mjs`（锚定 PR 历史与 222 路径，本就预期拒绝 main，
不是回归信号）、两个 mutation driver、语法检查、真实服务。**不得**把它们当作本轮内容。

## 交付

- 在 PR #7（已 closed/merged）发**一条新评论**，标题标明 A83 post-merge regression，
  引用 A81/A82 与 merge `6cc8e2a`：S_main、前置核对结果、环境/probe 映射、每组命令与计数、退出码、
  原始 TAP 摘要/摘要值、限制。
- 然后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **18**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@41`，只提交该文件，`bus(qa): seq 18`，**QA STOP**。

## STOP / 结果规则

- 任何失败、skip、计数不符、超时或环境缺口：如实上报 `FAIL`/`NOT_RUN` 与原始输出；
  **不修复、不把重试当通过、不改任何代码或文档**。
- 若 Q3-11 失败 → P2-WP03-DESIGN-2 **重开**；WP-01/WP-02 失败 → 属 Design 的新发现。
- 三组全过且前置成立时，由 **Design** 记 `post-merge regression PASS_LOCAL on S_main` 并把 P2 升为实测关闭；
  **Management 与本轮 QA 均不得自行改门**。

## 边界

- **Execution 本轮无任务**：若被唤醒，只在 outbox 记
  `status=DONE re=MANAGEMENT_TO_EXECUTION.md@41` 并注明“本轮为独立 QA 的 A83 回归、Execution 未参与”，随后 STOP。
- 不授予 G1/新工作包、不合并、不改分支/PR、不动冻结 UI；R2、P0-STORE、WP-04、真实持久化、
  真实服务/部署、G6/G7 均 blocked；A70/A71 暂停；PR #2/#4 不动。
