<!-- BUS from=MANAGEMENT to=EXECUTION seq=27 re=DECISION_BOARD.md@23 status=OPEN updated=2026-11-25T20:10+01:00 -->
# Management → Execution

**来源:** `docs/DECISION_BOARD.md` seq 23（R23），用户选定 **DEC-15 = A**；DEC-14=A 仍有效。
**授权文件:** `D007_A70_WP03_NODE24_MIGRATION_DESIGN.md` + **`D007_A71_A70_CONTAINER_EGRESS_EQUIVALENCE.md`**

## 第 0 步（必须先做，未通过不得改任何文件）

在**同一个云容器**里，先证明该容器是「平台强制断网」的上下文。**拿不出可信证据 → STOP**，不进入实现。

**A. 平台/操作员证据（必需）**
- 容器 ID / 会话标识、网络模式（`network=none` 或平台等价的"无网络附加"）、命名空间标识；
- 平台证明：无 host 网络、无 bridge、无共享网络命名空间、无继承的可联网 fd、
  无 host proxy/daemon/socket、无提权/逃逸接口可重新挂网；
- 隔离区间的起止；上述事实脱敏记录（不含凭证）。
- **平台若不能证明 → STOP**。不要求特权容器，也不得自行提权。

**B. 同一上下文内的 OS 事实**
- Linux x86_64；`node` 绝对路径解析为 **v24.22.3 x64**（含子进程 `process.execPath`）；
- `/sys/class/net` 与 OS 接口清单**只有 `lo`**；回环 up；无非回环地址；
- `/proc/net/route` 与 IPv6 路由清单：无可用非回环路由（回环/本地路由可存在）；
- 无代理与继承凭证；显式最小环境变量白名单。
- **guard 逻辑一行不改**；旧 checkout 若因 Node22 pin 拒绝，不得绕过，先做只读前置核对，改动后再由候选 guard 放行。

**C. 探针（每个命令组前/后各一次，同一隔离上下文内）**
- 正例：`127.0.0.1` bind/connect 成功；若启用 IPv6，另验 `::1`；
- 反例：非回环 IPv4/IPv6 的 TCP、UDP、DNS（唯一保留的 `.invalid` 名），含外部与 LAN 目标；
  记录目标类别、错误/退出码、超时与 OS 事实；
- 可直接在已隔离上下文里跑 A54/A55 的探针逻辑（**不要嵌套 `unshare`**），记录原始 blob ID；
- 仅当「平台证据 + OS 事实 + 探针 + guard」四者一致，才可记 `EGRESS_PROBE=PASS`；
  **联网主机上不得做主动外网探测**，前置不确定则不上测试。

**D. Git 与传输分离**
- Git/拉取/推送/证据发布在**隔离之外**完成；进入隔离前准备好完整本地对象与已验证字节（不可挂载可联网资源）；
- 测试期间无任何外部 Git/API；所有子进程终止后，才可由宿主/操作员转移脱敏结果、补丁与本地对象；
- 推送/发评论前复核源与对象 ID。**无可用平台转移机制 → STOP**。

## 第 1 步：A70 迁移（仅在上述通过后）

- 原 Base B `1684cea5623c8421e16c328c7f1464e8932d3118`；迁移 START S `e6b1180e4e3e5790958ae3319af18bba8889ffbc`。
- 新分支 `exec/WP-03-node24-runtime-migration`（从**精确 S**），新 PR；**恰好一个单父增量提交**；不动 PR #7。
- **13 个修改路径**（同 A70 §2，不得增删改名）：WP-01 五处、WP-02 四处、WP-03 四处；
  禁止改产品 src、原始 evidence、夹具、`tools/offline`、旧设计/QA 指令、CI、依赖、无关包。
- **完整性顺序**：WP-01 字节 → Q2-11 五条 SHA-256 overlay（A70 > A60 > 原值，19 条路径不变）→
  WP-02 → Q3-11 九条 blob overlay（原 51 条其余 42 条不变）→ auditor（保留 B/A66 历史、钉住 S、
  验 B..S 两提交/22 新增/0 Base 修改、S..HEAD 恰 13 M、B..HEAD 22 A + 9 M、200 条 Base 路径齐全、
  除 9 条 overlay 外逐字节对 Base、未改 S 路径逐字节对 S、mode/符号链接/干净树）。禁止自哈希。

## 第 2 步：完整 G2（Node v24.22.3，隔离上下文内）

syntax 全部 `.mjs`；WP-01 **67/67**；WP-02 **44/44**（嵌套 67/67）；WP-03 默认 **103/103**（含两上游）；
两个既有驱动各 **13/13**；A67 五类矩阵自测；模拟 integration 树默认 **103/103**；raw 48；
零 fail/skip/todo/cancelled、exit 0、strict TAP；每组前探针。
不跑 Node22 候选做对照；旧/新对照用合成 TAP/guard 输入。任一失败/边界漂移/日志缺失/传输不安全 → STOP。

## 交付

- PR 评论：新 SHA、13 路径 diff、old/new 哈希、环境与平台证据、命令与计数、探针、限制；
- 写 `docs/bus/EXECUTION_TO_QA.md` 下一 seq，然后 **EXECUTION STOP**。
- **G3 必须等 Design 核验 13 路径与 literal overlay 后**，由用户另开会话、用独立的隔离证据进行。

## 边界

- 不得改宿主网络/系统设置、不得安装、提权、创建资源、挂载 host socket 或绕过 guard；
- G5/G6/G7 **NOT_AUTHORIZED**；两个 PR 都不得合；R2、真实持久化、WP-04、UI、真实服务/部署未授权；
  PR #2/#4 与冻结 UI 不动；PR #7 仍 `G4 PARTIAL_TEST_GATE`、P1/P2 OPEN。
