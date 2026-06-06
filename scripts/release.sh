#!/bin/sh
set -e

STEP="release"
START_TIME=$(date +%s)

echo "----------------------------------------------"
echo "[${STEP}] Iniciando geracao de release"
echo "[${STEP}] Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "----------------------------------------------"

if [ -z "${CI_COMMIT_TAG:-}" ]; then
  echo "[${STEP}] ERROR: CI_COMMIT_TAG nao definido"
  exit 1
fi

TAG="${CI_COMMIT_TAG}"
VERSION="${TAG#v}"

echo "[${STEP}] Tag: ${TAG}"

echo "[${STEP}] Buscando tags do repositorio..."
git fetch --tags --force
echo "[${STEP}] Tags buscadas"

echo "[${STEP}] Buscando release anterior via API do GitLab..."
PREVIOUS_TAG=""
if [ -n "${CI_API_V4_URL:-}" ] && [ -n "${CI_PROJECT_ID:-}" ]; then
  PREVIOUS_TAG=$(curl -sSf \
    "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/releases?per_page=1" \
    --header "JOB-TOKEN: ${CI_JOB_TOKEN}" | \
    jq -r '.[0].tag_name // empty' 2>/dev/null || echo "")
fi

CHANGELOG_FILE="/tmp/changelog.md"

if [ -n "${PREVIOUS_TAG}" ]; then
  echo "[${STEP}] Release anterior: ${PREVIOUS_TAG}"
  echo "[${STEP}] Gerando changelog: ${PREVIOUS_TAG}..${TAG}"
  git log --pretty=format:"- %s (%h)" "${PREVIOUS_TAG}..${TAG}" > "${CHANGELOG_FILE}"
else
  echo "[${STEP}] Nenhum release anterior encontrado, gerando changelog completo"
  git log --pretty=format:"- %s (%h)" > "${CHANGELOG_FILE}"
fi

if [ ! -s "${CHANGELOG_FILE}" ]; then
  echo "[${STEP}] Changelog vazio, usando descricao padrao"
  echo "Release ${TAG}" > "${CHANGELOG_FILE}"
fi

echo "[${STEP}] Changelog gerado:"
echo "----------------------------------------------"
cat "${CHANGELOG_FILE}"
echo ""
echo "----------------------------------------------"

DESCRIPTION="## @memsolus/mcp@${VERSION}

### Install
\`\`\`bash
npx -y @memsolus/mcp@${VERSION}
\`\`\`

### Changes
$(cat ${CHANGELOG_FILE})

### Links
- [npm](https://www.npmjs.com/package/@memsolus/mcp/v/${VERSION})
- [GitHub](https://github.com/memsolus/mcp/releases/tag/${TAG})
- [Documentation](https://docs.memsolus.com/integrations/mcp)"

echo "${DESCRIPTION}" > /tmp/release-description.md

echo "[${STEP}] Criando release no GitLab..."
release-cli create \
  --name "${TAG}" \
  --tag-name "${TAG}" \
  --description "$(cat /tmp/release-description.md)"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "----------------------------------------------"
echo "[${STEP}] Release criado com sucesso"
echo "[${STEP}] Tag: ${TAG}"
echo "[${STEP}] Duracao: ${DURATION}s"
echo "----------------------------------------------"
