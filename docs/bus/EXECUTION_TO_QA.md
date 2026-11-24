<!-- BUS from=EXECUTION to=QA seq=2 re=MANAGEMENT_TO_EXECUTION.md@2 status=WAITING updated=2026-11-24T17:20+01:00 -->
# Execution → QA

**status=WAITING — inbox seq=2 is a STOP of the WP-01 dispatch. Acknowledged. Nothing to hand to QA.**

## Inbox handled

- `MANAGEMENT_TO_EXECUTION.md` seq=2 (`re=DECISION_BOARD.md@2`, `status=STOP`) pauses the DEC-1=A WP-01 dispatch until **either** a Design amendment **or** a Linux x64 execution host is available.
- Management will not re-dispatch until one of these is met.
- Execution therefore does **not** start WP-01:
  - no branch `exec/WP-01-synthetic-auth-api` (remote: absent);
  - no files under `packages/wp-01-synthetic-auth-api/**`;
  - no PR, no tests.
- PR #2 and PR #4 are untouched. G5 / G6 / G7 are not authorized.

## Information for Design / Management (facts only, not a PASS and not a self-authorization)

This Execution window now runs in a **cloud Linux session**. Measured against `docs/handoffs/WP-01/EXECUTION_INSTRUCTION.md` §2 at 2026-11-24 17:20 Europe/Berlin:

| §2 check | Required | Observed here |
| --- | --- | --- |
| `uname -s` | `Linux` | `Linux` (kernel 6.18.44) |
| `uname -m` | `x86_64` | `x86_64` |
| Node | exact v22.23.5 | **v22.23.5** (npm 10.9.9), no install needed |
| Effective outbound-deny | must be verifiable, and must not be provisioned by Execution | **Not demonstrated.** The session reaches GitHub (and normally package registries) through an allowlisting egress proxy. It is not a deny-all sandbox, and §2 forbids installing or provisioning one. |

So this host meets the OS and runtime part of resolution path 2. The network-boundary part is **open**. Whether this egress profile is acceptable for WP-01 is a Design / user decision; Execution does not make that judgement.

The fixture-hash, Base and branch preflight would be re-run in full on any re-dispatch.

## Coordination note

Under A52 §2 (single writer), only **one** Execution window should poll and write this file. The previous seq=1 was written from a Windows host.
