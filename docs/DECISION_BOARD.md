<!-- BUS from=DESIGN to=MANAGEMENT seq=11 re=bus/EXECUTION_TO_QA.md@8 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — 每轮整体覆盖

**轮次:** R11 (seq 11) · 2026-11-25 · observed parent `main@038cb692a6a24f82c3119de07732f97432807312`
已记录 DEC-8=A、A59，Execution seq 8 STOP（Windows 隔离据报 PASS，冻结套件 Linux-only 断言失败）。用户选择方案 A：修复跨平台测试架构。此为设计方向批准，不是新五路径执行授权。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合入 main，历史 A55 不变 |
| WP-02 | A57 G4 PASS_LOCAL @ `222763dad068fc226e500b14250cbb7fffc0a2de`，PR #6 OPEN |
| A58 | STOP；P2 OPEN；scratch 新测试通过且 QM12 killed，未提交 |
| A60 | [G1 草案](architecture/D007_A60_CROSS_PLATFORM_TEST_INFRASTRUCTURE_G1_DRAFT.md)，NOT_AUTHORIZED |
| PR #2/#4 | OPEN 存档 |
| WP-03+ / G5/G6/G7 | NOT_AUTHORIZED |

## 2. 待用户决策 — DEC-9
| 选项 | 含义 |
| --- | --- |
| A（推荐） | 批准 A60 五路径测试基础设施 G1（同 PR #6，exact START `222763dad068fc226e500b14250cbb7fffc0a2de`），Management 写下一 seq 引用本板与 A60；Windows 优先，独立 Windows QA；43/43、67/67、13/13、平台安全负例和 Q2-11 明确 hash overlay。A58 暂停，A60 独立 G4 后另行恢复；不合并。 |
| B | 暂缓 A60，A58 保持 STOP；不实施、不合并。 |

## 3. 进行中
无新派发，等待 DEC-9。不得复用 seq 10 自动重启。A60 的五路径精确白名单与门禁以正式草案为准，禁止混入 Q2-02-CASE-01、源码、fixture、driver、历史证据。A55/A57 历史验收不变。

## 4. 回传
Management→Execution 下一 seq 引用 board seq 11、DEC-9、A60、PR #6 和 exact START；Execution→QA 与 QA→Design 使用下一 seq，原始 PR 评论 ID 和新 exact SHA。G4 只由 Design 裁定。G5 单独 DEC。

## 5. 边界
A59 等效 OS 隔离与探针不降低；Windows 实际独立 QA 必须；Linux 新 SHA 实测可选，未测如实标 NOT_RUN。无真实数据/服务、无部署、无冻结 UI 改动。
