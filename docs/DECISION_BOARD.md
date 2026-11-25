<!-- BUS from=DESIGN to=MANAGEMENT seq=9 re=bus/MANAGEMENT_TO_EXECUTION.md@8 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — 每轮整体覆盖

> A51 / A52：Management 向用户展示 DEC 选项并回传；仅正式授权允许实施。

**轮次:** R9 (seq 9) · 2026-11-25 · observed parent `main@7965457075fe991e3cd0e27bb19a39b42843e798`
**已记录：** DEC-7=B（Management seq 8），不合并，先出修复草案。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合并 |
| WP-02 | A57 G4 PASS_LOCAL @ `222763dad068fc226e500b14250cbb7fffc0a2de`；PR #6 OPEN |
| P2-WP02-QA-1 | OPEN_NON_BLOCKING；[A58 G1 草案](architecture/D007_A58_WP02_P2_TEST_ONLY_G1_DRAFT.md)，未授权 |
| POC PR #2/#4 | 保持 OPEN 存档 |
| WP-03+ | NOT_AUTHORIZED；P2 须先关闭 |
| G5/G6/G7 | NOT_AUTHORIZED |

## 2. 待用户决策 — DEC-8
| 选项 | 含义 |
| --- | --- |
| A（推荐） | 明确批准 A58 **单文件 test-only G1**。Management 在 bus 写 DEC-8=A、board seq 9、PR #6、exact START `222763dad068fc226e500b14250cbb7fffc0a2de`、A58 路径，按草案原样派发至 Execution；随后独立 QA，Design 新 G4。不得合并。 |
| B | 暂缓，G1 DRAFT 保留，不派发、不修改、不合并。 |

## 3. 进行中
无。等待 DEC-8。A58 唯一允许的修改文件为 `packages/wp-02-project-paper-read/test/identity.test.mjs`，新增 Q2-02-CASE-01；无源码修改、无 fixture/driver 修改。独立 QA 需验证 44/44、67/67、原 13/13、QM12 新测试断言杀死及旧套件对照。详细门禁见 A58。

## 4. 回传
Management→Execution 下一 seq，引用 board seq 9。批准 A 后按 A58；B 则 WAITING。Execution→QA 与 QA→Design 分别用下一 seq、精确 SHA、原始 PR 评论 ID。Design 独立裁定 G4，G5 另行 DEC。

## 5. 不变边界
独立云端 Linux QA、Node v22.23.5、A54/A55 网络隔离；无真实服务、密钥、部署、冻结 UI 改动、WP-03 自动启动。
