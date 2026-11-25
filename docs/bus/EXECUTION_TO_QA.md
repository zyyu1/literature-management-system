<!-- BUS from=EXECUTION to=QA seq=22 re=MANAGEMENT_TO_EXECUTION.md@32 status=OPEN updated=2026-11-25T22:58+01:00 -->
# Execution → QA

## A74 fresh read-only G2 revalidation — **PASS** @ unchanged `c40e927…`

**新 PR 评论：[#7175752150](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7175752150)**（同 exact SHA，引用原报告 [#7172989882](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7172989882)、补证 [#7173685843](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7173685843) 与 A74）。

| Item | Value |
| --- | --- |
| PR / 分支 | **#7** `exec/WP-03-guarded-r1-writes` → `main`（OPEN / 未合并；G5 未授权） |
| Exact HEAD | `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` |
| 父 / A72 START S | `e6b1180e4e3e5790958ae3319af18bba8889ffbc` |
| A66 START T / Base B | `0fcad9cb…` / `1684cea…` |
| 授权 | DEC-17=A；A74 §2（fresh read-only revalidation） |
| QA 计划 | `docs/architecture/D007_A74_WP03_A72_READ_ONLY_G2_REVALIDATION_DRAFT.md` §2 + A72 §3 |

## 本轮性质

- 全新只读重验，不改候选、不新增提交/分支/PR、不 merge/rebase/reset/force push；候选 worktree 干净。原 A72 报告的首次 ref/探针缺口作为历史保留，未追认。
- **首次 subject ref**：clone 前 `ls-remote refs/pull/7/head`，`2026-11-25T21:32:02+01:00`，exit 0，精确 `c40e927…`；命令/输出/时间/哈希落盘 `.work/ex/a74/01-lsremote.*`。
- TLS `openssl`、凭证 helper `manager` 在首次读取前配好；未关闭 TLS 校验。

## 环境与隔离

- Windows 10.0.19045 x64；Node **v22.23.5** x64（绝对路径已记录）。
- A59 区间 **2026-11-25T22:51:57+01:00–22:55:43+01:00**（226.6 s）；零流量守卫 PASS；**28/28** 组边界探针 PASS（每组前后各一次）；回环 `CONNECTED`，IPv4/IPv6/LAN TCP 与 UDP DNS/DNS 均拒绝。
- OS facts（start/end，脱敏）：16 adapters（外部 WLAN/以太网断开，3 个 Up pseudo non-IP），唯一 stale route 在断开网卡；无 proxy 变量；无 adapter 名/MAC/非回环地址。

## 门禁（全部 exit 0）

- syntax **42/42**；WP-01 原始 TAP **67/67**；WP-02 原始 TAP **44/44**（嵌套 WP-01 67/67）；WP-03 默认 **103/103**；两个 driver 各 **13/13**；candidate audit `CANDIDATE_SCOPE_OK`（200/22/6/3/222）。
- strict TAP oracle **92/92**（真实 67/44 transcript；全部负例、旧/新、F1–F3、T `HOST_PRECONDITION_ONLY` 对照；flag 设/不设无影响）。
- 四个 A66 绕过类 **4/4**；隔离 integration 旧拒绝/新 **103/103**（nested 67/44，runtime 哈希不变）；candidate auditor 负例 **11/11**；pinned 依赖负例 **9/9**。
- 解析器变异 **5/5 KILLED**；审计范围变异 **1/1 KILLED**（均为预期断言失败，非崩溃/超时）。

## 日志与边界

- 原始日志：`.work/ex/a74/logs/`（14 组、28 probes、89 文件、约 93 KB，含 transcript/OS facts）；预检与 live recheck：`.work/ex/a74/01-…`, `03-preflight.txt`, `04-live-recheck.txt`；结果 JSON 在 `.work/ex/a74/scratch/`。均未提交。
- Live recheck（22:56:59 +01:00，后续读取）：PR #7 `open/unmerged`，head 精确 `c40e927…`。

**请 Design 核验本轮 fresh G2 证据后再决定是否释放独立 QA（QA 下一 seq 从 15 起）**；本 seq 不是 QA dispatch，不构成 G4/G5。Linux runtime NOT_RUN；G5/G6/G7 NOT_AUTHORIZED；R2、真实持久化、WP-04、UI、真实服务/部署未授权；PR #2/#4 与冻结 UI 未触碰；A70/A71 继续暂停。
