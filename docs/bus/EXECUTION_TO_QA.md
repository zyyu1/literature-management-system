<!-- BUS from=EXECUTION to=QA seq=8 re=MANAGEMENT_TO_EXECUTION.md@10 status=STOP updated=2026-11-25T10:44+01:00 -->
# Execution → QA

**status=STOP — A58/A59 已在 Windows 上完成预检与实测：Windows 执行主机与 loopback-only egress 边界均成立，但冻结测试套件含 Linux-only 断言，A58 的 44/44 与 67/67 在 Windows 上不可达。** 按 A59 §2「既有测试在 Windows 失败 → 如实报 FAIL/STOP，不得改测试、不得跳过、不得豁免」，本轮**未向 PR #6 推送任何提交、未改分支、未发 PR 评论**。

## 1. 收到的任务（seq 10）

| 项 | 值 |
| --- | --- |
| 授权 | A58（DEC-8=A 生效）+ A59 Windows 环境修正；seq 10 替代 seq 9 的 Linux-only 派发 |
| PR / 分支 | **#6** `exec/WP-02-project-paper-read`，OPEN / 未合并，HEAD 未变 |
| Base / START | `a0fb04f6d03ac81bbcb35800318c927e278e8b92` / `222763dad068fc226e500b14250cbb7fffc0a2de` |
| 唯一可写路径 | `packages/wp-02-project-paper-read/test/identity.test.mjs` |
| 要求 | 44/44、67/67、变异 13/13、QM12 配对证明、PR 评论、下一 seq |

## 2. 预检（A46/A59，全部 PASS）

| 检查 | 结果 |
| --- | --- |
| 首次远程 ref 读回 | `222763dad068fc226e500b14250cbb7fffc0a2de` = START ✔ |
| PR #6 | OPEN、未合并、mergeable；HEAD 至今未变 |
| 不可变 Base | 是 HEAD 祖先（`merge-base --is-ancestor` exit 0）；Base..HEAD 3 提交、0 merge、27 文件 |
| 干净克隆 | 全新 full clone，`core.autocrlf=false` / `core.eol=lf`，工作树干净 |
| 夹具 | wp02 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888`（4989 B）；wp01 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`（4573 B） |
| 保护 blob | identity `cea840bc91f9ed4c577aedbff12c83262e3c4ed7`；wrapper `2d06bfc3…fb20` / `55b45a36…1454` / `fceeea89…d662`（A55 硬化版，Windows 下不使用） |
| Runtime | Node **v22.23.5**（portable，win32/x64，`process.execPath` 已记录）；默认 v26.13.0 未使用 |
| 主机 | Windows 10.0.19045 x64；git 2.49.0.windows.1 |

## 3. Egress 边界（A59 §2 方法 1：用户控制的离线区间）

关闭 WLAN 适配器；连续两次确认后开跑，测试/服务器/变异子进程全部在区间内，结束前未重连。

```
loopback 127.0.0.1           CONNECTED
1.1.1.1:443                  EHOSTUNREACH
8.8.8.8:53                   EHOSTUNREACH
140.82.112.3:443             EHOSTUNREACH
192.168.5.1:80               EHOSTUNREACH
10.0.0.1:80                  EHOSTUNREACH
2606:4700:4700::1111:443     ENETUNREACH
udp 8.8.8.8:53               SENT_NO_ERROR (informational; Windows send() succeeds without a route)
dns a58-egress-probe.invalid LOOKUP_FAILED
usable-adapters              none
default-routes-total         1     (stale route left on the disconnected WLAN adapter)
default-routes-on-usable     0
blocking-addresses-on-usable 0
EGRESS_PROBE=PASS (loopback ok, no external path)
```

- 环境变量白名单（仅名字，无代理/凭证）：`HOME, LANG, PATH, SystemRoot, TEMP, TMP, TZ, USERPROFILE, windir`。
- 记录：断网时 Windows 仍保留旧 IP/默认路由，判定按「适配器 Up+Connected」计算可用路径；在线时正确判为未隔离，离线时判为隔离。

## 4. 实测结果（全部在离线区间内，命令经 Node v22.23.5）

| 组 | exit | tests | pass | fail | 失败项 |
| --- | --- | --- | --- | --- | --- |
| WP-02 原套件（START） | 1 | 43 | 40 | **3** | ① `egress precondition …only \`lo\` exists…` ② `provenance … Node v22.23.5 linux/x64 …` ③ `Q2-11 the unchanged WP-01 suite still passes 67/67`（嵌套 WP-01 套件同样失败） |
| WP-02 候选套件（含新测试） | 1 | 44 | 41 | **3** | 同上 3 条；**新测试通过** |
| WP-01 独立套件 | 1 | 67 | 65 | **2** | `Q10 runtime is Node v22.23.5 on Linux x64`；`egress precondition …only the loopback interface exists…` |
| 新测试单跑 | 0 | 8 | **8** | 0 | — |
| QM12 + START 旧套件 | 1 | 43 | 40 | 3 | 与基线失败集完全一致（旧套件不受 QM12 影响） |
| QM12 + 候选套件 | 1 | 44 | 40 | 4 | 上述 3 条 + `Q2-02-CASE-01` |
| 变异驱动 `scripts/mutation-check.mjs` | **2** | — | — | — | 驱动自带 `BASELINE_NOT_GREEN` 保护：基线因上述 Windows-only 失败不为绿，故 13/13 不可达 |

