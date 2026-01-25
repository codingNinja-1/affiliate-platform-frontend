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
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;

/*
|--------------------------------------------------------------------------
| API Routes - Version 1
|--------------------------------------------------------------------------
*/
Route::prefix('api/v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Public Routes
    |--------------------------------------------------------------------------
    */

    // Authentication Routes (with rate limiting)
    Route::prefix('auth')->middleware('throttle:6,1')->group(function () {
        Route::post('/register', [RegisterController::class, 'register'])->name('auth.register');
        Route::post('/login', [LoginController::class, 'login'])->name('auth.login');
        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword'])->name('auth.forgot-password');
        Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->name('auth.reset-password');
        Route::post('/verify-email', [RegisterController::class, 'verifyEmail'])->name('auth.verify-email');
    });

    // Public Product Routes
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('products.index');
        Route::get('/{product:slug}', [ProductController::class, 'show'])->name('products.show');
    });

    // Tracking & Analytics (with rate limiting)
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/track/{referralCode}/{productId}', [TrackingController::class, 'trackClick'])->name('tracking.click');
        Route::get('/pixel/conversion', [PixelController::class, 'trackConversion'])->name('pixel.conversion');
    });

    // Payment & Checkout Routes
    Route::prefix('payment')->group(function () {
        Route::post('/initialize', [PurchaseController::class, 'initializePayment'])->name('payment.initialize');
        Route::get('/callback', [CheckoutController::class, 'handleCallback'])->name('payment.callback');
        Route::post('/webhook', [PurchaseController::class, 'handleWebhook'])->name('payment.webhook');
        Route::get('/public-key', [PurchaseController::class, 'getPublicKey'])->name('payment.public-key');
    });

    Route::prefix('checkout')->group(function () {
        Route::post('/initialize', [CheckoutController::class, 'initialize'])->name('checkout.initialize');
    });

    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('/transactions/{reference}', [CheckoutController::class, 'getTransactionByReference'])->name('transactions.by-reference');

    /*
    |--------------------------------------------------------------------------
    | Protected Routes (Authenticated Users)
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {

        // Dashboard Routes
        Route::prefix('dashboard')->group(function () {
            Route::get('/summary', [DashboardController::class, 'summary'])->name('dashboard.summary');
            Route::get('/affiliate/converted', [DashboardController::class, 'affiliateConverted'])->name('dashboard.affiliate.converted');
            Route::get('/vendor/converted', [DashboardController::class, 'vendorConverted'])->name('dashboard.vendor.converted');
        });

        // Auth Management Routes
        Route::prefix('auth')->group(function () {
            Route::get('/me', [LoginController::class, 'me'])->name('auth.me');
            Route::post('/logout', [LoginController::class, 'logout'])->name('auth.logout');
            Route::post('/logout-all', [LoginController::class, 'logoutAll'])->name('auth.logout-all');
            Route::post('/refresh', [LoginController::class, 'refreshToken'])->name('auth.refresh');
            Route::post('/change-password', [PasswordResetController::class, 'changePassword'])->name('auth.change-password');
        });

        // Profile Routes
        Route::prefix('profile')->group(function () {
            Route::get('/', [ProfileController::class, 'show'])->name('profile.show');
            Route::put('/', [ProfileController::class, 'update'])->name('profile.update');
            Route::post('/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
        });

        // Settings Routes
        Route::prefix('settings')->group(function () {
            Route::get('/', [SettingsController::class, 'index'])->name('settings.index');
            Route::post('/bank-details', [SettingsController::class, 'updateBankDetails'])->name('settings.bank-details');
            Route::get('/check-bank-details', [SettingsController::class, 'checkBankDetails'])->name('settings.check-bank-details');

            // Notification Settings
            Route::get('/notifications', [NotificationSettingsController::class, 'index'])->name('settings.notifications.index');
            Route::post('/notifications', [NotificationSettingsController::class, 'update'])->name('settings.notifications.update');

            // SMTP Settings (Admin only recommended)
            Route::get('/smtp', [SmtpSettingsController::class, 'index'])->name('settings.smtp.index');
            Route::post('/smtp', [SmtpSettingsController::class, 'update'])->name('settings.smtp.update');
            Route::post('/smtp/test', [SmtpSettingsController::class, 'test'])->name('settings.smtp.test');

            // Email Templates
            Route::get('/email-templates/{templateKey}', [EmailTemplateController::class, 'show'])->name('settings.email-templates.show');
            Route::post('/email-templates/{templateKey}', [EmailTemplateController::class, 'update'])->name('settings.email-templates.update');
        });

        /*
        |--------------------------------------------------------------------------
        | Vendor Routes
        |--------------------------------------------------------------------------
        */
        Route::prefix('vendor')->middleware('role:vendor')->name('vendor.')->group(function () {
            Route::apiResource('products', VendorProductController::class);
            Route::apiResource('withdrawals', VendorWithdrawalController::class);
            Route::get('/transactions', [VendorTransactionController::class, 'index'])->name('transactions.index');
            Route::get('/reports', [VendorReportController::class, 'index'])->name('reports.index');
        });

        /*
        |--------------------------------------------------------------------------
        | Affiliate Routes
        |--------------------------------------------------------------------------
        */
        Route::prefix('affiliate')->middleware('role:affiliate')->name('affiliate.')->group(function () {
            // Products
            Route::get('/products', [AffiliateProductController::class, 'index'])->name('products.index');
            Route::get('/products/{product}', [AffiliateProductController::class, 'show'])->name('products.show');

            // Withdrawals
            Route::apiResource('withdrawals', AffiliateWithdrawalController::class);

            // Commissions & Reports
            Route::get('/commissions', [AffiliateCommissionController::class, 'index'])->name('commissions.index');
            Route::get('/reports', [AffiliateReportController::class, 'index'])->name('reports.index');

            // Settings
            Route::get('/settings', [AffiliateController::class, 'getSettings'])->name('settings.show');
            Route::post('/settings/currency', [AffiliateController::class, 'updateCurrency'])->name('settings.currency');
        });

        /*
        |--------------------------------------------------------------------------
        | Admin Routes
        |--------------------------------------------------------------------------
        */
        Route::prefix('admin')->middleware('role:admin')->name('admin.')->group(function () {

            // Dashboard & Reports
            Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
            Route::get('/reports', [AdminReportsController::class, 'index'])->name('reports.index');

            // Affiliate Management
            Route::prefix('affiliates')->name('affiliates.')->group(function () {
                Route::get('/', [AdminAffiliateController::class, 'index'])->name('index');
                Route::post('/{id}/approve', [AdminAffiliateController::class, 'approve'])->name('approve');
                Route::post('/{id}/reject', [AdminAffiliateController::class, 'reject'])->name('reject');
            });

            // User Management
            Route::apiResource('users', AdminUserController::class)->only(['index', 'show', 'update']);

            // Product Management
            Route::apiResource('products', AdminProductController::class)->only(['index', 'show']);
            Route::prefix('products')->name('products.')->group(function () {
                Route::post('/{product}/approve', [AdminProductController::class, 'approve'])->name('approve');
                Route::post('/{product}/reject', [AdminProductController::class, 'reject'])->name('reject');
                Route::post('/{product}/activate', [AdminProductController::class, 'setActive'])->name('activate');
            });

            // Transaction Management
            Route::apiResource('transactions', AdminTransactionController::class)->only(['index', 'show']);

            // Withdrawal Management
            Route::apiResource('withdrawals', AdminWithdrawalController::class)->only(['index']);
            Route::prefix('withdrawals')->name('withdrawals.')->group(function () {
                Route::post('/{withdrawal}/approve', [AdminWithdrawalController::class, 'approve'])->name('approve');
                Route::post('/{withdrawal}/reject', [AdminWithdrawalController::class, 'reject'])->name('reject');
            });

            // Settings Management
            Route::prefix('settings')->name('settings.')->group(function () {
                // Payment Settings
                Route::get('/payment', [AdminSettingsController::class, 'getPaymentSettings'])->name('payment.show');
                Route::post('/payment', [AdminSettingsController::class, 'updatePaymentSettings'])->name('payment.update');

                // Currency Management
                Route::apiResource('currencies', AdminCurrencyController::class)->except(['show']);
                    Route::apiResource('currency-rates', AdminCurrencyController::class)->except(['show']);

            });
        });
    });
});
