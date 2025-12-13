<?php

use App\Http\Controllers\InventoryController;
use Illuminate\Support\Facades\Route;

// Enhanced Inventory Management Routes
Route::prefix('inventory')->name('inventory.')->group(function () {
    Route::get('/dashboard', [InventoryController::class, 'dashboard'])->name('dashboard');
    Route::get('/adjustment', [InventoryController::class, 'adjustment'])->name('adjustment');
    Route::post('/adjustments', [InventoryController::class, 'storeAdjustment'])->name('store.adjustment');
    Route::get('/suppliers', [InventoryController::class, 'suppliers'])->name('suppliers');
    Route::post('/suppliers', [InventoryController::class, 'storeSupplier'])->name('suppliers.store');
    Route::get('/suppliers/{id}/edit', [InventoryController::class, 'editSupplier'])->name('suppliers.edit');
    Route::put('/suppliers/{id}', [InventoryController::class, 'updateSupplier'])->name('suppliers.update');
    Route::delete('/suppliers/{id}', [InventoryController::class, 'deleteSupplier'])->name('suppliers.delete');
    Route::get('/purchase-orders', [InventoryController::class, 'purchaseOrders'])->name('purchase.orders');
    Route::post('/purchase-orders', [InventoryController::class, 'storePurchaseOrder'])->name('purchase.orders.store');
    Route::get('/reports', [InventoryController::class, 'reports'])->name('reports');
    Route::get('/reports/valuation', [InventoryController::class, 'valuationReport'])->name('reports.valuation');
    Route::get('/reports/movement', [InventoryController::class, 'movementReport'])->name('reports.movement');
    Route::get('/reports/forecast', [InventoryController::class, 'forecastReport'])->name('reports.forecast');
    Route::get('/reports/performance', [InventoryController::class, 'performanceReport'])->name('reports.performance');
    
    // API Routes for real-time data
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/low-stock', [InventoryController::class, 'getLowStockItems'])->name('low-stock');
        Route::get('/expiring', [InventoryController::class, 'getExpiringItems'])->name('expiring');
        Route::get('/fast-moving', [InventoryController::class, 'getFastMovingItems'])->name('fast-moving');
        Route::get('/slow-moving', [InventoryController::class, 'getSlowMovingItems'])->name('slow-moving');
        Route::get('/forecast', [InventoryController::class, 'getForecastData'])->name('forecast');
        Route::get('/valuation', [InventoryController::class, 'getValuationData'])->name('valuation');
        Route::get('/movement', [InventoryController::class, 'getMovementData'])->name('movement');
        Route::post('/stock-deduction', [InventoryController::class, 'deductStock'])->name('stock-deduction');
    });
    
    // Item specific routes
    Route::get('/{id}/barcode', [InventoryController::class, 'generateBarcode'])->name('barcode');
    Route::get('/{id}/history', [InventoryController::class, 'getItemHistory'])->name('history');
});