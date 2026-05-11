#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MDGEN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$MDGEN_DIR/.." && pwd)"

IMAGE_NAME="${MDGEN_PIXEL_IMAGE:-mdgen-pixel:local}"
PLATFORM="${MDGEN_PIXEL_PLATFORM:-linux/amd64}"
SOURCE_DATE_EPOCH_VALUE="${MDGEN_SOURCE_DATE_EPOCH:-315532800}"

if [[ "${MDGEN_PIXEL_SKIP_BUILD:-0}" != "1" ]]; then
  "$SCRIPT_DIR/build-pixel-image.sh"
fi

mkdir -p "$MDGEN_DIR/output"

ENV_ARGS=(
  -e CI=true
  -e TZ=UTC
  -e LANG=C.UTF-8
  -e LC_ALL=C.UTF-8
  -e SOURCE_DATE_EPOCH="$SOURCE_DATE_EPOCH_VALUE"
)
if [[ -n "${PIXEL_THRESHOLD:-}" ]]; then
  ENV_ARGS+=(-e "PIXEL_THRESHOLD=$PIXEL_THRESHOLD")
fi

docker run --rm \
  --platform "$PLATFORM" \
  -v "$ROOT_DIR:/workspace" \
  "${ENV_ARGS[@]}" \
  "$IMAGE_NAME"
