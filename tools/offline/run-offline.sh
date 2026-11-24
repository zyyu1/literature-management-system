#!/bin/sh
# D007-A54/A55: run a command in a new user + network namespace with only loopback up.
# Kernel-level outbound deny; nothing is installed. Environment is reset to a small
# allowlist (A55, QA INFO-1). Usage: tools/offline/run-offline.sh <cmd> [args...]
HERE=$(cd "$(dirname "$0")" && pwd)
exec env -i PATH="${PATH:-/usr/local/bin:/usr/bin:/bin}" HOME="${HOME:-/tmp}" LANG="${LANG:-C.UTF-8}" \
  TZ="${TZ:-UTC}" TMPDIR="${TMPDIR:-/tmp}" \
  unshare -rn sh -c 'python3 -I "$0" && exec "$@"' "$HERE/lo-up.py" "$@"
