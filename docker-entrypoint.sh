#!/bin/sh
set -e

node /app/server/src/index.js &
exec nginx -g 'daemon off;'
