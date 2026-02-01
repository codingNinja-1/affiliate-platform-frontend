# Hostinger SSH Deployment Script for PowerShell
# This script will connect to Hostinger via SSH and deploy the latest backend changes

# Configuration
$HOSTINGER_HOST = "snow-mantis-616662.hostingersite.com"  # Change if different
$HOSTINGER_USER = "u123456789"  # Change to your Hostinger username
$BACKEND_PATH = "public_html/affiliate-backend"  # Path in Hostinger

# Function to execute SSH commands
function Deploy-Hostinger {
    param(
        [string]$Host,
        [string]$User,
        [string]$Path
    )
    
    Write-Host "Connecting to Hostinger..." -ForegroundColor Cyan
    Write-Host "Host: $Host" -ForegroundColor Gray
    Write-Host "User: $User" -ForegroundColor Gray
    Write-Host "Backend Path: $Path" -ForegroundColor Gray
    Write-Host ""
    
    # SSH command sequence
    $deployCommand = @"
cd $Path
echo '=== Current Status ==='
pwd
git status
echo ''
echo '=== Pulling Latest Changes ==='
git pull origin master
echo ''
echo '=== Installing Dependencies ==='
composer install --optimize-autoloader --no-dev
echo ''
echo '=== Clearing Cache ==='
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan cache:clear
echo ''
echo '=== Deployment Complete ==='
echo 'Verifying connection...'
curl -s https://$Host/api/products | head -c 200
echo ''
echo 'Done!'
"@

    # Execute via SSH
    # You'll be prompted for password
    ssh "${User}@${Host}" -p 22 $deployCommand
}

# Main
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║  Hostinger Backend Deployment Script       ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Validate configuration
if ($HOSTINGER_USER -eq "u123456789") {
    Write-Host "⚠️  WARNING: Using default username. Update `$HOSTINGER_USER in this script!" -ForegroundColor Yellow
    Read-Host "Press Enter to continue with custom prompt, or Ctrl+C to exit"
    $HOSTINGER_USER = Read-Host "Enter your Hostinger username"
}

Write-Host "Ready to deploy to Hostinger?" -ForegroundColor Yellow
$confirm = Read-Host "Type 'yes' to continue"

if ($confirm -eq "yes") {
    try {
        Deploy-Hostinger -Host $HOSTINGER_HOST -User $HOSTINGER_USER -Path $BACKEND_PATH
    } catch {
        Write-Host "Error during deployment: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
}
