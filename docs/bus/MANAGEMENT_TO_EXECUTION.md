<!-- BUS from=MANAGEMENT to=EXECUTION seq=48 re=DECISION_BOARD.md@44 status=OPEN updated=2026-11-27T12:58+01:00 -->
# Management → Execution（DEC-34=A：释放 P0-STORE 第 1 阶段独立 G3 给 QA）

**来源:** `docs/DECISION_BOARD.md` seq 44（R44）任务单。
**用户决定（Design 窗口）:** **DEC-34 = A**：释放 P0-STORE 第 1 阶段独立 G3。
**授权:** `D007_A91_P0STORE_PHASE1_G2_ACCEPTED.md`（G2 ACCEPTED at `88e1bd7…`）；
QA 内容以 `docs/handoffs/P0-STORE/QA_INSTRUCTION.md` 与 `docs/handoffs/P0-STORE/DESIGN.md` 为准，
**两份从 `main` 读取**（候选树中没有，属设计如此）。
**性质:** 本轮只派独立 QA；**不派 Execution、不改候选、不合并**。

## 对象

- PR **#9** `exec/P0STORE-nutstore-probe-r1` → `main`。
- **exact HEAD `88e1bd76dc94fc38876fa28c975d317b1c1573c2`**；Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`。
- **首次且唯一** `git ls-remote <repo> refs/pull/9/head` 必须 `exit 0` 且等于该 SHA，否则 STOP（落盘命令/时间/stdout/stderr，无重试）。
- **全部 G3 证据必须在这个最终 HEAD 上取得**（Execution 的 G2 证据是在 `9e772e6` 上跑的；
  `9e772e6..88e1bd7` 仅改 `QA_HANDOFF.md`，但 QA 不得复用其结果作为本 SHA 的验收）。

## 七组内容（全部要做，不得只报聚合）

1. **语法**；
2. **`node --test`（P1-01..P1-13）**；
3. **QA 自写严格 TAP** 的上游回归：WP-01 **67**、WP-02 **44**（嵌套 67）、WP-03 **103**、WP-04 **91**；
4. **候选审计正例 + 计数中性负例**：用多余路径替换一个已批准路径、改 Base 路径、改受保护 blob、
   未跟踪文件、mode 变更、symlink 类型——每个负例都必须由**它自己专门的检查**报错（不得被泛化计数掩盖）；
5. **QA 自写的 11 种性格矩阵**（对 `support/mock-webdav.mjs` 的独立实现或独立驱动）：
   判定（GO/PARTIAL/NO-GO）与 STOP 原因必须由**独立断言**得出，不读 Execution 期望值；
6. **出网证明**：live 前置条件各种缺失组合、非 loopback 主机 → **QA 自己计数零 socket**；
   代码与已提交计划中**无真实主机字面量**；金丝雀字符串**不出现在任何 trace / 日志 / 错误**中；
7. **committed driver 全部击杀 + ≥6 个 QA 独立 mutant**，必含：关闭 TLS 校验、跟随重定向、丢写入未检测、
   单进程竞争、迟到 ACK 盲目重试、记录凭证。

## 环境

- 独立 QA 会话与**独立可写目录**（不得共用 Management/Execution 的 clone）；fresh full clone，
  `core.autocrlf=false`、detached 该 HEAD、工作树干净。
- Node **精确 v22.23.5 x64**；A59 Windows 用户控制离线区间，或已具备资格的 A54/A55 Linux；Linux 未跑记 `NOT_RUN`。
- 每组前后 guard + probe、脱敏 OS 事实与原始日志；子进程在重连前结束；不联网跑测试、不改宿主、不装依赖。
- **任何情况下都不得接触真实坚果云主机、账号或凭证**；不读取真实用户数据。

## 交付

- PR #9 发**一条新评论**：**A86 DEC-27 逐项表**——每个测试 ID / 组 / 审计负例 / mutant / 追溯项各一行，
  `PASS`（附实际输入、断言原文、退出码）或 `FAIL` / `NOT_RUN` / `NOT_RECORDED`；聚合 PASS 视为不完整（只退回补表）。
- 然后整份覆写 `docs/bus/QA_TO_DESIGN.md` 为 seq **21**（或 latest+1），
  header `re=MANAGEMENT_TO_EXECUTION.md@48`，含 PR / exact SHA / QA 评论 ID / verdict / 关键数字 / P0-P2；
  只提交该文件，`bus(qa): seq 21`，**QA STOP**。

## 边界

- **Execution 本轮无任务**：若被唤醒，只回 `status=DONE re=MANAGEMENT_TO_EXECUTION.md@48` 并注明
  “本轮为独立 QA 的 P0-STORE Phase 1 G3、Execution 未参与”，随后 STOP。
- QA 不改候选、不合并、不裁定门禁；**G4 只由 Design**。
- 第 2–4 阶段（用户准备 / 真实受限运行 / 判定）、ACCESS-02 / G6 / G7 均**未授权**；
  P0-STORE 仍 **BLOCKED**；A70/A71 暂停；冻结 UI、PR #2/#4 不动。
- 任何 SHA 漂移、环境缺口、权限错误 → 如实 STOP/FAIL，绝不伪造 PASS。
