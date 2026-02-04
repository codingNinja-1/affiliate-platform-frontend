#!/bin/bash
# Simple SSH deployment to Hostinger

SSH_HOST="82.198.227.1"
SSH_PORT="65002"
SSH_USER="u615005912"
BACKEND_REMOTE="domains/snow-mantis-616662.hostingersite.com/public_html/backend"

echo "🚀 Deploying to Hostinger via SSH"
echo "Host: $SSH_HOST:$SSH_PORT"
echo "User: $SSH_USER"

# Step 1: Upload backend files
echo ""
echo "📦 Uploading backend files..."
scp -P $SSH_PORT -r backend/* $SSH_USER@$SSH_HOST:$BACKEND_REMOTE/ \
  -o ConnectTimeout=10 \
  -o "User=$SSH_USER"

if [ $? -ne 0 ]; then
  echo "❌ Upload failed"
  exit 1
fi

echo "✅ Backend uploaded"

# Step 2: Run setup commands on server
echo ""
echo "🔧 Setting up backend on server..."

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
cd domains/snow-mantis-616662.hostingersite.com/public_html/backend

echo "Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev

echo "Caching config..."
php artisan config:cache

echo "Caching routes..."
php artisan route:cache

echo "Caching views..."
php artisan view:cache

echo "Setting permissions..."
chmod -R 755 storage bootstrap/cache

echo "✅ Backend ready!"
EOF

if [ $? -ne 0 ]; then
  echo "⚠️  Some setup commands failed"
else
  echo "✅ Backend setup complete"
fi

echo ""
echo "═══════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════"
echo ""
echo "📋 Next steps:"
echo "1. SSH in: ssh -p 65002 u615005912@82.198.227.1"
echo "2. Run migrations:"
echo "   cd domains/snow-mantis-616662.hostingersite.com/public_html/backend"
echo "   php artisan migrate --force"
echo "3. Generate VAPID keys:"
echo "   php artisan vapid:generate"
