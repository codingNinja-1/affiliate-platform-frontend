<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes (no authentication required)
Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
    Route::post('/verify-email', [RegisterController::class, 'verifyEmail']);
});

// ...existing code...

// Public product routes (no auth required)
Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
Route::get('/products/{product:slug}', [\App\Http\Controllers\ProductController::class, 'show']);

// Affiliate tracking (public - no auth required)
Route::get('/track/{referralCode}/{productId}', [\App\Http\Controllers\TrackingController::class, 'trackClick']);

// Payment routes (public)
Route::post('/payment/initialize', [\App\Http\Controllers\PurchaseController::class, 'initializePayment']);
// Point callback to the new CheckoutController so transactions started via /checkout/initialize are completed
Route::get('/payment/callback', [\App\Http\Controllers\CheckoutController::class, 'handleCallback']);
Route::post('/payment/webhook', [\App\Http\Controllers\PurchaseController::class, 'handleWebhook']);
Route::get('/payment/public-key', [\App\Http\Controllers\PurchaseController::class, 'getPublicKey']);

// Centralized checkout (public - new Stakecut-style endpoint)
Route::post('/checkout/initialize', [\App\Http\Controllers\CheckoutController::class, 'initialize']);

// Conversion pixel tracking (public)
Route::get('/pixel/conversion', [\App\Http\Controllers\PixelController::class, 'trackConversion']);
// Purchase recording (legacy demo endpoint)
Route::post('/purchases', [\App\Http\Controllers\PurchaseController::class, 'store']);

// Transaction lookup by reference (public - for purchase success page)
Route::get('/transactions/{reference}', [\App\Http\Controllers\CheckoutController::class, 'getTransactionByReference']);

