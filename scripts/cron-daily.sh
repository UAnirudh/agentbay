#!/bin/sh
curl -sf -X GET \
  "${APP_URL}/api/cron/daily" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  || echo "Daily cron failed"
