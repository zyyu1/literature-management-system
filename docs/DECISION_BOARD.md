<!-- BUS from=DESIGN to=MANAGEMENT seq=47 re=bus/EXECUTION_TO_QA.md@32 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R47（Design → Management）
[A94](architecture/D007_A94_P0STORE_R2_G2_ACCEPTED.md)：P0-STORE R2 判定修正 **G2 ACCEPTED** at exact `b6fec8e3b0ec217b142b428080454588e6866744`（PR #9）。P1-03 两行断言例外已由 Design 核实并接受（规格漏列）。用户在 Design 窗口点选 **DEC-38 = A：释放定向独立 G3**。

## Management 本轮动作
派**独立 QA**（QA 总线下一序号 22 或 latest+1）；**不派 Execution**。

## 给独立 QA 的任务（定向，照 [R2_VERDICT_FIX](handoffs/P0-STORE/R2_VERDICT_FIX.md) §5，从 main 读取）
- 对象：PR #9 exact **`b6fec8e3b0ec217b142b428080454588e6866744`**；Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`；首次且唯一 `ls-remote refs/pull/9/head` exit 0 且等于该 SHA，否则 STOP；全部证据在该 HEAD 上取得。
- 内容：语法；完整 `node --test`（P1-01..P1-14）；QA 自写严格 TAP 上游 67/44/103/91；审计正例 + 计数中性负例（至少一个修改路径，由专门检查报错）；**QA 自写 11 性格判定矩阵与原因顺序**（throttle/server-error/redirect/bad-cert = INCONCLUSIVE；stale-read、weak-etag、unresolvable-ack 根因在最前）；零出网复核（5 种组合）+ 金丝雀扫描；committed driver 16/16 + **≥3 个 QA 独立 mutant**（针对新规则）；**字节证明**：gate/plan/secret/trace/runner/oracle/support/plans 相对 `88e1bd7` 逐字节不变，`PHASE1_LIVE_ENABLED = false`；核对 P1-03 改动仅限两处断言。
- 环境：独立会话与目录、fresh full clone、`core.autocrlf=false`；Node 精确 v22.23.5 x64；A59 离线或合格 A54/A55 Linux；每组前后 guard+probe；**不得接触任何真实坚果云主机、账号或凭证**。
- 交付：PR #9 新评论（A86 逐项表）→ QA 总线下一序号，`re=MANAGEMENT_TO_EXECUTION.md@<派单seq>`，STOP。

## 边界
G4 由 Design（通过后 LIM-P0S-1 关闭）。第 3 阶段 / ACCESS-02 / G6、G7 未授权；P0-STORE BLOCKED；A70/A71 suspended；冻结 UI、PR #2/#4 不动。
