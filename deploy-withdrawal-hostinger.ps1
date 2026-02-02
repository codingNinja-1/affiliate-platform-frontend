# Deploy Automatic Withdrawal Feature to Hostinger
# Upload files manually via cPanel File Manager or SFTP

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Automatic Withdrawal Feature Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "FILES TO UPLOAD TO HOSTINGER:" -ForegroundColor Yellow
Write-Host ""

$files = @(
    @{Local="backend\app\Services\AutomaticWithdrawalService.php"; Remote="app/Services/AutomaticWithdrawalService.php"},
    @{Local="backend\app\Http\Controllers\BankController.php"; Remote="app/Http/Controllers/BankController.php"},
    @{Local="backend\app\Http\Controllers\Vendor\WithdrawalController.php"; Remote="app/Http/Controllers/Vendor/WithdrawalController.php"},
    @{Local="backend\app\Http\Controllers\Affiliate\WithdrawalController.php"; Remote="app/Http/Controllers/Affiliate/WithdrawalController.php"},
    @{Local="backend\database\migrations\2026_02_01_000001_add_payout_fields_to_withdrawals_table.php"; Remote="database/migrations/2026_02_01_000001_add_payout_fields_to_withdrawals_table.php"},
    @{Local="backend\routes\api.php"; Remote="routes/api.php"}
)

$counter = 1
foreach ($file in $files) {
    $exists = Test-Path $file.Local
    if ($exists) {
        Write-Host "$counter. [OK] $($file.Local)" -ForegroundColor Green
        Write-Host "   Upload to: public_html/affiliate-backend/$($file.Remote)" -ForegroundColor Gray
    } else {
        Write-Host "$counter. [MISSING] $($file.Local)" -ForegroundColor Red
    }
    Write-Host ""
    $counter++
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT STEPS:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "METHOD 1: Using cPanel File Manager (Recommended)" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
Write-Host "1. Login to your Hostinger cPanel"
Write-Host "2. Open File Manager"
Write-Host "3. Navigate to: public_html/affiliate-backend"
Write-Host "4. Upload each file above to its corresponding folder"
Write-Host "5. Open Terminal in cPanel and run:"
Write-Host "   cd public_html/affiliate-backend" -ForegroundColor Yellow
Write-Host "   php artisan migrate --force" -ForegroundColor Yellow
Write-Host "   php artisan config:clear" -ForegroundColor Yellow
Write-Host "   php artisan cache:clear" -ForegroundColor Yellow
Write-Host ""

Write-Host "METHOD 2: Using SFTP (FileZilla, WinSCP, etc)" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
Write-Host "1. Connect via SFTP to: snow-mantis-616662.hostingersite.com"
Write-Host "2. Navigate to: public_html/affiliate-backend"
Write-Host "3. Upload files to their respective folders"
Write-Host "4. SSH in and run migrations (see Method 1 step 5)"
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "CONFIGURE PAYSTACK KEYS:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Edit .env file on Hostinger and add:" -ForegroundColor Yellow
Write-Host ""
Write-Host "PAYSTACK_TEST_PUBLIC_KEY=pk_test_xxxxx" -ForegroundColor White
Write-Host "PAYSTACK_TEST_SECRET_KEY=sk_test_xxxxx" -ForegroundColor White
Write-Host "PAYSTACK_LIVE_PUBLIC_KEY=pk_live_xxxxx" -ForegroundColor White
Write-Host "PAYSTACK_LIVE_SECRET_KEY=sk_live_xxxxx" -ForegroundColor White
Write-Host "PAYSTACK_MODE=test" -ForegroundColor White
Write-Host ""
Write-Host "Get your keys from: https://dashboard.paystack.com/#/settings/developers" -ForegroundColor Gray
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AFTER DEPLOYMENT:" -ForegroundColor Cyan  
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add Paystack keys to .env file"
Write-Host "2. Run migrations (php artisan migrate --force)"
Write-Host "3. Clear cache (php artisan cache:clear)"
Write-Host "4. Fund your Paystack account (for live mode)"
Write-Host "5. Test withdrawal with minimum amount (NGN 1,000)"
Write-Host ""

Write-Host "Done! Press any key to exit..." -ForegroundColor Green
Read-Host
