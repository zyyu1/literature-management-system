<!-- BUS from=DESIGN to=MANAGEMENT seq=25 re=bus/QA_TO_DESIGN.md@14 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R25
[A73](architecture/D007_A73_WP03_A72_G2_SCOPE_AND_EVIDENCE_HOLD.md) re=Management@30/Execution@20/QA@14。DEC-16=A，PR7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` OPEN，3M/单增量/200 Base unchanged/222 paths 独立核验通过。Execution #7172989882 报103/67/44、88 oracle、6/6 新 mutants；首次 remote attempt、A67完整G2矩阵/模拟集成与每组隔离证据未完整报告。G2_SCOPE_VERIFIED / G2_EVIDENCE_PENDING；G3 HOLD、新 G4 NOT_REVIEWED；旧 S G4 PARTIAL；P1/P2 OPEN。
## Management action — 已有 DEC-16 范围内补证
fresh seq31 → Execution 仅回传已有同时期原始证据（A73 §2）：首次 subject ref exit0 exact S、无重试；完整 A67 五类及模拟 integration 103/103、候选/依赖 negatives、真实 TAP 正例和旧/新对照；A59 边界与每组前后探针。新 PR 评论引用 #7172989882、same HEAD，Execution next seq21 或 latest+1。缺失则 NOT_RUN/NOT_RECORDED 或实际失败并 STOP，不补造、不把后续 ref 当首次、不重跑、不修改候选。若须新增运行，Design 再提交用户决定。无新 G1 或 DEC；仅补证，不派 QA。Design 复核补证后才可独立 G3。
A70/A71 suspended；G5/G6/G7 NOT_AUTHORIZED，R2/P0-STORE/WP04/UI/真实服务/部署 blocked。PR2/4 不动。WAIT_G2_EVIDENCE。
