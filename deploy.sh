#!/bin/bash
set -e
cd ~/gsws

echo "=== Building into .next-build (live .next stays untouched) ==="
rm -rf .next-build
NEXT_DIST_DIR=.next-build npm run build

if [ ! -f ".next-build/prerender-manifest.json" ]; then
  echo "ERROR: build did not produce prerender-manifest.json — aborting, live site untouched"
  exit 1
fi

echo "=== Build OK. Swapping .next -> .next-old, .next-build -> .next ==="
rm -rf .next-old
mv .next .next-old 2>/dev/null || true
mv .next-build .next

echo "=== Reloading PM2 (rolling restart) ==="
pm2 reload gsws --update-env

echo "=== Verifying health ==="
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://sws.geig.co.uk/api/health)
if [ "$HTTP_CODE" != "200" ]; then
  echo "WARNING: health check returned $HTTP_CODE after deploy. Check pm2 logs!"
  exit 1
fi

echo "=== Deploy successful, health check OK ==="
rm -rf .next-old
