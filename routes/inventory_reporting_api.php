<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InventoryReportingController;

/*
|--------------------------------------------------------------------------
| Inventory Reporting API Routes
|--------------------------------------------------------------------------
|
| These routes handle all inventory reporting endpoints for the restaurant POS system.
|
*/

Route::prefix('inventory/reports')->middleware(['auth:sanctum'])->group(function () {
    
    // Inventory Valuation Reports
    Route::get('/valuation', [InventoryReportingController::class, 'generateInventoryValuation'])
        ->name('inventory.reports.valuation');

    // Food Cost Analysis Reports
    Route::get('/food-cost-analysis', [InventoryReportingController::class, 'generateFoodCostAnalysis'])
        ->name('inventory.reports.food-cost');

    // Waste and Spoilage Reports
    Route::get('/waste-spoilage', [InventoryReportingController::class, 'generateWasteSpoilageReport'])
        ->name('inventory.reports.waste');

    // Inventory Turnover Reports
    Route::get('/turnover', [InventoryReportingController::class, 'generateInventoryTurnover'])
        ->name('inventory.reports.turnover');

    // Ingredient Usage Reports
    Route::get('/ingredient-usage', [InventoryReportingController::class, 'generateIngredientUsage'])
        ->name('inventory.reports.usage');

    // Variance Analysis Reports
    Route::get('/variance-analysis', [InventoryReportingController::class, 'generateVarianceAnalysis'])
        ->name('inventory.reports.variance');

    // Comprehensive Dashboard
    Route::get('/dashboard', [InventoryReportingController::class, 'getInventoryDashboard'])
        ->name('inventory.reports.dashboard');

    // Report Export
    Route::post('/export', [InventoryReportingController::class, 'exportReportToCsv'])
        ->name('inventory.reports.export');

    // Real-time Updates
    Route::get('/real-time-updates', [InventoryReportingController::class, 'getRealTimeUpdates'])
        ->name('inventory.reports.real-time');
});

// Include this file in your main routes/api.php file:
// require __DIR__.'/inventory_reporting_api.php';