<!-- BUS from=MANAGEMENT to=EXECUTION seq=38 re=DECISION_BOARD.md@32 status=OPEN updated=2026-11-26T19:12+01:00 -->
# Management → Execution（含：给独立 QA 的九类定向补全）

**来源:** `docs/DECISION_BOARD.md` seq 32（R32）§2，用户选定 **DEC-20 = A**。
**授权:** `D007_A80_WP03_TARGETED_INDEPENDENT_G3_COMPLETION_DRAFT.md` §2（**仅九类**）；
辅以 `D007_A79_...` §2 与 `D007_A72_...` §3。
**范围性质:** 定向补全，**不是**重跑全量 G3，**不派 Execution**，**零候选改动**。

## 对象（不变）

- PR **#7**：**OPEN / 未合并 / 3 提交**，exact HEAD **`c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`**，
  Base `1684cea5623c8421e16c328c7f1464e8932d3118`，B/T/S 谱系、222 tracked、200 Base 不变、modes 一致。
- 不得 commit/push/merge/rebase/reset/force，不得新建分支/PR，不得改候选、夹具、测试或 `main` 上
  任何文件（自己的 bus 下一 seq 与 PR 评论除外）。

## 环境（与 G3 同标准，不满足即 STOP）

- 独立可写 QA 目录与会话（可用既有独立 QA 会话/目录，**绝不共用** Management 或 Execution 的 clone）。
  先做本地日志/scratch 权限预检；**首次** subject 读取前备好命令级 `-c http.sslBackend=openssl`
  + 既有 CA/helper（证书校验保持开启，不打印凭证，不做探索性读取）。
- **首次且唯一一次** `git ls-remote <repo> refs/pull/7/head` 必须 exit 0 且等于该 SHA，
  落盘命令/时间/stdout/stderr/退出码；失败即 STOP，**无重试豁免**。
- fresh full detached clone，`core.autocrlf=false`、干净 222 路径；保留静态 scope audit 作为预检控制。
- Node **精确 v22.23.5 x64**；A59 Windows 或已具备的 A54/A55 Linux；
  所有 scratch 准备/执行/子进程在适用的实际隔离边界内，每组前后 guard/probe、脱敏 OS 事实与原始日志；
  不得自动改宿主/网络、安装、提权或在联网状态跑运行时测试；所有子进程须在重连前结束。不可用即 STOP。

## 只做这九类（逐项都要：实际输入、精确命令、补丁、原始输出、预期断言、退出码/进程状态）

**Group 1 — 实际 scope 负例**
1. **Symlink 替换**：真实 disposable 候选 tracked 路径换成 symlink，真实 auditor 以预期
   type/mode/status/nonregular 断言拒绝。若 Windows 无 symlink 权限：**不得**提权或改 OS 设置，
   改用 120000 mode 的 scratch Git tree/index（真实 Git symlink 条目）+ 实际 readTree/audit 拒绝，
   并说明未创建文件系统 symlink，区分 committed mode/type 证明与 worktree 证明；两者都不可行则 STOP。
2. **已存在的未授权 S-added 路径**：取 S 减 B、且不在 A72 三条授权路径内的实际路径（先验证成员关系），
   仅在 disposable 合成 A72 候选中改动该**既有**路径字节，完整真实 auditor 须拒绝；
   另用实际抽出的 `verifyStartTreeScope` 以独立推导的 S/HEAD 映射证明命中
   `A72_PATH_CHANGED_OUTSIDE_SCOPE`（说明更早的 diff 计数检查为何会掩盖该专项检查）。
   报告 control 与精确负例原因。

**Group 2 — 缺失的变异类**
3. **M4 extra-path/scope bypass**：与真实 AUD-01 等价的**同一禁止 committed extra-path 输入**；
   真实 audit 拒绝，精确具名 scratch bypass **只**移除适用的 extra-path/scope 强制
   （A72 diff、S-scope、累计 extra-path 可能各自独立拒绝，须记录必要改动），保留其余 guard/history/base/worktree 检查；
   展示 bypass 下实际候选逻辑接受该禁止输入，且独立期望拒绝它。若外层冗余检查使完整 audit mutant 无法接受，
   可用精确抽出的实际检查 control/mutant，但必须明确区分 function-level 与 full-audit 证明、且同一 extra-path 输入；
   **禁止**一刀切绕过全部 audit、禁止改 live 候选、禁止伪造 PASS。
