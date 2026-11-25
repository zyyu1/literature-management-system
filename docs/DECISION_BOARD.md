<!-- BUS from=DESIGN to=MANAGEMENT seq=15 re=bus/QA_TO_DESIGN.md@8 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R15

**轮次:** R15 (seq 15) · 2026-11-25 · observed parent `main@4f90072cedf2cc08b60736fb6ab6d36805281119`
已核验 QA seq 8 / Execution seq 12 / Management seq 14，PR #6 exact HEAD `ab4a37c8905ebc9d3f889164c2f8164c9286051d`。A63 裁定 A60+A61+A62 G4 PASS_LOCAL（Windows），五项平台 P2 CLOSED_LOCAL；Linux 新 SHA NOT_RUN。按用户要求直接恢复 A58。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合并，A55 历史证据不变 |
| A60+A61+A62 | [A63 G4 PASS_LOCAL](architecture/D007_A63_A62_EXACT_G4_PASS_LOCAL_AND_A58_CONTINUATION.md)，五平台 P2 CLOSED_LOCAL |
| A58 | 原 DEC-8=A 有效，A63 新 START 续作，待派发；原 P2 OPEN |
| WP-03+ / G5/G6/G7 | NOT_AUTHORIZED |

## 2. 待用户决策
无。沿用 DEC-8=A 原单文件授权，未扩范围。

## 3. Management action
写 Management→Execution 下一 seq **15**，引用本板 seq 15、DEC-8=A、A58+A59+[A63](architecture/D007_A63_A62_EXACT_G4_PASS_LOCAL_AND_A58_CONTINUATION.md)（A60+A61+A62 已验收，冻结）。同 PR #6 / branch `exec/WP-02-project-paper-read`，new exact START `ab4a37c8905ebc9d3f889164c2f8164c9286051d`，immutable Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`。
- 唯一可写 `packages/wp-02-project-paper-read/test/identity.test.mjs`，一个增量提交、一条具名 Q2-02-CASE-01，原测试与断言全部保留；其余文件与新 START 字节一致。
- Windows 优先，独立 Windows/Linux QA 按 A59；Node v22.23.5，实际 A59/A54/A55 边界及探针；44/44、67/67、13/13 全绿，无跳过。旧 suite 在新 START QM12 下 43/43、新具名断言 expected 403 actual 200，独立 raw HTTP 与 digest/counts；不修改已通过平台 helper/manifest。
- 旧 A58 STOP 不自动恢复；本轮 fresh dispatch 后才执行。不得合并；QA 之后 Design 新 G4 方能关闭原 P2。

## 4. 回传
Execution→QA 下一 seq，QA→Design 下一 seq，附 PR 原始评论、exact SHA、one-file diff、全套计数、QM12 配对证据和限制。G4 由 Design 裁定；G5 另行 DEC。

## 5. 边界
无产品源码、fixture、driver、平台 helper/manifest、依赖、历史证据、CI、UI、真实服务、部署修改。PR #2/#4 不动。Linux 实测未运行则 NOT_RUN。
