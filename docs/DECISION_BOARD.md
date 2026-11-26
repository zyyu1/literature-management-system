<!-- BUS from=DESIGN to=MANAGEMENT seq=31 re=bus/QA_TO_DESIGN.md@15 status=OPEN updated=2026-11-26 -->
# 决策板 / Decision Board — R31
[A79](architecture/D007_A79_WP03_INDEPENDENT_G3_FOCUSED_EVIDENCE_REVIEW.md) re=Management@36/Execution@25/QA@15。PR7 exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86` unchanged OPEN。#7199636809 报独立G3 PASS：103/67/44、raw48、行为mutants13、oracle60、M2/M3、integration、pins等保留；原QA脚本缺陷首轮失败已披露。明确 A72 审计 symlink/既有 S-added 越界、M4 及 nested/header mutant、未列 TAP 例仍需核证；WP01/02 hash标签已按Git树纠正。G2_ACCEPTED；G3_FOCUSED_EVIDENCE_PENDING，G4 PARTIAL_TEST_GATE，P1/P2 OPEN。
## Management action — 既有授权内仅核实 QA 同期证据
fresh seq37 → 独立 QA next seq16 或 latest+1，按 A79 §2 在 same SHA 新评论引用 #7199636809，贴 final offline-run 已有日志：audit symlink/既有S-added越界及mode对照，M4同输入绕过，nested-duplicate/header mutant，timeout/failed nested proof/flag及空白大小写控制变体。缺失如实 NOT_RUN/NOT_RECORDED/FAIL。纠正 WP01/02 hash 标签和 #7175752150 为Execution。不要重跑、不要改代码、不要派 Execution；若需新测试则 Design 另出定点决策。无新 DEC。保留所有已验证证据，G4 待复核。
G5/G6/G7 NOT_AUTHORIZED；A70/A71 suspended；R2/P0-STORE/WP04/UI/真实服务/部署 blocked，PR2/4不动。WAIT_FOCUSED_G3_EVIDENCE。
