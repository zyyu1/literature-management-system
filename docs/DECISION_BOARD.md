<!-- BUS from=DESIGN to=MANAGEMENT seq=19 re=bus/QA_TO_DESIGN.md@11 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R19
Observed parent `main@8589753b4fb0db0dd091cd65b66ab9b1e5a9c762`. A66 exact PR #7 `e6b1180e4e3e5790958ae3319af18bba8889ffbc`, QA seq11 PARTIAL_TEST_GATE. 默认103/67/44、双 driver13/13、独立 raw48、mutants13、egress12 全绿，独立专项 matrix NOT_RUN。Design [A67](architecture/D007_A67_WP03_A66_FOCUSED_INDEPENDENT_QA.md) G4 PARTIAL_TEST_GATE；两项发现仍 OPEN，未确认新增候选缺陷。
## 当前状态
WP01/02 MERGED VERIFIED。WP03-R1 A66 主门禁通过、G3/G4 PARTIAL；A67 same-SHA read-only QA。R2/P0-STORE/G5/G6/G7 BLOCKED/NOT_AUTHORIZED。
## 待用户决策
无新 DEC，沿用 DEC-11=A；不放宽 A66，不增功能。
## Management action
写下一 seq19，引用本板 seq19、A65+A66+[A67](architecture/D007_A67_WP03_A66_FOCUSED_INDEPENDENT_QA.md)，PR #7 unchanged exact HEAD `e6b1180e4e3e5790958ae3319af18bba8889ffbc`，START `0fcad9cb6016900d5f7057161619e4a9f2e94b55`，Base `1684cea5623c8421e16c328c7f1464e8932d3118`。**零可写 tracked 路径**，Execution 只核对 HEAD/既有报告 #7168708378 后写 Execution→QA seq16，QA plan 指向 A67，不重新开发/提交/全量自测。
QA 独立补齐 A67 §3 全部五类矩阵：strict TAP 及旧新对照、四门禁绕过具名 mutants、模拟 integration docs + 默认103/103、candidate audit negatives、pinned dependency negatives。保留同 SHA seq11 已通过的业务验证，不重复其全量；模拟集成全套仍必须。Node22.23.5 x64、A59/A54/A55、独立 fresh clone/探针，禁止联网全套；真实代码零修改。任何漂移/失败 STOP。
## 回传
QA 原始 PR 评论、QA→Design seq12，引用 seq11 和 exact SHA，完整缺失矩阵及旧新证据、独立隔离、退出码/限制。Design 合并同 SHA 证据后新 G4；不等于合并 PR。
## 边界
G5/G6/G7 分别批准；R2/真实持久化/WP04/UI/部署未授权；PR2/4 不动。
