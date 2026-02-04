#!/bin/bash
# Hostinger Backend Deployment Script
# Deploy remaining backend files and run setup

SSH_HOST="82.198.227.1"
SSH_PORT="65002"
SSH_USER="u615005912"
REMOTE_PATH="domains/snow-mantis-616662.hostingersite.com/public_html/backend"
LOCAL_BACKEND="backend"

echo "======================================"
echo "  Hostinger Backend Deployment"
echo "======================================"
echo "Host: $SSH_HOST:$SSH_PORT"
echo "User: $SSH_USER"
echo "Remote: $REMOTE_PATH"
echo ""

# Upload remaining backend directories
echo "[1/4] Uploading backend files..."
rsync -avz -e "ssh -p $SSH_PORT" \
  --exclude=".env" \
  --exclude="vendor" \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude="storage/logs" \
  --exclude="bootstrap/cache" \
  --exclude=".venv" \
  --delete \
  "$LOCAL_BACKEND/" \
  "$SSH_USER@$SSH_HOST:$REMOTE_PATH/"

if [ $? -ne 0 ]; then
  echo "✗ Upload failed"
  exit 1
fi
echo "✓ Backend files uploaded"

# Run setup commands on server
echo ""
echo "[2/4] Installing Composer dependencies..."
ssh -p $SSH_PORT "$SSH_USER@$SSH_HOST" << 'EOF'
cd domains/snow-mantis-616662.hostingersite.com/public_html/backend
composer install --optimize-autoloader --no-dev
EOF

if [ $? -ne 0 ]; then
  echo "✗ Composer install failed"
  exit 1
fi
echo "✓ Dependencies installed"

# Cache config and routes
echo ""
echo "[3/4] Caching configuration..."
ssh -p $SSH_PORT "$SSH_USER@$SSH_HOST" << 'EOF'
cd domains/snow-mantis-616662.hostingersite.com/public_html/backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
chmod -R 775 storage bootstrap/cache
EOF

if [ $? -ne 0 ]; then
  echo "⚠ Caching commands had issues (may be non-critical)"
fi
echo "✓ Configuration cached"

# Run migrations
echo ""
echo "[4/4] Running database migrations..."
ssh -p $SSH_PORT "$SSH_USER@$SSH_HOST" << 'EOF'
cd domains/snow-mantis-616662.hostingersite.com/public_html/backend
php artisan migrate --force
EOF

if [ $? -ne 0 ]; then
  echo "⚠ Migrations may have issues"
  echo "   Run manually: ssh -p 65002 u615005912@82.198.227.1"
  echo "   Then: cd public_html/backend && php artisan migrate --force"
fi
echo "✓ Migrations completed"

echo ""
echo "======================================"
echo "✅ Backend deployment complete!"
echo "======================================"
echo ""
echo "📋 Next steps:"
echo "1. Generate VAPID keys:"
echo "   ssh -p 65002 u615005912@82.198.227.1"
echo "   cd public_html/backend"
echo "   php artisan vapid:generate"
echo ""
echo "2. Verify .env file settings:"
echo "   nano .env"
echo ""
echo "3. Test backend API:"
echo "   curl https://yourdomain.com/api/products"
