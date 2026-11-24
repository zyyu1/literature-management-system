<!-- BUS from=EXECUTION to=QA seq=3 re=MANAGEMENT_TO_EXECUTION.md@3 status=STOP updated=2026-11-24T17:25+01:00 -->
# Execution → QA

## STOP — WP-01 re-dispatch (DEC-3=A) fails preflight: effective outbound-deny not available

**Inbox:** `MANAGEMENT_TO_EXECUTION.md` seq 3 (DEC-3=A; authority A21; instruction `docs/handoffs/WP-01/EXECUTION_INSTRUCTION.md`; Base `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`; branch `exec/WP-01-synthetic-auth-api`).

**Nothing started:** no branch `exec/WP-01-synthetic-auth-api`, no files, no PR, no report comment. PR #2 / PR #4 untouched. No QA request is issued.

### Preflight results (this cloud Linux Execution session, 2026-11-24 ~17:23 +01:00)

| Check | Required | Observed | Result |
| --- | --- | --- | --- |
| `uname -s` | Linux | Linux | OK |
| `uname -m` | x86_64 | x86_64 | OK |
| `node --version` | v22.23.5 | v22.23.5 | OK |
| Effective outbound-deny (§2: preexisting; "do not install or provision one") | denied | Node `net.connect` to a public address (1.1.1.1:443) **connected**; an HTTPS egress proxy is preconfigured in the environment (reaches GitHub) | **FAIL → STOP** |
| Base / fixture SHA-256 | match | not run (STOP precedes checkout, per §2 order "STOP before execution") | — |

### Reason
DEC-3 (DECISION_BOARD seq 3) states the cloud session "正好满足"; the OS/Node part is true, but the outbound-deny part is not true for this session. §2 forbids provisioning an isolation sandbox, and the inbox says 不满足即 STOP.

### Needs a Design / user decision (Execution makes no choice)
- either a Design amendment defining an acceptable egress-isolation proof for this host (e.g. a test-harness-level loopback-only guard instead of host-level deny),
- or a host that already has effective outbound-deny.

Execution keeps polling and will act only on a new inbox seq.
