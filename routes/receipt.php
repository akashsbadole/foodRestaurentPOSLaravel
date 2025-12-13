<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReceiptController;

// Receipt routes
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Restaurant receipt routes
    Route::get('/receipt/restaurant/{orderId}/{template?}', [ReceiptController::class, 'showRestaurantReceipt'])
        ->name('receipt.restaurant.show');
    
    Route::get('/receipt/split-bill/{splitId}/{template?}', [ReceiptController::class, 'showSplitBillReceipt'])
        ->name('receipt.split-bill.show');
    
    // Receipt generation and formatting
    Route::post('/receipt/generate', [ReceiptController::class, 'generateReceipt'])
        ->name('receipt.generate');
    
    Route::post('/receipt/print', [ReceiptController::class, 'printReceipt'])
        ->name('receipt.print');
    
    Route::post('/receipt/reprint', [ReceiptController::class, 'reprintReceipt'])
        ->name('receipt.reprint');
    
    // Digital receipt
    Route::get('/receipt/digital/{token}', [ReceiptController::class, 'getDigitalReceipt'])
        ->name('receipt.digital');
    
    // Receipt sharing
    Route::post('/receipt/share', [ReceiptController::class, 'shareReceipt'])
        ->name('receipt.share');
    
    Route::post('/receipt/share-qr', [ReceiptController::class, 'generateShareQR'])
        ->name('receipt.share-qr');
    
    // Receipt history and analytics
    Route::get('/receipt/history', [ReceiptController::class, 'getReceiptHistory'])
        ->name('receipt.history');
    
    Route::get('/receipt/analytics', [ReceiptController::class, 'getReceiptAnalytics'])
        ->name('receipt.analytics');
    
    // Receipt templates
    Route::get('/receipt/templates', [ReceiptController::class, 'getReceiptTemplates'])
        ->name('receipt.templates');
});

// Public routes (no auth required)
Route::get('/receipt/digital/{token}', [ReceiptController::class, 'getDigitalReceipt'])
    ->name('receipt.digital.public');

// API routes for receipt functionality
Route::prefix('api')->middleware(['api'])->group(function () {
    Route::post('/receipt/generate', [ReceiptController::class, 'generateReceipt']);
    Route::post('/receipt/print', [ReceiptController::class, 'printReceipt']);
    Route::post('/receipt/reprint', [ReceiptController::class, 'reprintReceipt']);
    Route::post('/receipt/share', [ReceiptController::class, 'shareReceipt']);
    Route::post('/receipt/share-qr', [ReceiptController::class, 'generateShareQR']);
    Route::get('/receipt/templates', [ReceiptController::class, 'getReceiptTemplates']);
    Route::get('/receipt/history', [ReceiptController::class, 'getReceiptHistory']);
    Route::get('/receipt/analytics', [ReceiptController::class, 'getReceiptAnalytics']);
});

// Feedback routes
Route::prefix('feedback')->group(function () {
    Route::get('/{orderId}', function ($orderId) {
        return view('restaurant.feedback', ['orderId' => $orderId]);
    })->name('feedback.form');
    
    Route::post('/{orderId}', [ReceiptController::class, 'submitFeedback'])
        ->name('feedback.submit');
});

// Digital wallet routes
Route::prefix('wallet')->group(function () {
    Route::get('/add/{walletType}', function ($walletType) {
        return view('wallet.add', ['walletType' => $walletType]);
    })->name('wallet.add.form');
    
    Route::post('/add/{walletType}', [ReceiptController::class, 'addToWallet'])
        ->name('wallet.add');
});