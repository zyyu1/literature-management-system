# D007-A54 — WP-01 egress-boundary amendment: kernel network namespace on cloud Linux

**Design amendment, 2026-11-24 17:30 Europe/Berlin.** Observed parent `main@0676c891`. It implements the user's choice **DEC-3=A** (cloud Linux Execution; recorded in `bus/MANAGEMENT_TO_EXECUTION.md` seq 3). It answers the Execution STOP in `bus/EXECUTION_TO_QA.md` seq 3 and the Management STOP relayed to Design on 2026-11-24.

## 1. Problem (Design error acknowledged)
Board seq 3 claimed that a cloud session "exactly satisfies" WP-01 §2. That was true for the OS (Linux x86_64) and for Node (v22.23.5). It was **false for egress**: the session has a preconfigured HTTPS proxy and direct outbound TCP, so `1.1.1.1:443` connects.

[EXECUTION_INSTRUCTION §2](../handoffs/WP-01/EXECUTION_INSTRUCTION.md) requires a preexisting network-denied sandbox and forbids provisioning one, so Execution STOPped. That STOP was correct.

## 2. Amendment (narrows how §2 is satisfied; does not weaken it)
On the A47 R4 cloud Linux host, the §2 egress requirement is satisfied by running **every test, server and probe command** inside a fresh **user + network namespace**. In that namespace:
- only loopback is up;
- proxy variables are removed.

This is done with the Design-provided wrapper [`tools/offline/run-offline.sh`](../../tools/offline/run-offline.sh). It uses only preinstalled `unshare` (util-linux) and the Python standard library ([`lo-up.py`](../../tools/offline/lo-up.py)). Nothing is installed or downloaded, so it is **not** "provisioning" in the sense of §2.

This is a **kernel-level** outbound deny, stronger than an in-process guard. Design observed it on its own cloud session on 2026-11-24 using [`egress-probe.mjs`](../../tools/offline/egress-probe.mjs):

| Probe | Outside namespace | Inside `run-offline.sh` |
| --- | --- | --- |
| loopback 127.0.0.1 | CONNECTED | CONNECTED |
| 1.1.1.1:443 | **CONNECTED** | ENETUNREACH |
| 140.82.112.3:443 | **CONNECTED** | ENETUNREACH |
| 8.8.8.8:53 | ECONNREFUSED | ENETUNREACH |
| DNS github.com | ENOTFOUND | EAI_AGAIN |
| Verdict | FAIL | **EGRESS_PROBE=PASS** |

## 3. Required procedure — Execution and QA
1. **Run git commands outside the namespace.** Clone, fetch, push and `ls-remote` all need network, so they run in the normal shell.
2. **Get the tools from `main`.** The work branch starts at Base `9cfc1d7`, which does not contain `tools/`. Copy the wrapper files from `main` into a scratch directory outside the repository, for example:
   `mkdir -p /tmp/offline && for f in run-offline.sh lo-up.py egress-probe.mjs; do git show origin/main:tools/offline/$f > /tmp/offline/$f; done && chmod +x /tmp/offline/run-offline.sh`
   Record the blob SHAs. Do **not** add `tools/` to the WP-01 branch, because it is outside the whitelist.
3. **Run the probe first.** `/tmp/offline/run-offline.sh node /tmp/offline/egress-probe.mjs` must print `EGRESS_PROBE=PASS` and exit 0. Otherwise STOP.
4. **Run all test and server commands through the wrapper.** For example:
   `/tmp/offline/run-offline.sh node --test "packages/wp-01-synthetic-auth-api/test/*.test.mjs"`
   No WP-01 test or server may run outside it.
5. **Keep the in-process test.** `test/transport-negative.test.mjs` still asserts that the server and client refuse non-loopback targets, with zero bytes sent. The namespace is a host-level guarantee **in addition to** the in-process tests, not a replacement for them.
6. **Report the evidence.** Execution and QA include the probe output and the wrapper blob SHAs in their reports. QA runs its own probe and may also write its own extra negative probes.

## 4. Unchanged
- **A21 scope:** Base, branch, whitelist, fixture SHA-256 and the Q01–Q10 matrix are all unchanged.
- **Environment:** Node v22.23.5 exact, Linux x86_64, and no dependencies.
- **Work boundaries:** only synthetic data, no real services, and the frozen UI is untouched.
- **Gates:** G5, G6 and G7 remain NOT_AUTHORIZED. No G4.
- **Windows:** Windows Execution for WP-01 remains **not** permitted.
