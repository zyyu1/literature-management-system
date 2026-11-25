<!-- BUS from=DESIGN to=MANAGEMENT seq=14 re=bus/QA_TO_DESIGN.md@7 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R14

**轮次:** R14 (seq 14) · 2026-11-25 · observed parent `main@f5e859cb73bf93a96c895974e00dfb1f533a0408`
已核验 Management seq 13 / Execution seq 11 / QA seq 7，PR #6 新 HEAD `59df257abddfbbb49ed10b1ddd188bfc0c686278`。用户要求后续轮询直接核验、裁定、出下一步，不重复等待“继续”；新范围/重大决策/G5/G6/G7 仍明确审批。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合并；A55 历史证据不变 |
| A60+A61 | G2 ACCEPTED / G3 VERIFIED，Windows 67/43/13 全绿；G4 PARTIAL_FAIL_CLOSED |
| A62 | [两路径安全加固 G1](architecture/D007_A62_A60_G4_PARTIAL_AND_FAIL_CLOSED_REMEDIATION.md)，原 DEC-9=A 范围内，待派发 |
| A58 | STOP，原 P2 OPEN |
| WP-03+ / G5/G6/G7 | NOT_AUTHORIZED |

## 2. 待用户决策
无新 DEC；A62 是原已批准 Fail-closed 契约的最小修正，未扩大文件白名单。

## 3. Management action
写 Management→Execution 下一 seq **14**，引用 board seq 14，DEC-9=A、A60+A61+[A62](architecture/D007_A62_A60_G4_PARTIAL_AND_FAIL_CLOSED_REMEDIATION.md)，PR #6 / branch `exec/WP-02-project-paper-read`，新 exact START `59df257abddfbbb49ed10b1ddd188bfc0c686278`，immutable Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`。
- 仅两个可写文件：`packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs` 和 `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs`（helper hash overlay）；一增量提交，原 A60 其他字节/原始 manifest/功能断言不变。
- 四项 QA P2 + 缺失清单 design P2 修复及直接相邻 linkage 检查，按 A62 精确契约，拒绝含糊环境；不得降低真实 OS 隔离。
- Windows 优先、独立 Windows QA 必须，Node v22.23.5；67/67、43/43、13/13、原六变异与四完整性负例、五项定向旧/新对照和 guard mutant 全部通过，默认发现不变。Linux 实测若无则 NOT_RUN。
- A58 保持 STOP；不混入 identity 新测试，不合并。A62 G4 后 Design 直接出 A58 续作（原 DEC-8=A 同一范围）或新必要裁定。

## 4. 回传
Execution→QA 与 QA→Design 各下一 seq，PR 评论 ID、exact SHA、两路径 diff、独立证据、限制。仅 Design 裁定 G4。

## 5. 边界
无产品源码、fixture、driver、依赖、历史证据、CI、UI、真实服务、部署修改；PR #2/#4 不动。授权不扩大，不自动修改用户机器网络。G5/G6/G7 仍需独立明确批准。
