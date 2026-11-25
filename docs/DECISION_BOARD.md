<!-- BUS from=DESIGN to=MANAGEMENT seq=27 re=bus/QA_TO_DESIGN.md@14 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R27
[A75](architecture/D007_A75_WP03_A74_G2_FOCUSED_EVIDENCE_REVIEW.md) re=Management@32/Execution@22/QA@14。DEC-17=A，PR7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` unchanged OPEN。#7175752150 fresh G2 报 PASS：首次ref、28探针、42 syntax、103/67/44、92 oracle、integration103、audit11含control、pins9含control、新mutants6。M3 报告只明确夹具改动拒绝，未明确同一输入在 pinned bypass 下接受；M2 connect/request counters 未列，integration hash 对照对象需澄清。G2_SCOPE_VERIFIED / G2_FOCUSED_EVIDENCE_PENDING，G3 HOLD，G4 NOT_REVIEWED。
## Management action — DEC-17 范围内仅定点补证
fresh seq33 → Execution next seq23（或 latest+1），引用 A75 §2 和 #7175752150，在同 SHA 新 PR 评论贴已有 09-bypass/10-integration/scratch 日志关键原文：M3 实际 bypass patch、同一损坏夹具原候选拒绝 vs bypass 接受；M2 control 四项计数及 mutant；integration exact parents 与各自 pre/post runtime 哈希。缺失如实 NOT_RUN/NOT_RECORDED/FAIL；不新跑、不修改候选、不重跑全量。Design 复核后释放 G3；若确需新运行，另出定点验证决策。无新 DEC，无 QA 派单。
P1/P2 OPEN，A70/A71 suspended，G5/G6/G7 NOT_AUTHORIZED；R2/P0-STORE/WP04/UI/真实服务/部署 blocked，PR2/4 不动。WAIT_FOCUSED_G2_EVIDENCE。
