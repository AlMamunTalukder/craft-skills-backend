#!/usr/bin/env bash

set -euo pipefail

# Move to the directory where this script is located
cd "$(dirname "$0")"

# Load environment variables from .env
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

set -a
source .env
set +a

# Verify DATABASE_URL exists
if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL is not defined in .env"
    exit 1
fi

BACKUP_DIR="./mongo-backup/$(date +%Y%m%d_%H%M%S)"

echo "======================================="
echo "MongoDB Backup Started"
echo "Backup Directory: $BACKUP_DIR"
echo "======================================="

mongodump \
    --uri="$DATABASE_URL" \
    --db="craft-skills" \
    --gzip \
    --out="$BACKUP_DIR"

echo ""
echo "✅ Backup completed successfully!"
echo "📁 Backup saved to:"
echo "   $BACKUP_DIR"
