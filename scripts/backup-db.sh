#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /home/ovie/gsws/data/gsws.db /home/ovie/gsws/backups/gsws_$DATE.db
# Keep only last 7 backups
ls -t /home/ovie/gsws/backups/gsws_*.db | tail -n +8 | xargs rm -f 2>/dev/null
echo "Backup done: gsws_$DATE.db"
