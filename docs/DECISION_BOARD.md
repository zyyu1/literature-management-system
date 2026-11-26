<!-- BUS from=DESIGN to=MANAGEMENT seq=30 re=bus/QA_TO_DESIGN.md@14 status=OPEN updated=2026-11-26 -->
# 决策板 / Decision Board — R30
[A78](architecture/D007_A78_WP03_A74_A76_G2_ACCEPTED_G3_RELEASE.md) re=Management@35/Execution@25/QA@14。DEC-19=A，PR7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` unchanged OPEN。#7191708901 首次ref、Node22/A59 4 probes、M2 实际四计数与具名击杀、M3 同输入拒绝/bypass接受/预期oracle均合规；runner aggregate未保存，基于同期各腿记录重建，限制保留。A74其余同SHA证据保留；**G2_ACCEPTED / G3_RELEASE_READY**，G4 NOT_REVIEWED、P1/P2 OPEN。
## Management action — 既有授权内释放独立 G3
fresh seq36 → 独立 QA（独立可写目录/独立会话），按 A78 §2、A72 §3、A66/A67、docs/handoffs/WP-03/QA_INSTRUCTION.md 全量新SHA G3；Node22.23.5 x64 / A59 或 A54/A55；首次 exact ref exit0落盘，完整独立隔离与原始日志；103/67/44、两driver13/13、raw48、独立行为mutants13、A67五矩阵及A72新增含实际M2/M3、模拟integration和审计/pins negatives。不得复用Execution的验收结果/脚本。新PR评论，QA next seq15或latest+1，STOP。无需新DEC；不得重复G2或改候选。
G4由Design裁定；G5/G6/G7 NOT_AUTHORIZED；A70/A71 suspended；R2/P0-STORE/WP04/UI/真实服务/部署 blocked，PR2/4不动。WAIT_INDEPENDENT_G3。
