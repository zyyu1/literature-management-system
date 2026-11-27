<!-- BUS from=DESIGN to=MANAGEMENT seq=50 re=bus/EXECUTION_TO_QA.md@34 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R50（Design → Management）
[A97](architecture/D007_A97_P0STORE_R3_G2_ACCEPTED.md)：P0-STORE R3 上线准备切片 **G2 ACCEPTED** at exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`（PR #9）。用户在 Design 窗口点选 **DEC-40 = A：释放定向独立 G3**。

## Management 本轮动作
派**独立 QA**（QA 总线下一序号 23 或 latest+1）；**不派 Execution**。

## 给独立 QA 的任务（照 [R3_LIVE_READINESS](handoffs/P0-STORE/R3_LIVE_READINESS.md) §5，从 main 读取）
- 对象：PR #9 exact **`6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`**；Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`；首次且唯一 `ls-remote refs/pull/9/head` exit 0 且等于该 SHA，否则 STOP；全部证据在该 HEAD 上取得。
- 内容：语法；完整 `node --test`（P1-01..P1-15）；QA 自写严格 TAP 上游 67/44/103/91；审计正例 + 计数中性负例（至少一个修改路径，由专门检查报错）；**QA 自写 live 门控矩阵**——7 个条件逐一缺失或错误（含 `dav.jianguoyun.com.evil`、`jianguoyun.com`、IP 字面量、大写变体、错误端口、前缀越界、已提交 approval 非 null、approval 格式非法、计划自带 runId、Node 版本不符打桩），每项 QA 自己计数**零传输调用**并证明**未读取凭证值**；全部满足 + QA 自己的桩传输（无 socket）时首请求目标精确为 `https://dav.jianguoyun.com:443/dav/LMS-P0STORE/<runId>/…`；金丝雀扫描；确认 `PHASE1_LIVE_ENABLED` 无任何代码读取；**字节证明** gate/secret/trace/oracle/verdict/support/example-plan 相对 `b6fec8e` 逐字节不变；真实主机字面量只在 live 计划与 `LIVE_HOST` 常量；committed driver 22/22 + **≥3 个 QA 门控 mutant**。
- 环境：独立会话与目录、fresh full clone、`core.autocrlf=false`；Node 精确 v22.23.5 x64（完整路径、普通权限）；A59 离线；每组前后 guard+probe；**绝不设置真实凭证、绝不连接坚果云**。
- 交付：PR #9 新评论（A86 逐项表）→ QA 总线下一序号，`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，STOP。

## 边界
G4 由 Design。真实运行（第 3 阶段 / ACCESS-02 / G6）仍需之后用户单独批准 R3 的 exact SHA；G7 未授权；P0-STORE BLOCKED；A70/A71 suspended；冻结 UI、PR #2/#4 不动。
