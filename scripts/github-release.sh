#!/bin/sh
set -e

STEP="github-release"
GITHUB_REPO="memsolus/mcp"

echo "----------------------------------------------"
echo "[${STEP}] Iniciando criacao de release no GitHub"
echo "[${STEP}] Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "----------------------------------------------"

if [ -z "${CI_COMMIT_TAG:-}" ]; then
  echo "[${STEP}] ERROR: CI_COMMIT_TAG nao definido"
  exit 1
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[${STEP}] ERROR: GITHUB_TOKEN nao definido"
  exit 1
fi

TAG="${CI_COMMIT_TAG}"
VERSION="${TAG#v}"

echo "[${STEP}] Tag: ${TAG}"
echo "[${STEP}] Repo: ${GITHUB_REPO}"

echo "[${STEP}] Buscando tags..."
git fetch --tags --force

PREVIOUS_TAG=""
if [ -n "${CI_API_V4_URL:-}" ] && [ -n "${CI_PROJECT_ID:-}" ]; then
  PREVIOUS_TAG=$(curl -sSf \
    "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/releases?per_page=1" \
    --header "JOB-TOKEN: ${CI_JOB_TOKEN}" | \
    jq -r '.[0].tag_name // empty' 2>/dev/null || echo "")
fi

if [ -n "${PREVIOUS_TAG}" ]; then
  echo "[${STEP}] Release anterior: ${PREVIOUS_TAG}"
  CHANGELOG=$(git log --pretty=format:"- %s (%h)" "${PREVIOUS_TAG}..${TAG}" | head -50)
else
  echo "[${STEP}] Nenhum release anterior"
  CHANGELOG=$(git log --pretty=format:"- %s (%h)" | head -50)
fi

BODY="## @memsolus/mcp@${VERSION}

### Install
\`\`\`bash
npx -y @memsolus/mcp@${VERSION}
\`\`\`

### Changes
${CHANGELOG}

### Links
- [npm](https://www.npmjs.com/package/@memsolus/mcp/v/${VERSION})
- [Documentation](https://docs.memsolus.com/integrations/mcp)"

BODY_JSON=$(echo "${BODY}" | jq -Rs .)

echo "[${STEP}] Criando release..."
curl -sf -X POST \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${GITHUB_REPO}/releases" \
  -d "{
    \"tag_name\": \"${TAG}\",
    \"name\": \"v${VERSION}\",
    \"body\": ${BODY_JSON},
    \"draft\": false,
    \"prerelease\": false
  }"

echo ""
echo "----------------------------------------------"
echo "[${STEP}] GitHub Release ${TAG} criado"
echo "----------------------------------------------"
