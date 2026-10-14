#!/usr/bin/env bash
# Builds notes/lecture-1-notes.pdf and notes/lecture-2-notes.pdf with headless Chrome.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p notes
python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1
for n in 1 2; do
  echo "Printing lecture $n ..."
  google-chrome-stable --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --window-size=1100,1500 --virtual-time-budget=120000 --no-pdf-header-footer \
    --print-to-pdf="notes/lecture-$n-notes.pdf" "http://127.0.0.1:8765/lec$n.html?print=1"
done
ls -la notes
