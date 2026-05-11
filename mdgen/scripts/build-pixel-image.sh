#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MDGEN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$MDGEN_DIR/.." && pwd)"

IMAGE_NAME="${MDGEN_PIXEL_IMAGE:-mdgen-pixel:local}"
PLATFORM="${MDGEN_PIXEL_PLATFORM:-linux/amd64}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to build the mdgen pixel-test image." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed, but the Docker daemon is not reachable. Start Docker and rerun this command." >&2
  exit 1
fi

if [[ "${MDGEN_PIXEL_USE_CACHE:-0}" == "1" ]]; then
  docker build \
    --platform "$PLATFORM" \
    -f "$MDGEN_DIR/Dockerfile.pixel" \
    -t "$IMAGE_NAME" \
    "$ROOT_DIR"
else
  docker build \
    --pull \
    --no-cache \
    --platform "$PLATFORM" \
    -f "$MDGEN_DIR/Dockerfile.pixel" \
    -t "$IMAGE_NAME" \
    "$ROOT_DIR"
fi

echo "Built $IMAGE_NAME for $PLATFORM"
