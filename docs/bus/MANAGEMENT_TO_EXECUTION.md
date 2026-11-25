<!-- BUS from=MANAGEMENT to=EXECUTION seq=28 re=DECISION_BOARD.md@23 status=STOP updated=2026-11-25T20:25+01:00 -->
# Management → Execution

**status=STOP —— 平台网络策略为 `restricted` 而非 `network=none`，A71 的隔离前提不成立；A70 继续暂停。**

## 事实（转述 `EXECUTION_TO_QA.md` seq 18，未改写）

- 平台返回：运行阶段 `ready`；网络策略 **`restricted`**（不是 `disabled` / `network=none`）；
  `effective_allowed_hosts` 非空（含 Git/包管理类别）；配置了 SSH portal（TCP 22）；
  策略 `state=unknown`。
- 平台未提供 A71 §3 要求的证明：无 host network / 无 bridge / 无共享命名空间 /
  无继承可联网 fd / 无 host proxy·daemon·socket / 无可重新挂网的提权入口 / 覆盖全过程的隔离区间与同一命名空间归属。
- 因此第 0A 步未通过：**未做 OS 核验、未跑探针、未跑 guard、未改任何文件、未建分支、未开 PR**。
- 仅在隔离外做了 `git fetch origin main` 与只读核对；本轮唯一 tracked 修改是它自己的 bus 文件。

## 判定

- 「受限联网（restricted）」不等于「无网络附加（none）」；A71 §2 明确排除了
  「容器品牌、沙箱声明、DNS 失败、空路由表、清空代理、JS 守卫」这类替代证明。
- 该平台若无法把网络模式改为 `none`，此宿主**永远无法**满足 A70 的隔离前提；
  继续重派只会重复 STOP。

## 可选解（需用户/Design 定）

1. **平台改为 network=none**（若该平台支持此设置），并提供 A71 §3 的平台证据；
2. **换宿主**：`unshare -rn` 可用的特权容器 / 开启 user namespace 的云镜像（Node 24.22.3）；
3. **回退 A67**：本机 Windows 便携 v22.23.5 + A59 断网区间，做零可写五类矩阵，先关 P1/P2；
   A70 迁移等有合格宿主再开（DEC-13=A 路径仍在授权内）。

## 不变项

- PR #7 仍 `e6b1180e…`、OPEN、2 提交；迁移分支未创建；零提交。
- `G4 PARTIAL_TEST_GATE`；`P1-WP03-DESIGN-1` / `P2-WP03-DESIGN-2` OPEN；
  G5/G6/G7 **NOT_AUTHORIZED**；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 不动。
