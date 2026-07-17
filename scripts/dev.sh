#!/usr/bin/env bash
# Boots the Next.js dev server on Node 22 regardless of the machine default
# (which is v18.16 and too old for Next 15). Used by .claude/launch.json.
set -e
# shellcheck disable=SC1090
source "$HOME/.nvm/nvm.sh"
nvm use v22.13.0 >/dev/null
# Bind a stable port (default 3100) so email-confirmation links resolve.
exec npm run dev -- -p "${PORT:-3100}"
