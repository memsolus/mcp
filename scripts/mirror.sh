#!/bin/sh
set -e

STEP="mirror"
GITHUB_REPO="memsolus/mcp"

echo "----------------------------------------------"
echo "[${STEP}] Iniciando mirror para GitHub"
echo "[${STEP}] Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "----------------------------------------------"

if [ -z "${CI_COMMIT_TAG:-}" ]; then
  echo "[${STEP}] ERROR: CI_COMMIT_TAG nao definido"
  exit 1
fi

if [ -z "${GITHUB_SSH_KEY:-}" ]; then
  echo "[${STEP}] ERROR: GITHUB_SSH_KEY nao definido"
  exit 1
fi

TAG="${CI_COMMIT_TAG}"

echo "[${STEP}] Configurando SSH..."
mkdir -p ~/.ssh
cp "${GITHUB_SSH_KEY}" ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

echo "[${STEP}] Configurando git..."
git config user.email "ci@memsolus.com"
git config user.name "Memsolus CI"

echo "[${STEP}] Removendo arquivos que nao devem ir para o GitHub..."
git rm --cached .gitlab-ci.yml 2>/dev/null || true
git rm --cached bunfig.toml 2>/dev/null || true
git commit -m "chore: prepare for GitHub mirror" --allow-empty

echo "[${STEP}] Adicionando remote GitHub..."
git remote add github "git@github.com:${GITHUB_REPO}.git" || \
  git remote set-url github "git@github.com:${GITHUB_REPO}.git"

echo "[${STEP}] Pushing main..."
git push github HEAD:main --force

echo "[${STEP}] Pushing tag ${TAG}..."
git tag -f "${TAG}"
git push github "${TAG}" --force

echo "----------------------------------------------"
echo "[${STEP}] Mirror concluido: github.com/${GITHUB_REPO}"
echo "[${STEP}] Tag: ${TAG}"
echo "----------------------------------------------"
