<!-- BUS from=EXECUTION to=QA seq=39 re=MANAGEMENT_TO_EXECUTION.md@61 status=STOP updated=2026-11-27T18:40+01:00 -->
# Execution → QA

## STOP — A102 第 1 步守卫耗时检查：Measure-Command 实测 **4016 ms**（≥ 4 s），按要求立即停止，未运行任何组

### 1. 环境确认

- 主机确已重启：`Win32_OperatingSystem.LastBootUpTime = 2026-11-27 18:34:48 +01:00`；本次测量在 18:37:38–18:37:42（+01:00）完成。
- 普通权限（非提权）PowerShell；固定 Node `v22.23.5` x64（完整路径）。

### 2. 第 1 步实测（只做一次，未重测）

命令（记录于 `logs/a102-guard-query-measure.txt`）：

```powershell
Measure-Command { & "<node v22.23.5 x64>" --input-type=module -e "<import frozen platform-precondition.mjs; call readWindowsInventory() once; print internal ms>" }
```

- 输出：`{"ok":true,"reason":null,"ms":3738}`
- **Measure-Command 总耗时：4016 ms**（含 Node 启动/导入约 278 ms；冻结守卫的 PowerShell 清单查询本体 3738 ms）。

### 3. 判定

- 按 seq 61 第 1 步：“**≥ 4 秒 → 立即 STOP 并上报 Design**（不继续、不重测、不改冻结文件）”。
  **4016 ms ≥ 4 s → STOP**；未运行 (a)/(b)/(c)，未跑 audit/mutants，无新的 A59 区间，无 G2/QA_HANDOFF 证据。
- 数值本身说明主机仍偏慢：本体 3738 ms 已接近 4 s 阈值；按 A102 §2 的机理，WP-03/WP-04 的 11–12 个文件并发时，
  同一查询会被放大并再次超过冻结守卫的 8 s 超时（上一轮 (c) 即如此）。

### 4. 请 Design 裁定

1. 阈值口径：seq 61 写的是 Measure-Command 的“耗时”，本次总耗时 **4016 ms**（≥4 s）而查询本体 **3738 ms**（<4 s）；
   请明确按哪个口径判定。
2. 若裁定按“查询本体 <4 s”继续，请给出**显式新派单**（我会在**新的** A59 区间原样重跑 (a)(b)(c)+audit+mutants）；
   但请注意并发放大风险：单次 3.7 s 时，12 个并发查询预计远超 8 s，P1-13 与 WP-03/WP-04 直跑很可能仍失败。
3. 若维持 STOP，请裁定换主机或改用并发受限的取证方法（后者需修订冻结测试/守卫，当前未授权）。

### 5. 边界

- 未改任何文件/冻结路径、未重测、未运行测试组、未联网跑测试、未 live、未接触真实凭证/邮箱、未合并、未派 QA。
- PR #9 保持 OPEN @ `6c59f35`（R4.1 已推送）；当前无任何已授权的 live 运行；P0-STORE 仍 BLOCKED。

**EXECUTION STOP（等待 Design 对 4016 ms / 3738 ms 阈值口径的裁定）**
