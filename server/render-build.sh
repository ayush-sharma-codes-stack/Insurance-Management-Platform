#!/bin/bash
# =============================================================
# Render Production Build Script
# Switches SQLite schema to PostgreSQL for production deployment
# =============================================================

set -e  # Exit on any error

echo "==> [render-build] Switching Prisma provider: sqlite -> postgresql..."

# Replace provider in schema.prisma
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Replace provider in migration_lock.toml
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/migrations/migration_lock.toml

echo "==> [render-build] Installing dependencies..."
npm install

echo "==> [render-build] Running prisma generate + migrate deploy..."
npm run build

echo "==> [render-build] Build complete!"
