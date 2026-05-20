#!/bin/sh
curl -sf -X GET \
  "${APP_URL}/api/cron/weekly" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  || echo "Weekly cron failed"