// Protected routes (conditionally registered to avoid missing controller errors during development)
Route::middleware('auth:sanctum')->group(function () {
        // Vendor currency update endpoint (must be authenticated)
        Route::post('/vendor/settings/currency', [\App\Http\Controllers\Vendor\SettingsController::class, 'updateCurrency']);
    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::get('/me', [LoginController::class, 'me']);
        Route::post('/logout', [LoginController::class, 'logout']);
        Route::post('/logout-all', [LoginController::class, 'logoutAll']);
        Route::post('/refresh', [LoginController::class, 'refreshToken']);
        Route::post('/change-password', [PasswordResetController::class, 'changePassword']);
    });

    // Settings routes
    Route::prefix('settings')->group(function () {
        Route::get('/notifications', [\App\Http\Controllers\NotificationSettingsController::class, 'index']);
        Route::post('/notifications', [\App\Http\Controllers\NotificationSettingsController::class, 'update']);

        // SMTP settings
        Route::get('/smtp', [\App\Http\Controllers\SmtpSettingsController::class, 'index']);
        Route::post('/smtp', [\App\Http\Controllers\SmtpSettingsController::class, 'update']);
        Route::post('/smtp/test', [\App\Http\Controllers\SmtpSettingsController::class, 'test']);

        // Email templates
        Route::get('/email-templates/{templateKey}', [\App\Http\Controllers\EmailTemplateController::class, 'show']);
        Route::post('/email-templates/{templateKey}', [\App\Http\Controllers\EmailTemplateController::class, 'update']);
    });

    // Admin routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);
        Route::get('/reports', [\App\Http\Controllers\Admin\ReportsController::class, 'index']);
        Route::get('/affiliates', [\App\Http\Controllers\Admin\AffiliateController::class, 'index']);
        Route::post('/affiliates/{id}/approve', [\App\Http\Controllers\Admin\AffiliateController::class, 'approve']);
        Route::post('/affiliates/{id}/reject', [\App\Http\Controllers\Admin\AffiliateController::class, 'reject']);
            // Currency rates settings
            Route::get('/settings/currencies', [\App\Http\Controllers\Admin\CurrencyController::class, 'index']);
        Route::apiResource('users', \App\Http\Controllers\Admin\UserController::class)->only(['index', 'show', 'update']);
        Route::apiResource('products', \App\Http\Controllers\Admin\ProductController::class)->only(['index', 'show']);
        Route::apiResource('transactions', \App\Http\Controllers\Admin\TransactionController::class)->only(['index', 'show']);
        Route::apiResource('withdrawals', \App\Http\Controllers\Admin\WithdrawalController::class)->only(['index']);
        Route::post('/products/{product}/approve', [\App\Http\Controllers\Admin\ProductController::class, 'approve'])->name('admin.products.approve');
        Route::post('/products/{product}/reject', [\App\Http\Controllers\Admin\ProductController::class, 'reject'])->name('admin.products.reject');
        Route::post('/products/{product}/activate', [\App\Http\Controllers\Admin\ProductController::class, 'setActive'])->name('admin.products.activate');
        Route::post('/withdrawals/{withdrawal}/approve', [\App\Http\Controllers\Admin\WithdrawalController::class, 'approve'])->name('admin.withdrawals.approve');
        Route::post('/withdrawals/{withdrawal}/reject', [\App\Http\Controllers\Admin\WithdrawalController::class, 'reject'])->name('admin.withdrawals.reject');

        // Settings
        Route::get('/settings/payment', [\App\Http\Controllers\Admin\SettingsController::class, 'getPaymentSettings']);
        Route::post('/settings/payment', [\App\Http\Controllers\Admin\SettingsController::class, 'updatePaymentSettings']);
    });

    // Vendor dashboard converted endpoint
    Route::get('/vendor/dashboard/converted', [\App\Http\Controllers\Vendor\DashboardController::class, 'converted']);
    // Vendor settings endpoints
    Route::get('/vendor/settings', [\App\Http\Controllers\Vendor\SettingsController::class, 'index']);
    Route::post('/vendor/settings/currency', [\App\Http\Controllers\Vendor\SettingsController::class, 'updateCurrency']);

    // Vendor routes
    Route::prefix('vendor')->middleware('role:vendor')->group(function () {
        Route::apiResource('products', \App\Http\Controllers\Vendor\ProductController::class);
        Route::apiResource('withdrawals', \App\Http\Controllers\Vendor\WithdrawalController::class);
        Route::get('/transactions', [\App\Http\Controllers\Vendor\TransactionController::class, 'index']);
        Route::get('/reports', \App\Http\Controllers\Vendor\ReportController::class . '@index');
    });

    // Affiliate dashboard converted endpoint
    Route::get('/affiliate/dashboard/converted', [\App\Http\Controllers\Affiliate\DashboardController::class, 'converted']);

    // Affiliate settings endpoints
    Route::get('/affiliate/settings', [\App\Http\Controllers\Affiliate\SettingsController::class, 'index']);
    Route::post('/affiliate/settings/currency', [\App\Http\Controllers\Affiliate\SettingsController::class, 'updateCurrency']);

    // Affiliate routes
    Route::prefix('affiliate')->middleware('role:affiliate')->group(function () {
        Route::get('/products', \App\Http\Controllers\Affiliate\ProductController::class . '@index');
        Route::get('/products/{product}', \App\Http\Controllers\Affiliate\ProductController::class . '@show');
        Route::apiResource('withdrawals', \App\Http\Controllers\Affiliate\WithdrawalController::class);
        Route::get('/commissions', [\App\Http\Controllers\Affiliate\CommissionController::class, 'index']);
        Route::get('/reports', \App\Http\Controllers\Affiliate\ReportController::class . '@index');
    });

    // Customer routes
    if (class_exists('App\\Http\\Controllers\\Customer\\OrderController')) {
        Route::prefix('customer')->middleware('role:customer')->group(function () {
            Route::get('/orders', 'Customer\OrderController@index');
            Route::get('/orders/{transaction}', 'Customer\OrderController@show');
        });
    }

    // Customer/Authenticated user product routes
    Route::get('/products-auth', [\App\Http\Controllers\ProductController::class, 'index']);
    Route::get('/products-auth/{product:slug}', [\App\Http\Controllers\ProductController::class, 'show']);

    // Shared routes
    if (class_exists('App\\Http\\Controllers\\ProfileController')) {
        Route::get('/profile', 'ProfileController@show');
        Route::put('/profile', 'ProfileController@update');
        Route::post('/profile/avatar', 'ProfileController@updateAvatar');
    }

    // Settings routes
    Route::prefix('settings')->group(function () {
        Route::get('/', [\App\Http\Controllers\SettingsController::class, 'index']);
        Route::post('/bank-details', [\App\Http\Controllers\SettingsController::class, 'updateBankDetails']);
        Route::get('/check-bank-details', [\App\Http\Controllers\SettingsController::class, 'checkBankDetails']);
    });
});

// Note: Public product routes are defined above without auth middleware
