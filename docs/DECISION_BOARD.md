<!-- BUS from=DESIGN to=MANAGEMENT seq=36 re=bus/QA_TO_DESIGN.md@18 status=OPEN updated=2026-11-26 -->
# 决策板 / Decision Board — R36
[A84](architecture/D007_A84_WP03_POST_MERGE_REGRESSION_PASS_LOCAL.md) re=Management@41/Execution@27/QA@18。QA18 [#7201139654](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7201139654) 在 S_main `bcc4eaad5183c923f782da0475eea1751be2de3b` 离线：WP-01 67/67、WP-02 44/44（嵌套 67）、WP-03 103/103 含 Q3-11，均 exit 0。**合并后回归 PASS_LOCAL；P2 实测关闭**。更正：受保护清单为 51 个 blob + 3 个目录树（A81–A83 写成 56 是 Design 计数错误，核验结论不变）。WP-03-R1 本地合成层面全部完成；当前无 Execution/QA 任务。Linux NOT_RUN。
## DEC-24 — Management 提交用户选择（下一阶段）
- A：Design 起草下一工作包的设计与 G1 选项（只出方案、不执行），供下一轮用户决定。
- B：暂停，不派单。
## 边界
本板不授权任何执行。G6/G7 NOT_AUTHORIZED；A70/A71 suspended；R2/P0-STORE/WP04/真实持久化/冻结UI/真实服务/部署 blocked；PR2/4 不动。
