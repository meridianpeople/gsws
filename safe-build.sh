#!/bin/bash
set -e
cd /home/ovie/gsws

echo "Backing up .next..."
if [ -d .next ]; then
  cp -r .next .next.bak 2>/dev/null || true
fi

echo "Building..."
if npm run build; then
  rm -rf .next.bak
  echo "Build successful"
  pm2 restart gsws
  pm2 restart sws-terminal
  pm2 save
else
  echo "Build failed — restoring backup"
  if [ -d .next.bak ]; then
    rm -rf .next
    mv .next.bak .next
    pm2 restart gsws
    echo "Restored previous build"
  fi
  exit 1
fi
