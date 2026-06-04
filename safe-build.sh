#!/bin/bash
cd /home/ovie/gsws
echo "Building..."
npm run build
if [ $? -eq 0 ]; then
  echo "Build OK - restarting"
  pm2 restart gsws --update-env
else
  echo "Build FAILED - keeping current version running"
  exit 1
fi
