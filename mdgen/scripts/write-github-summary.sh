#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MDGEN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_MD="$MDGEN_DIR/output/pixel-report.md"

TARGET="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

{
  echo "## mdgen pixel output"
  echo
  echo "Download the generated files from the **Artifacts** section of this workflow run."
  echo
  echo "| Artifact | Contains |"
  echo "| --- | --- |"
  echo "| mdgen-pdfs | Generated PDF files |"
  echo "| mdgen-html | Generated HTML files |"
  echo "| mdgen-pixel-report | Pixel score report as Markdown and JSON |"
  echo "| mdgen-pixel-assets | Rasterized pages, crop images, diff images, bbox debug HTML |"
  echo "| mdgen-output-all | Complete mdgen/output directory |"
  echo

  if [[ -f "$REPORT_MD" ]]; then
    cat "$REPORT_MD"
  else
    echo "Pixel report was not generated. Check the failed test step logs."
  fi
} >> "$TARGET"
