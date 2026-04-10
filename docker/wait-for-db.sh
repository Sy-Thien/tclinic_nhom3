#!/bin/sh
# ============================================================
# Script chờ MySQL sẵn sàng trước khi chạy backend
# ============================================================
# Dùng trong trường hợp healthcheck không đủ

set -e

host="$1"
shift
cmd="$@"

until mysqladmin ping -h "$host" --silent; do
  echo "⏳ Đang chờ MySQL ($host) khởi động..."
  sleep 2
done

echo "✅ MySQL đã sẵn sàng! Khởi động ứng dụng..."
exec $cmd