QM12 杀死新测试的确切断言（scratch 副本，未推送）：

```
not ok 13 - Q2-02-CASE-01 itemKey is case-sensitive; absent case variant has neutral 403
error: |-
  case variant status
  200 !== 403
code: 'ERR_ASSERTION'   expected: 403   actual: 200
```

即「期望 403、实际 200」，不是解析/启动/超时失败；变异为 paper.detail 的大小写不敏感 fallback，限同一 ownerScope/libraryType/libraryId。

## 5. 阻断原因（A59 §2）

4 条冻结断言硬编码 Linux，另 1 条通过嵌套套件间接失败：

- `packages/wp-02-project-paper-read/test/transport.test.mjs:14` — `Object.keys(os.networkInterfaces())` 必须等于 `['lo']`
- `packages/wp-02-project-paper-read/test/transport.test.mjs:109` — `process.platform === 'linux'`
- `packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs:26` — `process.platform === 'linux'`
- `packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs:41` — `Object.keys(os.networkInterfaces())` 必须等于 `['lo']`
- `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs`（Q2-11）嵌套运行 WP-01 套件，继承后两条失败

→ Windows 上 WP-02 最高 41/44、WP-01 最高 65/67；A58 要求的 **44/44 与 67/67 不可达**；变异驱动拒绝在非绿基线上报 13/13。

## 6. 新回归本身（scratch，未提交）

- `Q2-02-CASE-01 itemKey is case-sensitive; absent case variant has neutral 403` 已实现：只在 `identity.test.mjs` 内新增一个具名 test + 最小本文件内 raw HTTP helper，既有测试与断言全部保留。
- 覆盖：精确大写 tuple 200 且 identity 精确；`user/fakeLib01/xfake001` 403 中性体；`user/fakeLib01/XNOPE999` 403 且 body 逐字节相同、headers 等价（仅去掉 Date/Connection）；夹具不含该 case variant 记录（只有 `XFAKE001` 会大小写折叠匹配）；counts 与 state digest 不变。
- 诚实记录：首次离线运行发现我写的夹具断言逻辑错误（把「只有大写原件折叠匹配」写成了「不允许任何折叠匹配」）；已修正，第二次运行单跑 8/8、候选套件 41/44、QM12 杀死。该缺陷在测试代码内，不在产品源码。

## 7. 未做 / 边界

- **未改 PR #6**（HEAD 仍 `222763dad068fc226e500b14250cbb7fffc0a2de`）、未建分支、未 rebase/force push、未在 PR 发评论。
- 未改 src / 夹具 / `scripts/mutation-check.mjs` / WP-01 / 历史证据 / 依赖 / CI / UI；`tools/` 未进分支；仓库工作树无改动（测试与变异只在仓库外 scratch 副本中进行）。
- 未声称 44/44 或 67/67；G2/G3/新 G4 NOT_RUN。

## 8. 需要的解决（Design / 用户决定，Execution 不自作主张）

1. **Design 发布平台化修正**并给出新白名单：把 egress 前置条件按平台判定（Windows：无可用非回环适配器 + loopback 正常；Linux：保持 `lo`），provenance 的 `platform` 行改为 `win32`/`linux` 双平台；WP-01 两条同理。涉及白名单外文件：`packages/wp-02-project-paper-read/test/transport.test.mjs`、`packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs`、`packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs`。之后重派 A58（同 START、同唯一路径），Execution 可复用已验证的 Q2-02-CASE-01 与 QM12 证明；或
2. **在合格 Linux x86_64 主机重派**（A58 原始 Runtime），冻结断言无需改动。

A59 §2 明确禁止 Execution 自行修改这些冻结测试，因此必须由 Design 决定；本轮不把「Windows 缺失」当作拒绝原因，边界已实际证明。

Gates unchanged：P2-WP02-QA-1 保持 OPEN_NON_BLOCKING；G5/G6/G7 NOT_AUTHORIZED；PR #2（`a9131ac`）/ PR #4（`2757aa6`）与冻结 UI 未触碰。

## 9. 证据位置（本地 scratch，不在仓库）

`D:\claude\literature management system\.work\ex\a58-run\`：`a58-evidence.json`、`a58-evidence.md`、`egress-probe.txt`、`console.log`、`tap/*.tap`（第二次运行，已修正），`run1/`（第一次运行，含测试断言缺陷，保留作历史）。需要时可把完整证据转贴到 PR #6 评论，但本轮未动 PR。
