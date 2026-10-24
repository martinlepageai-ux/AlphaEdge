#!/usr/bin/env bash
# Explicit Vercel preview deployment. Never alters project access or SSO settings.
set -euo pipefail
cd "$(dirname "$0")"
umask 002

if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != "--dry-run" ]; }; then
  echo "usage: bash go-live.sh [--dry-run]" >&2
  exit 2
fi
: "${VERCEL_PROJECT_ID:?set an explicit existing VERCEL_PROJECT_ID (prj_...)}"
: "${VERCEL_ORG_ID:?set an explicit VERCEL_ORG_ID (team_...)}"
if ! [[ "$VERCEL_PROJECT_ID" =~ ^prj_[A-Za-z0-9]+$ ]] || ! [[ "$VERCEL_ORG_ID" =~ ^team_[A-Za-z0-9]+$ ]]; then
  echo "Expected an explicit prj_ project ID and team_ team ID." >&2
  exit 2
fi
export VERCEL_PROJECT_ID VERCEL_ORG_ID

if [ "${1:-}" = "--dry-run" ]; then
  printf 'Would build and deploy a preview to project %s in team %s. Access protection stays unchanged.\n' "$VERCEL_PROJECT_ID" "$VERCEL_ORG_ID"
  exit 0
fi
: "${VERCEL_TOKEN:?set VERCEL_TOKEN for the explicitly selected team}"
command -v vercel >/dev/null || { echo "Install a reviewed Vercel CLI version before deploying." >&2; exit 1; }

bash ./build-vercel.sh
# Both IDs select the existing project; --scope pins the team. No --prod, account
# discovery, implicit project creation by directory name, or access-setting API.
vercel deploy --prebuilt --yes --scope "$VERCEL_ORG_ID" --token "$VERCEL_TOKEN"
