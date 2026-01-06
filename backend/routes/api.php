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

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
    Route::post('/verify-email', [RegisterController::class, 'verifyEmail']);
});

// Protected routes (conditionally registered to avoid missing controller errors during development)
Route::middleware('auth:sanctum')->group(function () {
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

    // Admin routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);
        Route::get('/reports', [\App\Http\Controllers\Admin\ReportsController::class, 'index']);
        Route::apiResource('users', \App\Http\Controllers\Admin\UserController::class);
        // Placeholder resources for future expansion; implement as needed
        Route::apiResource('products', \App\Http\Controllers\Admin\ProductController::class)->only(['index']);
        Route::apiResource('transactions', \App\Http\Controllers\Admin\TransactionController::class)->only(['index']);
        Route::apiResource('withdrawals', \App\Http\Controllers\Admin\WithdrawalController::class)->only(['index']);
        Route::post('/products/{product}/approve', [\App\Http\Controllers\Admin\ProductController::class, 'approve'])->name('admin.products.approve');
        Route::post('/products/{product}/reject', [\App\Http\Controllers\Admin\ProductController::class, 'reject'])->name('admin.products.reject');
        Route::post('/withdrawals/{withdrawal}/approve', [\App\Http\Controllers\Admin\WithdrawalController::class, 'approve'])->name('admin.withdrawals.approve');
        Route::post('/withdrawals/{withdrawal}/reject', [\App\Http\Controllers\Admin\WithdrawalController::class, 'reject'])->name('admin.withdrawals.reject');
    });

    // Vendor routes
    Route::prefix('vendor')->middleware('role:vendor')->group(function () {
        Route::apiResource('products', \App\Http\Controllers\Vendor\ProductController::class);
        Route::apiResource('withdrawals', \App\Http\Controllers\Vendor\WithdrawalController::class);
        Route::get('/reports', \App\Http\Controllers\Vendor\ReportController::class . '@index');
    });

    // Affiliate routes
    Route::prefix('affiliate')->middleware('role:affiliate')->group(function () {
        Route::get('/products', \App\Http\Controllers\Affiliate\ProductController::class . '@index');
        Route::get('/products/{product}', \App\Http\Controllers\Affiliate\ProductController::class . '@show');
        Route::apiResource('withdrawals', \App\Http\Controllers\Affiliate\WithdrawalController::class);
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
    Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
    Route::get('/products/{product:slug}', [\App\Http\Controllers\ProductController::class, 'show']);

    // Shared routes
    if (class_exists('App\\Http\\Controllers\\ProfileController')) {
        Route::get('/profile', 'ProfileController@show');
        Route::put('/profile', 'ProfileController@update');
        Route::post('/profile/avatar', 'ProfileController@updateAvatar');
    }
});

// Public product routes (no authentication required)
Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
Route::get('/products/{product:slug}', [\App\Http\Controllers\ProductController::class, 'show']);

// Affiliate tracking (public - no auth required)
Route::get('/track/{referralCode}/{productId}', [\App\Http\Controllers\TrackingController::class, 'trackClick']);

// Purchase recording (public endpoint for now - in production add webhook security)
Route::post('/purchases', [\App\Http\Controllers\PurchaseController::class, 'store']);
