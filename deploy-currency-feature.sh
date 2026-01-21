#!/bin/bash

# Affiliate Platform Currency Conversion Deployment Script
# This script deploys the currency conversion feature to production

set -e

echo "=== Deploying Currency Conversion Feature ==="

# Navigate to backend
cd ~/public_html/backend || { echo "Backend directory not found"; exit 1; }

echo "1. Pulling latest changes from git..."
git pull origin main

echo "2. Installing composer dependencies..."
composer install --no-dev --optimize-autoloader

echo "3. Running database migrations..."
php artisan migrate --force

echo "4. Seeding currency rates..."
php artisan db:seed --class=CurrencyRateSeeder

echo "5. Clearing caches..."
php artisan cache:clear
php artisan config:cache
php artisan route:cache

echo "6. Setting proper permissions..."
chmod -R 755 storage bootstrap/cache
chown -R nobody:nobody storage bootstrap/cache

# Navigate to frontend
cd ~/public_html/frontend || { echo "Frontend directory not found"; exit 1; }

echo "7. Installing npm dependencies..."
npm install

echo "8. Building Next.js application..."
npm run build

echo "9. Restarting services..."
# Restart PHP if using PHP-FPM
pkill -f "php-fpm" || true
sleep 2

echo "=== Deployment Complete ==="
echo "Currency Conversion Feature has been successfully deployed!"
echo ""
echo "Admin Panel: https://yourdomain.com/admin/currency-rates"
echo "Affiliate Dashboard: https://yourdomain.com/dashboard"
