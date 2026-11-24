#!/bin/sh
# D007-A54: run a command in a new user + network namespace with only loopback up.
# Kernel-level outbound deny; nothing is installed. Usage: tools/offline/run-offline.sh <cmd> [args...]
HERE=$(cd "$(dirname "$0")" && pwd)
exec env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy -u ALL_PROXY -u all_proxy -u NO_PROXY -u no_proxy \
  unshare -rn sh -c 'python3 -I "$0" && exec "$@"' "$HERE/lo-up.py" "$@"
