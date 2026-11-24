<!-- BUS from=DESIGN to=MANAGEMENT seq=6 re=bus/QA_TO_DESIGN.md@3 status=OPEN updated=2026-11-24T18:20+01:00 -->
# 决策板 / Decision Board — 每轮整体覆盖

> **用法（[A51](governance/D007_A51_DECISION_BOARD_WORKFLOW.md) + [A52](governance/D007_A52_FILE_BUS_POLLING.md)）：** Design 每轮整体覆盖本文件。
> - **Management：** 读取本文件，把 §2 的每个 DEC 以可点击选项问用户，选定后写 `bus/MANAGEMENT_TO_EXECUTION.md`。
> - **Execution：** 完成后写 `bus/EXECUTION_TO_QA.md`。
> - **QA：** 完成后写 `bus/QA_TO_DESIGN.md`。
>
> 正式授权以 `docs/architecture/D007_A*.md` 为准。

**轮次:** R6（seq 6）· 2026-11-24 18:20 · 基于 `main@a0fb04f`

**已记录（来自 `bus/MANAGEMENT_TO_EXECUTION.md` seq 5）：**
- **DEC-4=A：** PR #5 已用 merge commit 合入 `main`。合并提交为 `11b5f172dde7c0cb3e0665a8da2949df958d9986`，父提交 `2e72758` 和 `100cb63` 已核实。
- **DEC-5=A：** 设计 WP-02。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 合成认证 API | **已合入 main**（G4 PASS_LOCAL + G5） |
| WP-02 Project/文献只读切片 | 设计、冻结夹具、QA 计划已发布；**G1 草案待批准**（见 DEC-6） |
| POC PR #2 / #4 | 保持 OPEN 存档 |
| 全局 | 真实服务和部署禁止 |

## 2. 待用户决策

### DEC-6：批准 WP-02 G1？
**WP-02 是什么：** 在 WP-01 的认证边界之上做 3 个只读接口：
- Project 列表（可按进行中 / 已归档筛选，带论文数和"重要"数）；
- 某个 Project 的文献列表；
- 单篇论文详情。

**关键规则：**
- 同一篇 Zotero 论文无论挂在多少个 Project 下，都只存一份。
- 同一个 item key、但属于不同文库，算作不同的论文。
- 标题或 DOI 相同，也不会合并成一篇。
- 阅读状态和笔记是全局的；"重要"标记只属于某一个 Project。
- 外人看不到、也无法判断别人的 Project 或论文是否存在。
- 不支持任何写操作。

**相关文件：**
- [设计](handoffs/WP-02/DESIGN.md)
- [冻结夹具](handoffs/WP-02/fixtures/wp02.v1.json)：Design 编写，SHA-256 `c4fc68af…f888`
- [QA 计划](handoffs/WP-02/QA_INSTRUCTION.md)
- [G1 草案 A56](architecture/D007_A56_WP02_G1_AUTHORIZATION.md)

| 选项 | 内容 | 派发（选中后由 Management 写入 `bus/MANAGEMENT_TO_EXECUTION.md`） |
| --- | --- | --- |
| **A（推荐）批准并开工** | A56 生效 | **授权：** [A56](architecture/D007_A56_WP02_G1_AUTHORIZATION.md)<br>**Base：** `a0fb04f6d03ac81bbcb35800318c927e278e8b92`<br>**新分支：** `exec/WP-02-project-paper-read`<br>**白名单：** `packages/wp-02-project-paper-read/**`、`docs/handoffs/WP-02/QA_HANDOFF.md`；WP-01 包必须一个字节都不改<br>**运行方式：** 云端 Linux 会话，所有测试按 A54 通过 `run-offline.sh` 运行<br>**QA 计划：** `docs/handoffs/WP-02/QA_INSTRUCTION.md`，由另开的云端 QA 会话执行 |
| B 修改后再批 | 在 Management 里写下要改的地方 | 不派发；Design 在下一轮修改 |
| C 暂缓 | — | 不派发 |

## 3. 进行中
无。

## 4. 回传方式
Management 写 `bus/MANAGEMENT_TO_EXECUTION.md`（`DEC-6=?`）→ Execution 写 `bus/EXECUTION_TO_QA.md` → QA 写 `bus/QA_TO_DESIGN.md` → Design 进行 G4 裁决。

## 5. 不变的规则
- QA 只在独立的云端 Linux 会话中进行，所有测试都按 A54 隔离网络运行。
- 每次 QA 都针对一个 exact SHA；G4 只由 Design 裁决。
- 不使用任何密钥或真实数据。
- 冻结的 UI 不动。
- 合并、真实服务、部署都必须由用户在某个 DEC 中明确选择。
