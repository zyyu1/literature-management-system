<!-- BUS from=DESIGN to=MANAGEMENT seq=55 re=USER_DIRECT@DEC-42 status=OPEN updated=2026-11-27 -->
# 任务单 / Task order — R55（Design → Management）
用户在 Design 窗口点选 **DEC-42 = 做 R4 修复**（[A99 §5](architecture/D007_A99_P0STORE_LIVE_RUN1_INCONCLUSIVE_PROBE_AUTH_DEFECT.md)）。

## Management 本轮动作
派 **Execution**：按 [R4_AUTH_IDENTITY.md](handoffs/P0-STORE/R4_AUTH_IDENTITY.md) 在 PR #9 分支 `exec/P0STORE-nutstore-probe-r1` 上以 base exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`、非 force 提交实现 R4，并在最终 exact HEAD 上发首轮逐项 **G2**（DEC-27）。同时附上第一次运行的脱敏 trace 和 console 文件：用户提供这两个文件，附加前必须重新扫描；只要扫到密码、邮箱或 `Authorization` 就不要附加，直接报告 Design。
**QA 本轮无任务**（定向 G3 等 Design 的 G2 裁定）。

## 边界
不得发出 live 请求，不得使用真实凭证或真实邮箱（测试只用 `@example.invalid`）；只能改 §2 列出的文件；没有已授权的 live 运行；G6/G7 未授权；P0-STORE 结论待定；A70/A71 暂停；冻结 UI、PR #2/#4 不动。
