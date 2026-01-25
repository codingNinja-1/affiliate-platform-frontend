<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth Controllers
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\PasswordResetController;

/*
|--------------------------------------------------------------------------
| Core Controllers
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationSettingsController;
use App\Http\Controllers\SmtpSettingsController;
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\PixelController;

/*
|--------------------------------------------------------------------------
| Affiliate Controllers
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Affiliate\AffiliateController;
use App\Http\Controllers\Affiliate\ProductController as AffiliateProductController;
use App\Http\Controllers\Affiliate\WithdrawalController as AffiliateWithdrawalController;
use App\Http\Controllers\Affiliate\CommissionController as AffiliateCommissionController;
use App\Http\Controllers\Affiliate\ReportController as AffiliateReportController;

/*
|--------------------------------------------------------------------------
| Vendor Controllers
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Vendor\VendorController;
use App\Http\Controllers\Vendor\ProductController as VendorProductController;
use App\Http\Controllers\Vendor\WithdrawalController as VendorWithdrawalController;
use App\Http\Controllers\Vendor\TransactionController as VendorTransactionController;
use App\Http\Controllers\Vendor\ReportController as VendorReportController;

/*
|--------------------------------------------------------------------------
| Admin Controllers
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\WithdrawalController as AdminWithdrawalController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\CurrencyController as AdminCurrencyController;
use App\Http\Controllers\Admin\ReportsController as AdminReportsController;
use App\Http\Controllers\Admin\AffiliateController as AdminAffiliateController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;

/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
    Route::post('/verify-email', [RegisterController::class, 'verifyEmail']);
});

/*
|--------------------------------------------------------------------------
| Public Product & Tracking Routes
|--------------------------------------------------------------------------
*/
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product:slug}', [ProductController::class, 'show']);
Route::get('/track/{referralCode}/{productId}', [TrackingController::class, 'trackClick']);

// Checkout / Payment / Pixel tracking
Route::post('/payment/initialize', [PurchaseController::class, 'initializePayment']);
Route::get('/payment/callback', [CheckoutController::class, 'handleCallback']);
Route::post('/payment/webhook', [PurchaseController::class, 'handleWebhook']);
Route::get('/payment/public-key', [PurchaseController::class, 'getPublicKey']);
Route::post('/checkout/initialize', [CheckoutController::class, 'initialize']);
Route::get('/pixel/conversion', [PixelController::class, 'trackConversion']);
Route::post('/purchases', [PurchaseController::class, 'store']);
Route::get('/transactions/{reference}', [CheckoutController::class, 'getTransactionByReference']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/affiliate/dashboard/converted', [DashboardController::class, 'affiliateConverted']);
    Route::get('/vendor/dashboard/converted', [DashboardController::class, 'vendorConverted']);

    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('/me', [LoginController::class, 'me']);
        Route::post('/logout', [LoginController::class, 'logout']);
        Route::post('/logout-all', [LoginController::class, 'logoutAll']);
        Route::post('/refresh', [LoginController::class, 'refreshToken']);
        Route::post('/change-password', [PasswordResetController::class, 'changePassword']);
    });

    // Profile (conditional)
    if (class_exists(ProfileController::class)) {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    }

    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingsController::class, 'index']);
        Route::post('/bank-details', [SettingsController::class, 'updateBankDetails']);
        Route::get('/check-bank-details', [SettingsController::class, 'checkBankDetails']);

        if (class_exists(NotificationSettingsController::class)) {
            Route::get('/notifications', [NotificationSettingsController::class, 'index']);
            Route::post('/notifications', [NotificationSettingsController::class, 'update']);
        }

        if (class_exists(SmtpSettingsController::class)) {
            Route::get('/smtp', [SmtpSettingsController::class, 'index']);
            Route::post('/smtp', [SmtpSettingsController::class, 'update']);
            Route::post('/smtp/test', [SmtpSettingsController::class, 'test']);
        }

        if (class_exists(EmailTemplateController::class)) {
            Route::get('/email-templates/{templateKey}', [EmailTemplateController::class, 'show']);
            Route::post('/email-templates/{templateKey}', [EmailTemplateController::class, 'update']);
        }
    });

    // Vendor Routes
    Route::prefix('vendor')->middleware('role:vendor')->group(function () {
        Route::apiResource('products', VendorProductController::class);
        Route::apiResource('withdrawals', VendorWithdrawalController::class);
        Route::get('/transactions', [VendorTransactionController::class, 'index']);
        Route::get('/reports', [VendorReportController::class, 'index']);
    });

    // Affiliate Routes
    Route::prefix('affiliate')->middleware('role:affiliate')->group(function () {
        Route::get('/products', [AffiliateProductController::class, 'index']);
        Route::get('/products/{product}', [AffiliateProductController::class, 'show']);
        Route::apiResource('withdrawals', AffiliateWithdrawalController::class);
        Route::get('/commissions', [AffiliateCommissionController::class, 'index']);
        Route::get('/reports', [AffiliateReportController::class, 'index']);
        Route::get('/settings', [AffiliateController::class, 'getSettings']);
        Route::post('/settings/currency', [AffiliateController::class, 'updateCurrency']);
    });

    // Admin Routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/reports', [AdminReportsController::class, 'index']);
        Route::get('/affiliates', [AdminAffiliateController::class, 'index']);
        Route::post('/affiliates/{id}/approve', [AdminAffiliateController::class, 'approve']);
        Route::post('/affiliates/{id}/reject', [AdminAffiliateController::class, 'reject']);
        Route::apiResource('users', AdminUserController::class)->only(['index','show','update']);
        Route::apiResource('products', AdminProductController::class)->only(['index','show']);
        Route::apiResource('transactions', \App\Http\Controllers\Admin\TransactionController::class)->only(['index','show']);
        Route::apiResource('withdrawals', AdminWithdrawalController::class)->only(['index']);
        Route::post('/products/{product}/approve', [AdminProductController::class, 'approve']);
        Route::post('/products/{product}/reject', [AdminProductController::class, 'reject']);
        Route::post('/products/{product}/activate', [AdminProductController::class, 'setActive']);
        Route::post('/withdrawals/{withdrawal}/approve', [AdminWithdrawalController::class, 'approve']);
        Route::post('/withdrawals/{withdrawal}/reject', [AdminWithdrawalController::class, 'reject']);
        Route::get('/settings/payment', [AdminSettingsController::class, 'getPaymentSettings']);
        Route::post('/settings/payment', [AdminSettingsController::class, 'updatePaymentSettings']);
        Route::get('/settings/currencies', [AdminCurrencyController::class, 'index']);
        Route::post('/settings/currencies', [AdminCurrencyController::class, 'store']);
        Route::put('/settings/currencies/{id}', [AdminCurrencyController::class, 'update']);
        Route::delete('/settings/currencies/{id}', [AdminCurrencyController::class, 'destroy']);
    });
});
