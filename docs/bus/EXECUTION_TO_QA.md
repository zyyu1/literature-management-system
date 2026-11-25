<!-- BUS from=EXECUTION to=QA seq=13 re=MANAGEMENT_TO_EXECUTION.md@15 status=OPEN updated=2026-11-25T15:47+01:00 -->
# Execution → QA

## A58 continuation — Q2-02-CASE-01 regression ready for independent G3

| Item | Value |
| --- | --- |
| PR / branch | **#6** `exec/WP-02-project-paper-read` → `main` (OPEN, do not merge) |
| Exact candidate SHA | `8751dd2b4f041d5a17af894ac9cca8bd28560d66` |
| Parent / new exact START（A63） | `ab4a37c8905ebc9d3f889164c2f8164c9286051d` |
| 祖先链 | `222763d…`（原 A58 START）→ `59df257a…`（A62 START）→ `ab4a37c…`（A63 START） |
| 不可变 Base | `a0fb04f6d03ac81bbcb35800318c927e278e8b92` |
| Execution report comment | **7165782458**（PR #6） |
| Authority | A58（DEC-8=A）+ A59 + A63 |
| QA plan | A58 §2 + A59 §2 + `docs/architecture/D007_A63_A62_EXACT_G4_PASS_LOCAL_AND_A58_CONTINUATION.md` §3 |

## 交付事实

- **唯一路径**：`packages/wp-02-project-paper-read/test/identity.test.mjs`（+66/−1）；仅新增具名回归 `Q2-02-CASE-01 itemKey is case-sensitive; absent case variant has neutral 403` 与最小同文件 `node:http` helper，既有 43 条测试/断言全保留。
- A60/A61/A62 基建、WP-01（20 文件 = 原 19 + overlay）、Q2-11、helper、夹具、driver、harness、证据与 UI 与 A63 START 逐字节一致；无其它 tracked 改动。
- 环境：Windows 10.0.19045 x64、Node **v22.23.5** win32/x64；A59 离线区间，每组前重跑探针；`EGRESS_PROBE=PASS`（外部/LAN TCP `EHOSTUNREACH`、IPv6 `ENETUNREACH`、DNS 失败、`blocking-on-usable=0`、`routes-on-usable=0`）。
- 实测（全部在边界内）：`node --check` 1/1；WP-01 **67/67**；WP-02 **44/44**（嵌套 Q2-11 67/67）；committed driver **13/13**；未变异 targeted identity **8/8**。
- QM12 配对（scratch，不推送）：A63 START 旧套件在 QM12 下 **43/43 exit 0**；候选下 **43 pass / 1 fail**，仅 Q2-02-CASE-01，失败为 **ERR_ASSERTION expected 403 / actual 200**（`200 !== 403`，非崩溃/超时）。
- 测试内部用 raw HTTP 验证两个 403 的 body 逐字节相同、headers 仅在 Date/Connection 噪声上不同，且 digest/counts 不变。

## QA 要求

独立用户开启的 Windows（优先）/Linux 会话、全新 detached clone at `8751dd2b`、自己的 A46/A59 预检与探针；核对 one-file diff、A60 基建字节不变、44/44 + 67/67 + 嵌套 67/67 + 13/13；独立 raw HTTP 字节/摘要验证与 QM12 配对对照。Linux 未实测记 `NOT_RUN`。

Gates unchanged：A60/A61/A62 已冻结（A63 G4 PASS_LOCAL）；原 P2-WP02-QA-1 仍 `OPEN_NON_BLOCKING`，仅 Design 新 exact-SHA G4 才能关闭；G5/G6/G7 **NOT_AUTHORIZED**；PR #2（`a9131ac`）、PR #4（`2757aa6`）与冻结 UI 未触碰。
