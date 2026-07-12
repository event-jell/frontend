#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# build-and-push.sh
# Builds the eventjelly frontend Docker image and pushes it to
# GitHub Container Registry (ghcr.io).
#
# Usage:
#   ./build-and-push.sh [TAG]
#
# Examples:
#   ./build-and-push.sh          # uses "latest"
#   ./build-and-push.sh v1.2.3   # uses "v1.2.3"
#
# Requirements:
#   - Docker installed and running
#   - GITHUB_TOKEN env var set with write:packages scope
#     export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
# ─────────────────────────────────────────────────────────────
set -euo pipefail

IMAGE="ghcr.io/opeyemifamosipe/eventjelly-frontend"
TAG="${1:-latest}"
FULL_IMAGE="${IMAGE}:${TAG}"

# ── Validate GITHUB_TOKEN ───────────────────────────────────
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "❌  GITHUB_TOKEN is not set."
  echo "    Export a GitHub PAT with 'write:packages' scope:"
  echo "    export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔐  Logging in to ghcr.io …"
echo "${GITHUB_TOKEN}" | docker login ghcr.io -u opeyemifamosipe --password-stdin

echo ""
echo "🏗️   Building image: ${FULL_IMAGE}"
echo "     Context: ${SCRIPT_DIR}"
docker build \
  --platform linux/amd64 \
  --build-arg VITE_API_URL="${VITE_API_URL:-}" \
  --build-arg VITE_SOCKET_URL="${VITE_SOCKET_URL:-}" \
  --tag "${FULL_IMAGE}" \
  --tag "${IMAGE}:latest" \
  "${SCRIPT_DIR}"

echo ""
echo "📤  Pushing ${FULL_IMAGE} …"
docker push "${FULL_IMAGE}"

# Also push :latest if a specific tag was given
if [[ "${TAG}" != "latest" ]]; then
  echo "📤  Pushing ${IMAGE}:latest …"
  docker push "${IMAGE}:latest"
fi

echo ""
echo "✅  Done! Image available at:"
echo "    ${FULL_IMAGE}"
echo ""
echo "▶️   Run the container:"
echo "    docker run -d \\"
echo "      -p 3000:3000 \\"
echo "      ${FULL_IMAGE}"
