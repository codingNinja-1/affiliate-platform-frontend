<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/affiliate/dashboard/converted', [DashboardController::class, 'affiliateConverted']);
    Route::get('/vendor/dashboard/converted', [DashboardController::class, 'vendorConverted']);

    // Profile
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'show']);
    Route::put('/profile', [\App\Http\Controllers\ProfileController::class, 'update']);

    // Settings
    Route::get('/settings', [\App\Http\Controllers\SettingsController::class, 'index']);
    Route::post('/settings', [\App\Http\Controllers\SettingsController::class, 'update']);
    Route::get('/settings/check-bank-details', [\App\Http\Controllers\SettingsController::class, 'checkBankDetails']);

    // Affiliate routes
    Route::prefix('affiliate')->group(function () {
        Route::get('/settings', [\App\Http\Controllers\AffiliateController::class, 'getSettings']);
        Route::post('/settings/currency', [\App\Http\Controllers\AffiliateController::class, 'updateCurrency']);
        Route::get('/commissions', [\App\Http\Controllers\AffiliateController::class, 'commissions']);
        Route::get('/withdrawals', [\App\Http\Controllers\AffiliateController::class, 'withdrawals']);
        Route::post('/withdrawals', [\App\Http\Controllers\AffiliateController::class, 'requestWithdrawal']);
        Route::get('/products', [\App\Http\Controllers\AffiliateController::class, 'products']);
        Route::get('/links', [\App\Http\Controllers\AffiliateController::class, 'links']);
        Route::post('/links', [\App\Http\Controllers\AffiliateController::class, 'createLink']);
        Route::get('/analytics', [\App\Http\Controllers\AffiliateController::class, 'analytics']);
    });

    // Vendor routes
    Route::prefix('vendor')->group(function () {
        Route::get('/settings', [\App\Http\Controllers\VendorController::class, 'getSettings']);
        Route::post('/settings/currency', [\App\Http\Controllers\VendorController::class, 'updateCurrency']);
        Route::get('/transactions', [\App\Http\Controllers\VendorController::class, 'transactions']);
        Route::get('/withdrawals', [\App\Http\Controllers\VendorController::class, 'withdrawals']);
        Route::post('/withdrawals', [\App\Http\Controllers\VendorController::class, 'requestWithdrawal']);
        Route::get('/products', [\App\Http\Controllers\VendorController::class, 'products']);
        Route::post('/products', [\App\Http\Controllers\VendorController::class, 'createProduct']);
        Route::put('/products/{id}', [\App\Http\Controllers\VendorController::class, 'updateProduct']);
        Route::delete('/products/{id}', [\App\Http\Controllers\VendorController::class, 'deleteProduct']);
    });

    // Withdrawals
    Route::get('/withdrawals', [\App\Http\Controllers\WithdrawalController::class, 'index']);
    Route::post('/withdrawals', [\App\Http\Controllers\WithdrawalController::class, 'store']);
    Route::get('/withdrawals/{id}', [\App\Http\Controllers\WithdrawalController::class, 'show']);

    // Products
    Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
    Route::get('/products/{id}', [\App\Http\Controllers\ProductController::class, 'show']);

    // Admin routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
        Route::get('/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'show']);
        Route::put('/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'update']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'destroy']);

        Route::get('/withdrawals', [\App\Http\Controllers\Admin\WithdrawalController::class, 'index']);
        Route::put('/withdrawals/{id}/approve', [\App\Http\Controllers\Admin\WithdrawalController::class, 'approve']);
        Route::put('/withdrawals/{id}/reject', [\App\Http\Controllers\Admin\WithdrawalController::class, 'reject']);

        Route::get('/products', [\App\Http\Controllers\Admin\ProductController::class, 'index']);
        Route::post('/products', [\App\Http\Controllers\Admin\ProductController::class, 'store']);
        Route::put('/products/{id}', [\App\Http\Controllers\Admin\ProductController::class, 'update']);
        Route::delete('/products/{id}', [\App\Http\Controllers\Admin\ProductController::class, 'destroy']);

        Route::get('/settings/currencies', [\App\Http\Controllers\Admin\CurrencyController::class, 'index']);
        Route::post('/settings/currencies', [\App\Http\Controllers\Admin\CurrencyController::class, 'store']);
        Route::put('/settings/currencies/{id}', [\App\Http\Controllers\Admin\CurrencyController::class, 'update']);
        Route::delete('/settings/currencies/{id}', [\App\Http\Controllers\Admin\CurrencyController::class, 'destroy']);
    });
});

// Public product routes (for affiliate links)
Route::get('/public/products', [\App\Http\Controllers\ProductController::class, 'publicIndex']);
Route::get('/public/products/{id}', [\App\Http\Controllers\ProductController::class, 'publicShow']);

// Affiliate link tracking
Route::get('/track/{code}', [\App\Http\Controllers\TrackingController::class, 'track']);