4. **Nested duplicate bypass**：实际 `assertTapTestOk`；同一输入构造 canonical duplicate subtest/pass 证明，
   真实拒绝；精确“仅放宽该重复计数”的 mutant 接受；独立期望击杀。说明改了哪个计数、为什么，
   不得削弱无关进程检查。既有 missing/duplicate 直接负例保留。
5. **Duplicate header bypass**：实际 `parseTapSummary`；plan 前重复 canonical header 的同一输入，真实拒绝；
   精确“仅允许重复 header”的窄变异接受（不得对任意畸形记录通配）；独立期望击杀。
   给精确补丁与输入、实际输出/断言/退出；崩溃/超时不计数。既有 P1–P3 与 mode mutant 结果保留。

**Group 3 — 缺失的 TAP 向量**
6. **Child timeout**：实际 `assertStrictUpstream` 结果对象带 `ETIMEDOUT`（含看起来正常的 stdout），
   必须因 error 拒绝，与表面 summary/exit 无关；用有界合成对象，不等真实超时；记录对象与预期断言。
7. **Failed nested named proof**：实际 helper/严格管线拒绝 named failed proof，与已测的 missing、duplicate 区分开；
   实际 malformed 或 failed named 记录加相关状态，不得给出 false FULL。
8. **Obsolete flag set/unset**：实际旧 T relaxed helper 与当前严格路径跑同一合成 host-precondition 失败；
   按原 A67 契约独立验证 flag 缺失与启用两种情形；旧行为对照、当前两者都拒绝、无 flag 豁免；
   用隔离进程/env 或精确源码抽取并遵守运行时 env 语义；记录精确值/状态并复原 env；**不得**在候选里新增 flag。
9. **显式大小写变体**：混合/大写 bailout、failure-status、有效上下文中的 SKIP/TODO 指令，
   用实际候选 parser 拒绝；保留仅“提到这些词”的合法诊断正例。在适用位置（plan 前/终止前）包含大小写变体，
   给出精确断言/退出；不得泛化语法。既有空白/控制/终止用例保留。

## 交付

- 同一 exact SHA 发**一条新 PR 评论**，引用 `#7199636809`、`#7199809939` 与 A80；
  用清晰 checklist 1–9 给实际输入、精确命令、补丁、输出、预期断言、退出/状态、各组探针映射与限制；
  **不得用聚合 PASS 代替缺失项**；任何失败/缺失如实写 `FAIL`/`NOT_RUN`/`NOT_RECORDED`，不得自我修补候选。
- 原始日志落盘，既有 final 与 attempt-1 产物分开保留，不得重建未跑证据；结束时原始 clone 干净、
  live exact HEAD 未漂移、候选零改动。
- 然后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **17**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@38`，含 PR/exact SHA/新评论 ID/逐项结论/NOT_RUN 清单；
  只提交该文件，`bus(qa): seq 17`，**QA STOP**。

## 边界

- **Execution 本轮无任务**：不得因本 seq 启动测试或改动；若被唤醒，只在 outbox 回
  `status=DONE re=MANAGEMENT_TO_EXECUTION.md@38` 并注明“本轮为独立 QA 九类定向补全”，然后 STOP。
- 不重跑全量 G3、不重复绿组；G4 由 Design 合并 A79/QA15/QA16 + A80 专项证据后裁定；
  **不保证会通过**。G5/G6/G7 NOT_AUTHORIZED；R2、真实持久化、P0-STORE、WP-04、UI、真实服务/部署 blocked；
  A70/A71 继续暂停；PR #2/#4 与冻结 UI 不动；Linux 未经实测记 NOT_RUN。
