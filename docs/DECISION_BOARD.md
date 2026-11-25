<!-- BUS from=DESIGN to=MANAGEMENT seq=8 re=bus/QA_TO_DESIGN.md@5 status=OPEN updated=2026-11-25T09:53+01:00 -->
# 决策板 / Decision Board — 每轮整体覆盖

> [A51](governance/D007_A51_DECISION_BOARD_WORKFLOW.md) / [A52](governance/D007_A52_FILE_BUS_POLLING.md)：Management 向用户展示 DEC 选项并回传；Execution/QA 不得从本板推导未获批准的代码授权。正式裁定与授权见 architecture/D007_A*.md。

**轮次:** R8 (seq 8) · 2026-11-25 · observed parent `main@82bf48412a100a6f5668757491e987a13a0c4b54`

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合入 main（A55） |
| WP-02 | [A57](architecture/D007_A57_WP02_EXACT_G4_DISPOSITION.md) **G4 PASS_LOCAL**；PR #6 OPEN，exact HEAD `222763dad068fc226e500b14250cbb7fffc0a2de`；P2-WP02-QA-1 OPEN_NON_BLOCKING |
| POC PR #2 / #4 | 保持 OPEN 存档（DEC-2=A） |
| WP-03+ | 实施 NOT_AUTHORIZED；P2 必须先关闭 |
| 全局 | G6/G7 NOT_AUTHORIZED；不接真实服务、不部署 |

## 2. 待用户决策 — DEC-7（WP-02 下一步）
**推荐 B**：先补最小身份大小写回归，避免将已知测试缺口带入写入阶段。

| 选项 | 含义 / 派发 |
| --- | --- |
| A | 明确授权 G5 合并当前 exact SHA 的 PR #6（P2 保持 OPEN，后续另行修复且必须先于 WP-03 写入 G1）。Management 回传 DEC-7=A；Design 核对 exact HEAD、main、合并条件后办理 G5；不得自行修改或重置分支。 |
| B（推荐） | 暂不合并，要求 Design 制定最小 test-only P2 remediation G1 草案（精确 START/白名单/QA）。Management 回传 DEC-7=B；**不是代码启动授权**，待 Design 发布单独授权与用户批准，独立 QA + 新 exact-SHA G4 后再讨论 G5。 |
| C | 暂缓，PR #6 保持 OPEN，A57 G4 不变，P2 OPEN；不派发、不合并。 |

## 3. 进行中
无新 Execution/QA 工作。等待 Management 回传 DEC-7。原 QA report [#7139369153](https://github.com/zyyu1/literature-management-system/pull/6#issuecomment-7139369153) 保留；原 bus 不改写。

## 4. 回传方式
Management 在 `docs/bus/MANAGEMENT_TO_EXECUTION.md` 记录 `DEC-7=A/B/C`、board seq 8、PR #6 exact SHA，并回传 Design。未批准时保持 WAITING。不得将 B 当作执行指令。

## 5. 不变的规则
- 独立云端 Linux QA、exact SHA、A54/A55 网络隔离。G4 只由 Design 裁定。
- G5、G6、G7 分别明确授权；不使用密钥或真实数据。
- 冻结 UI 不动，WP-03+ 不自动启动。
