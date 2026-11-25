<!-- BUS from=EXECUTION to=QA seq=17 re=MANAGEMENT_TO_EXECUTION.md@22 status=STOP updated=2026-11-25T19:01+01:00 -->
# Execution → QA

**status=STOP — 环境不匹配（A70 运行时）：本执行窗口没有 Node v24.22.3 x64，而 A70 / 决策板 seq 22 明确禁止安装或伪造版本。** 未创建分支、未提交、未开 PR、未运行任何测试；PR #7 HEAD 仍 `e6b1180e4e3e5790958ae3319af18bba8889ffbc`（未动）。

## 收到的任务（seq 22）

- **DEC-14=A** → A70 WP-03 Node24 迁移：新分支 `exec/WP-03-node24-runtime-migration`（从 S `e6b1180e…` 创建）、新 PR、恰好 13 个修改路径、单一增量提交、Node **精确 v24.22.3 x64**。
- 原 Base B `1684cea…` 与迁移 START S `e6b1180e…` 保留为比较基准。

## 实测环境（只读）

| 项 | 实测 |
| --- | --- |
| OS | Microsoft Windows NT 10.0.19045.0 x64 |
| PATH `node` | **v26.13.0**（`C:\Program Files\nodejs\node.exe`） |
| 现有便携运行时 | **v22.23.5** win-x64（`.work/node22/node-v22.23.5-win-x64/node.exe`） |
| Node **v24.22.3** | **不存在**：工作区、Downloads、Program Files、nvm/fnm/Volta 目录及逐目录 `node.exe` 搜索均无 v24 |
| 授权限制 | A70 / board seq22：**不得安装、不得伪造版本、不得放宽 TAP/隔离** |

## STOP 原因

- A70 的 G2 要求全部回归在 **Node v24.22.3 x64** 下运行；本窗口无法提供该 runtime。
- 获取官方便携 Node v24.22.3 属于安装/下载运行时；本轮未获授权，board seq22 明确禁止安装。
- 因此无法在不违反授权的前提下创建迁移分支或提交。PR #7 保持 OPEN / 未合并、HEAD 未变。

## 需要的解决（Design / 用户决定，Execution 不自作主张）

1. 提供一个**已安装 Node v24.22.3 x64** 的 Windows 或 Linux 执行主机；或把官方便携 win-x64 运行时放到本机并告知路径；或
2. 明确授权在 scratch 目录下载**官方 Node v24.22.3 win-x64**，并记录来源与 SHA-256 / 完整性；获授权后 Execution 将重跑预检并按 A70 执行。

在此之前不安装、不伪造版本、不改 PR #7、不合并。

## 本轮未做

未创建分支、未修改任何 tracked 路径、未提交、未推送、未开 PR、未运行测试/探针/变异；`tools/` 未进分支；PR #2（`a9131ac`）、PR #4（`2757aa6`）与冻结 UI 未触碰。

Gates unchanged：G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权。