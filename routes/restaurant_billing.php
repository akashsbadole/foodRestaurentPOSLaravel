<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Restaurant\OrderController;
use App\Http\Controllers\Restaurant\BillingController;
use App\Http\Controllers\Restaurant\TaxConfigurationController;

/*
|--------------------------------------------------------------------------
| Restaurant Billing API Routes
|--------------------------------------------------------------------------
|
| These routes handle the billing and tax calculation functionality
| for the restaurant POS system.
|
*/

// Order billing endpoints
Route::prefix('orders/{order}')->group(function () {
    // Billing calculations
    Route::get('billing/calculate', [OrderController::class, 'calculateBilling'])->name('orders.billing.calculate');
    Route::get('billing/preview', [OrderController::class, 'billingPreview'])->name('orders.billing.preview');
    Route::get('billing/history', [OrderController::class, 'billingHistory'])->name('orders.billing.history');
    
    // Discount management
    Route::post('discounts/apply', [OrderController::class, 'applyDiscount'])->name('orders.discounts.apply');
    
    // Tax calculations
    Route::get('taxes/calculate', [OrderController::class, 'calculateTaxes'])->name('orders.taxes.calculate');
    
    // Invoice management
    Route::post('invoices/generate', [OrderController::class, 'generateInvoice'])->name('orders.invoices.generate');
    
    // Split billing
    Route::post('billing/split', [OrderController::class, 'calculateSplitBilling'])->name('orders.billing.split');
});

// Invoice management endpoints
Route::prefix('invoices')->group(function () {
    Route::get('{invoice}', [OrderController::class, 'showInvoice'])->name('invoices.show');
    Route::post('{invoice}/issue', [OrderController::class, 'issueInvoice'])->name('invoices.issue');
    Route::post('{invoice}/void', [OrderController::class, 'voidInvoice'])->name('invoices.void');
    Route::post('{invoice}/refund', [OrderController::class, 'refundInvoice'])->name('invoices.refund');
});

// Tax configuration endpoints
Route::prefix('tax-configurations')->group(function () {
    Route::get('/', [TaxConfigurationController::class, 'index'])->name('tax-configurations.index');
    Route::post('/', [TaxConfigurationController::class, 'store'])->name('tax-configurations.store');
    Route::get('{taxConfiguration}', [TaxConfigurationController::class, 'show'])->name('tax-configurations.show');
    Route::put('{taxConfiguration}', [TaxConfigurationController::class, 'update'])->name('tax-configurations.update');
    Route::delete('{taxConfiguration}', [TaxConfigurationController::class, 'destroy'])->name('tax-configurations.destroy');
    
    // Tax calculation utilities
    Route::post('calculate', [TaxConfigurationController::class, 'calculateTaxes'])->name('tax-configurations.calculate');
    Route::get('applicable/{productId}', [TaxConfigurationController::class, 'getApplicableTaxes'])->name('tax-configurations.applicable');
    Route::get('exemption-check/{productId}', [TaxConfigurationController::class, 'checkTaxExemption'])->name('tax-configurations.exemption-check');
});

// Billing reports and analytics
Route::prefix('billing')->group(function () {
    Route::get('reports/daily', [BillingController::class, 'dailyReport'])->name('billing.reports.daily');
    Route::get('reports/period', [BillingController::class, 'periodReport'])->name('billing.reports.period');
    Route::get('reports/tax', [BillingController::class, 'taxReport'])->name('billing.reports.tax');
    Route::get('analytics/discounts', [BillingController::class, 'discountAnalytics'])->name('billing.analytics.discounts');
    Route::get('analytics/service-charges', [BillingController::class, 'serviceChargeAnalytics'])->name('billing.analytics.service-charges');
});

// Billing settings and configuration
Route::prefix('billing-settings')->group(function () {
    Route::get('/', [BillingController::class, 'getSettings'])->name('billing-settings.get');
    Route::post('/', [BillingController::class, 'updateSettings'])->name('billing-settings.update');
    Route::post('reset', [BillingController::class, 'resetSettings'])->name('billing-settings.reset');
});