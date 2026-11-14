#!/usr/bin/env bash
# Writes one commit status onto a Practice-App commit, so the result of this
# run shows next to the commit that caused the deploy.
#
#   set-app-status.sh <state> <description>
#
# state is pending, success, failure or error. The description is what GitHub
# shows next to the check, and it is cut to the 140 characters GitHub allows.
#
# It reads APP_STATUS_TOKEN, APP_SHA, STATUS_CONTEXT and RUN_URL from the
# environment. The token is never printed.
set -euo pipefail

state="${1:?a state is needed: pending, success, failure or error}"
description="${2:-}"

: "${APP_SHA:?no app sha, so there is no commit to put a status on}"
: "${APP_STATUS_TOKEN:?APP_STATUS_TOKEN is not set}"

context="${STATUS_CONTEXT:-Playwright tests}"
target_url="${RUN_URL:-}"
description="$(printf '%.140s' "${description}")"

body="$(
  STATE="${state}" DESCRIPTION="${description}" CONTEXT="${context}" TARGET_URL="${target_url}" \
  node -e 'process.stdout.write(JSON.stringify({
    state: process.env.STATE,
    description: process.env.DESCRIPTION,
    context: process.env.CONTEXT,
    target_url: process.env.TARGET_URL,
  }))'
)"

code="$(curl --silent --show-error \
  --output "${RUNNER_TEMP:-/tmp}/status-response.json" \
  --write-out '%{http_code}' \
  --request POST \
  --url "https://api.github.com/repos/Yusuf-Hridoy/Practice-App/statuses/${APP_SHA}" \
  --header "Authorization: Bearer ${APP_STATUS_TOKEN}" \
  --header 'Accept: application/vnd.github+json' \
  --header 'X-GitHub-Api-Version: 2022-11-28' \
  --data "${body}")"

echo "Set \"${context}\" to ${state} on Practice-App ${APP_SHA}: HTTP ${code}."

if [ "${code}" != "201" ]; then
  cat "${RUNNER_TEMP:-/tmp}/status-response.json"
  echo "::error::Expected HTTP 201 from the statuses API, got ${code}."
  exit 1
fi
