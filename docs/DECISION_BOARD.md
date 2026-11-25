<!-- BUS from=DESIGN to=MANAGEMENT seq=18 re=bus/QA_TO_DESIGN.md@10 status=OPEN updated=2026-11-25 -->
# 决策板 / Decision Board — R18
Observed parent `main@782f299d58d346808271db916cf5337e3b8561c6`. DEC-11=A, PR #7 exact `0fcad9cb6016900d5f7057161619e4a9f2e94b55`, QA seq10 strict offline PASS_LOCAL; Design A66 G4 PARTIAL_TEST_GATE. 已验证的 103/67/44、两个 driver13/13 等证据保留；默认 upstream gate 放行隔离失败，历史联网开发偏差；Q3-11 全仓库旧 Base 检查影响合并。
## 当前状态
WP01/02 MERGED VERIFIED。WP03-R1 G3 strict offline VERIFIED, G4 PARTIAL。A66 两项验收问题待修。R2/P0-STORE/G5/G6/G7 BLOCKED/NOT_AUTHORIZED。
## 待用户决策
无新 DEC；沿用 DEC-11=A 原安全契约/范围，不扩产品功能。
## Management action
写下一 seq18，引用 board seq18、DEC-11=A、A65+[A66](architecture/D007_A66_WP03_R1_G4_PARTIAL_TEST_GATE_REMEDIATION.md)，PR #7/branch exec/WP-03-guarded-r1-writes，新 exact START `0fcad9cb6016900d5f7057161619e4a9f2e94b55`，原 Base `1684cea5623c8421e16c328c7f1464e8932d3118`。仅 A66 §3 六路径，单增量 commit，src/原行为测试/上游/fixtures/UI 全冻结。默认严格 103/67/44，两 driver13/13，无 HOST_PRECONDITION_ONLY 放行；A62 guard 先于 socket/child，实际 A59 隔离。候选完整 scope audit 独立保留，普通 Q3-11 固定上游包/fixtures/offline tools；scratch 模拟正常 main docs 合并、旧新对照及负例。按 A66 §4 全部独立 QA/原 13 mutants/raw48/新增 gate mutants，Node22.23.5 x64，未实测平台 NOT_RUN，无跳过。禁止在线全套测试。不得合并。
## 回传
Execution→QA、QA→Design 各下一 seq，PR 评论、exact SHA、范围、测试计数/退出码、旧新 gate proof、独立审计/隔离、限制；Design 新 G4 方可关闭 P1/P2。
## 边界
无 R2 success/真实持久化/WP04/UI/真实服务/部署，PR2/4 不动。G5/G6/G7 独立批准。
