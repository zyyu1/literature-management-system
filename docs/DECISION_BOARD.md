<!-- BUS from=DESIGN to=MANAGEMENT seq=10 re=bus/QA_TO_DESIGN.md@6 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — 每轮整体覆盖

**轮次:** R10 (seq 10) · 2026-11-25 · observed parent `main@32856092d8564ca49948df7b52c848550d73a83a`
**已记录:** DEC-7=B、DEC-8=A（Management seq 9）。Execution seq 7 环境 STOP；QA seq 6 NOT_RUN。用户现明确要求 Windows 执行和测试，Design 发布 [A59 环境修正](architecture/D007_A59_A58_WINDOWS_ENVIRONMENT_AMENDMENT.md)。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合并 |
| WP-02 | A57 G4 PASS_LOCAL @ `222763dad068fc226e500b14250cbb7fffc0a2de`；PR #6 OPEN |
| A58 P2 修复 | G1 AUTHORIZED；G2/G3 NOT_RUN；等待 A59 重派；Windows readiness PENDING |
| POC PR #2/#4 | OPEN 存档 |
| WP-03+ / G5/G6/G7 | NOT_AUTHORIZED；P2 须先关闭 |

## 2. 待用户决策
无新 DEC。既有 DEC-8=A 与用户明确的 A59 环境修正已足够；不扩大代码授权。

## 3. Management action — fresh dispatch
写 Management→Execution 下一 seq，引用本板 seq 10、[A58](architecture/D007_A58_WP02_P2_TEST_ONLY_G1_DRAFT.md) + [A59](architecture/D007_A59_A58_WINDOWS_ENVIRONMENT_AMENDMENT.md)、DEC-8=A、PR #6、exact START `222763dad068fc226e500b14250cbb7fffc0a2de`、Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`，明确替代旧 seq 9 Linux-only STOP。
- Windows x64 或 Linux x86_64 Execution/独立 QA 均可；优先既有 Windows Execution，Node v22.23.5。
- Windows 必须实际证明 OS-level loopback-only egress（用户控制的离线测试区间或已有等效隔离）；不能用 Linux wrapper 缺失作为唯一拒绝原因，也不能在未验证的联网环境下直接运行。无法满足则 ENVIRONMENT_BLOCKED/STOP。不得自动修改用户网络或系统设置。
- 单文件、一项新测试、原测试/fixture/源码/driver 不变；44/44、67/67、13/13、QM12 断言杀死及独立配对对照均不降低。
- 执行方新 exact HEAD + 报告后，独立 QA；Design 新 G4。不得合并。

## 4. 回传
Management→Execution 下一 seq；Execution→QA 与 QA→Design 各下一 seq。记录 host、隔离方法及探针结果、精确 SHA、评论 ID；缺证据 STOP。不重用旧 STOP 作为派发。

## 5. 边界
A59 仅适用于 A58，其他工作包及历史 QA 不改；G5/G6/G7 未授权，不使用真实数据/密钥，不改冻结 UI。
