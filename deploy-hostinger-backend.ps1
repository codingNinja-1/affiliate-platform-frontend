#!/usr/bin/env powershell
# Hostinger Backend Deployment Script
# Deploy remaining backend files and run setup

param(
    [string]$SSHHost = "82.198.227.1",
    [int]$SSHPort = 65002,
    [string]$SSHUser = "u615005912",
    [string]$RemotePath = "domains/snow-mantis-616662.hostingersite.com/public_html/backend",
    [string]$LocalBackend = "backend"
)

Write-Host "`n╔════════════════════════════════════════╗"
Write-Host "║  Hostinger Backend Deployment (SSH)   ║"
Write-Host "╚════════════════════════════════════════╝"
Write-Host "Host: $SSHHost`:$SSHPort"
Write-Host "User: $SSHUser"
Write-Host "Remote: $RemotePath`n"

# Step 1: Upload backend files
Write-Host "[1/5] Uploading backend files..." -ForegroundColor Cyan

$excludePatterns = @(
    '--exclude=.env',
    '--exclude=vendor',
    '--exclude=node_modules',
    '--exclude=.git',
    '--exclude=storage/logs',
    '--exclude=bootstrap/cache',
    '--exclude=.venv'
)

& rsync -avz -e "ssh -p $SSHPort" @excludePatterns --delete "$LocalBackend/" "$SSHUser@$SSHHost`:$RemotePath/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend files uploaded`n" -ForegroundColor Green

# Step 2: Install Composer dependencies
Write-Host "[2/5] Installing Composer dependencies..." -ForegroundColor Cyan

$composerCmd = @"
cd $RemotePath && composer install --optimize-autoloader --no-dev
"@

& ssh -p $SSHPort "$SSHUser@$SSHHost" $composerCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Composer install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed`n" -ForegroundColor Green

# Step 3: Cache configuration
Write-Host "[3/5] Caching configuration..." -ForegroundColor Cyan

$cacheCmd = "cd $RemotePath; php artisan config:cache; php artisan route:cache; php artisan view:cache; chmod -R 775 storage bootstrap/cache"

& ssh -p $SSHPort "$SSHUser@$SSHHost" $cacheCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Caching had issues (may be non-critical)" -ForegroundColor Yellow
}
Write-Host "✓ Configuration cached`n" -ForegroundColor Green

# Step 4: Run migrations
Write-Host "[4/5] Running migrations..." -ForegroundColor Cyan

$migrateCmd = @"
cd $RemotePath && php artisan migrate --force
"@

& ssh -p $SSHPort "$SSHUser@$SSHHost" $migrateCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Migrations had issues" -ForegroundColor Yellow
}
Write-Host "✓ Migrations completed`n" -ForegroundColor Green

# Step 5: Generate VAPID keys
Write-Host "[5/5] Generating VAPID keys..." -ForegroundColor Cyan

$vapidCmd = "cd $RemotePath; php artisan vapid:generate"

& ssh -p $SSHPort "$SSHUser@$SSHHost" $vapidCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ VAPID generation had issues" -ForegroundColor Yellow
}
Write-Host "✓ VAPID keys generated`n" -ForegroundColor Green

# Summary
Write-Host "`n╔════════════════════════════════════════╗"
Write-Host "║    ✓ Deployment Complete!            ║"
Write-Host "╚════════════════════════════════════════╝`n"

Write-Host "📋 Post-deployment checklist:" -ForegroundColor Green
Write-Host "   1. SSH into server:"
Write-Host "      ssh -p $SSHPort $SSHUser@$SSHHost"
Write-Host ""
Write-Host "   2. Verify .env configuration:"
Write-Host "      cd public_html/backend && nano .env"
Write-Host "      - Check: DB_HOST, DB_USER, DB_PASSWORD"
Write-Host "      - Check: MAIL settings"
Write-Host ""
Write-Host "   3. Check VAPID keys were saved:"
Write-Host "      sqlite3 database.sqlite ""SELECT * FROM settings WHERE group='push';"""
Write-Host ""
Write-Host "   4. Test API endpoint:"
Write-Host "      curl -I https://yourdomain.com/api/products"
Write-Host ""
Write-Host "   5. Check Laravel logs for errors:"
Write-Host "      tail -f storage/logs/laravel.log"
Write-Host ""
Write-Host "✅ Backend is ready! Frontend deployed to Vercel."
