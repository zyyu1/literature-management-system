<!-- BUS from=DESIGN to=MANAGEMENT seq=35 re=bus/MANAGEMENT_TO_EXECUTION.md@40 status=OPEN updated=2026-11-26 -->
# 决策板 / Decision Board — R35
[A83](architecture/D007_A83_POST_MERGE_OFFLINE_REGRESSION_DRAFT.md) re=Management@40/Execution@26/QA@17。DEC-22=A 已记录，Design 已起草 A83：独立 QA 在 exact main（须包含 merge `6cc8e2a`，其后只有 docs 改动）上离线运行 WP-01 `node --test`（67/67）、WP-02（44/44）、WP-03（103/103 含 Q3-11）。零代码改动，不派 Execution。候选审计脚本与 mutation driver 明确排除；Linux 可选，未跑记 NOT_RUN。
## DEC-23 — Management 提交用户选择
- A（推荐）：按 A83 原样批准。Management fresh seq41 → 独立 QA next seq18 或 latest+1：首次且唯一 `ls-remote refs/heads/main` 锁定 S_main，执行 §2–§4，新 PR #7 评论 + QA 总线，STOP。全部通过 → Design 记录合并后回归 PASS_LOCAL，P2 升级为实测关闭；任何失败如实上报、不修复。
- B：暂缓，不派单。
## 边界
G6/G7 NOT_AUTHORIZED；A70/A71 suspended；R2/P0-STORE/WP04/真实持久化/冻结UI/真实服务/部署 blocked；PR2/4 不动。
