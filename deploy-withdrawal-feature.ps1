# Deploy Automatic Withdrawal Feature to Hostinger (Without Git)
# This script uploads only the changed files for the withdrawal feature

# Configuration
$HOSTINGER_HOST = "snow-mantis-616662.hostingersite.com"
$HOSTINGER_USER = "u123456789"  # Update with your Hostinger username
$BACKEND_PATH = "public_html/affiliate-backend"

Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Deploy Automatic Withdrawal Feature          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Files to upload
$filesToUpload = @(
    "backend/app/Services/AutomaticWithdrawalService.php",
    "backend/app/Http/Controllers/BankController.php",
    "backend/app/Http/Controllers/Vendor/WithdrawalController.php",
    "backend/app/Http/Controllers/Affiliate/WithdrawalController.php",
    "backend/database/migrations/2026_02_01_000001_add_payout_fields_to_withdrawals_table.php",
    "backend/routes/api.php",
    "backend/.env.example"
)

Write-Host "Files to upload:" -ForegroundColor Yellow
foreach ($file in $filesToUpload) {
    $exists = Test-Path $file
    if ($exists) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (NOT FOUND)" -ForegroundColor Red
    }
}
Write-Host ""

# Check if user wants to use SFTP or manual upload
Write-Host "Deployment Options:" -ForegroundColor Cyan
Write-Host "1. Generate SFTP commands (you run manually)" -ForegroundColor White
Write-Host "2. Use WinSCP script (if installed)" -ForegroundColor White
Write-Host "3. Show cPanel File Manager instructions" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`nSFTP Commands to run:" -ForegroundColor Cyan
        Write-Host "======================================" -ForegroundColor Gray
        Write-Host "sftp $HOSTINGER_USER@$HOSTINGER_HOST" -ForegroundColor Yellow
        Write-Host "cd $BACKEND_PATH" -ForegroundColor Yellow
        Write-Host ""
        
        foreach ($file in $filesToUpload) {
            $remotePath = $file -replace "backend/", "" -replace "\\", "/"
            $remoteDir = Split-Path $remotePath -Parent
            $fileName = Split-Path $remotePath -Leaf
            
            if ($remoteDir) {
                Write-Host "mkdir -p $remoteDir" -ForegroundColor Yellow
                Write-Host "cd $remoteDir" -ForegroundColor Yellow
            }
            Write-Host "put `"$file`" $fileName" -ForegroundColor Yellow
            if ($remoteDir) {
                Write-Host "cd $BACKEND_PATH" -ForegroundColor Yellow
            }
            Write-Host ""
        }
        
        Write-Host "# After uploading, run migrations:" -ForegroundColor Green
        Write-Host "cd $BACKEND_PATH" -ForegroundColor Yellow
        Write-Host "php artisan migrate --force" -ForegroundColor Yellow
        Write-Host "php artisan config:clear" -ForegroundColor Yellow
        Write-Host "php artisan cache:clear" -ForegroundColor Yellow
        Write-Host "======================================" -ForegroundColor Gray
    }
    
    "2" {
        # Generate WinSCP script
        $scriptContent = @"
option batch abort
option confirm off
open sftp://$HOSTINGER_USER@$HOSTINGER_HOST
cd $BACKEND_PATH

"@
        foreach ($file in $filesToUpload) {
            $remotePath = $file -replace "backend/", "" -replace "\\", "/"
            $scriptContent += "put `"$file`" `"$remotePath`"`n"
        }
        
        $scriptContent += @"
exit
"@
        
        $scriptPath = "winscp-deploy.txt"
        $scriptContent | Out-File -FilePath $scriptPath -Encoding ASCII
        
        Write-Host "`nWinSCP script generated: $scriptPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "Run in Command Prompt:" -ForegroundColor Cyan
        Write-Host "winscp.com /script=$scriptPath /parameter $HOSTINGER_USER@$HOSTINGER_HOST" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "After upload, SSH in and run:" -ForegroundColor Cyan
        Write-Host "ssh $HOSTINGER_USER@$HOSTINGER_HOST" -ForegroundColor Yellow
        Write-Host "cd $BACKEND_PATH" -ForegroundColor Yellow
        Write-Host "php artisan migrate --force" -ForegroundColor Yellow
        Write-Host "php artisan config:clear" -ForegroundColor Yellow
        Write-Host "php artisan cache:clear" -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host "`nManual Upload via cPanel File Manager:" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Gray
        Write-Host ""
        Write-Host "1. Login to Hostinger cPanel" -ForegroundColor White
        Write-Host "2. Open File Manager" -ForegroundColor White
        Write-Host "3. Navigate to: $BACKEND_PATH" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "4. Upload these files to their respective folders:" -ForegroundColor White
        foreach ($file in $filesToUpload) {
            $remotePath = $file -replace "backend/", ""
            Write-Host "   → $file" -ForegroundColor Yellow
            Write-Host "     to: $BACKEND_PATH/$remotePath" -ForegroundColor Gray
            Write-Host ""
        }
        Write-Host ""
        Write-Host "5. After upload, use Terminal in cPanel and run:" -ForegroundColor White
        Write-Host "   cd $BACKEND_PATH" -ForegroundColor Yellow
        Write-Host "   php artisan migrate --force" -ForegroundColor Yellow
        Write-Host "   php artisan config:clear" -ForegroundColor Yellow
        Write-Host "   php artisan cache:clear" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "6. Update .env file with Paystack keys:" -ForegroundColor White
        Write-Host "   PAYSTACK_TEST_SECRET_KEY=sk_test_xxxxx" -ForegroundColor Yellow
        Write-Host "   PAYSTACK_TEST_PUBLIC_KEY=pk_test_xxxxx" -ForegroundColor Yellow
        Write-Host "   PAYSTACK_MODE=test" -ForegroundColor Yellow
        Write-Host "=========================================" -ForegroundColor Gray
    }
}

Write-Host "`n✓ Deployment guide generated!" -ForegroundColor Green
