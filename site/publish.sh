#!/usr/bin/env bash
# Build, then serve in the foreground. A busy PORT fails without stopping its owner.
set -euo pipefail
cd "$(dirname "$0")"
bun install --frozen-lockfile
bun run build
exec bun run start
