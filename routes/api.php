<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\SyncController;

// Mobile / API authentication endpoints for InfoPOS
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Unified Sync API endpoints for offline-first InfoPOS app
// GET /api/sync?table=products - Fetch data
// POST /api/sync?table=sales - Push data
// GET /api/sync/health - Health check
Route::get('/sync/health', [SyncController::class, 'healthCheck']);
Route::get('/sync', [SyncController::class, 'fetch']);
Route::post('/sync', [SyncController::class, 'push']);

// Test route to get current authenticated user
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Restaurant API v1 Routes
Route::prefix('v1/restaurant')->name('api.v1.restaurant.')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Restaurant Dashboard and Status
    Route::get('/dashboard', [RestaurantController::class, 'dashboard'])->name('dashboard');
    Route::get('/tables', [RestaurantController::class, 'tables'])->name('tables');
    Route::get('/tables/available', [RestaurantController::class, 'availableTables'])->name('tables.available');
    Route::get('/orders/active', [RestaurantController::class, 'activeOrders'])->name('orders.active');
    Route::get('/reservations/today', [RestaurantController::class, 'todayReservations'])->name('reservations.today');
    Route::get('/waiters', [RestaurantController::class, 'waiters'])->name('waiters');
    Route::get('/customers', [RestaurantController::class, 'customers'])->name('customers');
    Route::get('/statistics', [RestaurantController::class, 'statistics'])->name('statistics');
});

// Restaurant Order API v1 Routes
Route::prefix('v1/restaurant/orders')->name('api.v1.restaurant.orders.')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/', [OrderController::class, 'index'])->name('index');
    Route::get('/{id}', [OrderController::class, 'show'])->name('show');
    Route::post('/', [OrderController::class, 'store'])->name('store');
    Route::put('/{id}/status', [OrderController::class, 'updateStatus'])->name('update-status');
    Route::post('/{id}/items', [OrderController::class, 'addItem'])->name('add-item');
    Route::delete('/{orderId}/items/{itemId}', [OrderController::class, 'removeItem'])->name('remove-item');
});
