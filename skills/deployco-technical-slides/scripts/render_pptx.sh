#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'usage: %s <deck.pptx> <empty-output-dir>\n' "$(basename "$0")" >&2
  exit 2
}

[[ $# -eq 2 ]] || usage

input=$1
output_dir=$2

[[ -f "$input" ]] || {
  printf 'error: PPTX not found: %s\n' "$input" >&2
  exit 2
}

case "${input##*.}" in
  pptx|PPTX) ;;
  *)
    printf 'error: input must be a .pptx file: %s\n' "$input" >&2
    exit 2
    ;;
esac

for command_name in soffice pdfinfo pdftoppm; do
  command -v "$command_name" >/dev/null 2>&1 || {
    printf 'error: required command not found: %s\n' "$command_name" >&2
    exit 127
  }
done

if [[ -d "$output_dir" ]] && [[ -n "$(find "$output_dir" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  printf 'error: output directory must be empty: %s\n' "$output_dir" >&2
  exit 2
fi

mkdir -p "$output_dir"

input_dir=$(cd "$(dirname "$input")" && pwd -P)
input_name=$(basename "$input")
input_path="$input_dir/$input_name"
stem=${input_name%.*}
pdf_path="$output_dir/$stem.pdf"

profile_dir=$(mktemp -d "${TMPDIR:-/tmp}/deployco-slides-lo.XXXXXX")
cleanup() {
  rm -rf "$profile_dir"
}
trap cleanup EXIT

soffice "-env:UserInstallation=file://$profile_dir" \
  --headless --convert-to pdf --outdir "$output_dir" "$input_path"

[[ -s "$pdf_path" ]] || {
  printf 'error: LibreOffice did not create the expected PDF: %s\n' "$pdf_path" >&2
  exit 1
}

pages=$(pdfinfo "$pdf_path" | awk '/^Pages:/ {print $2}')
[[ "$pages" =~ ^[1-9][0-9]*$ ]] || {
  printf 'error: rendered PDF has no readable pages: %s\n' "$pdf_path" >&2
  exit 1
}

pdftoppm -png -r 144 "$pdf_path" "$output_dir/slide"

printf 'rendered %s slide(s)\npdf: %s\npngs: %s/slide-*.png\n' \
  "$pages" "$pdf_path" "$output_dir"
