#!/bin/sh
set -e

STEP="publish"

echo "----------------------------------------------"
echo "[${STEP}] Iniciando publicacao no npm"
echo "[${STEP}] Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "----------------------------------------------"

if [ -z "${CI_COMMIT_TAG:-}" ]; then
  echo "[${STEP}] ERROR: CI_COMMIT_TAG nao definido"
  exit 1
fi

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "[${STEP}] ERROR: NPM_TOKEN nao definido"
  exit 1
fi

VERSION=${CI_COMMIT_TAG#v}

echo "[${STEP}] Versao: ${VERSION}"
echo "[${STEP}] Pacote: @memsolus/mcp"

echo "[${STEP}] Configurando .npmrc..."
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
echo "registry=https://registry.npmjs.org/" >> ~/.npmrc

echo "=== npm config ==="
npm config list

echo "[${STEP}] Atualizando versao no package.json..."
sed -i "s/\"version\":.*/\"version\": \"${VERSION}\",/" package.json

echo "=== package.json version ==="
grep '"version"' package.json

echo "=== Publishing ==="
npm publish --access public

echo "----------------------------------------------"
echo "[${STEP}] Publicado @memsolus/mcp@${VERSION}"
echo "----------------------------------------------"
