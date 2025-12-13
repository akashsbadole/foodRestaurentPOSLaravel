<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\QuantityController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReloadController;
use App\Http\Controllers\UpgradeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\SalaryRecordController;
use App\Http\Controllers\EmployeeBalanceController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ChequeController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SaleTemplateController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\DevDatabaseController;
use App\Http\Controllers\ChargeController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\BrandSettingController;
use App\Http\Controllers\BrandController;

// Installer routes (must be before auth routes)
require __DIR__ . '/installer.php';

Route::get('/', function () {
    return redirect('login');
})->middleware('check.installed');

Route::get('/editor', function () {
    return Inertia::render('BlockEditor/Editor');
});

Route::get('/receipt/{id}', [SaleController::class, 'receipt'])->name('sales.receipt');
Route::get('/api/receipt-text-raw/{id}', [SaleController::class, 'apiReceipt']);
Route::get('/pending-sales-receipt/{contact_id}', [SaleController::class, 'pendingSalesReceipt']);

Route::get('/version', [UpgradeController::class, 'checkVersion']);
Route::post('/api/application-update', [UpgradeController::class, 'applicationUpdate']);

// V2 Update routes (migration-based)
Route::post('/api/application-update-v2', [UpgradeController::class, 'applicationUpdateV2']);

Route::match(['get', 'post'], '/automation/backup/run', [BackupController::class, 'automation'])
    ->middleware('throttle:5,1')
    ->name('automation.backup');

// Unified Sync API endpoints for offline-first InfoPOS app are now defined in routes/api.php

// Mobile Sales API - For hybrid loading (Firebase + Laravel)
Route::post('/api/sales/exclude', [SaleController::class, 'getSalesExcluding'])->name('sales.exclude');

// Store config endpoint
// Route::get('/api/stores/{storeId}', [SyncController::class, 'getStoreConfig']);

Route::middleware(['auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/summary', [DashboardController::class, 'getDashboardSummary'])->name('dashboard.summary');
    Route::post('/dashboard/sold-items-summary', [DashboardController::class, 'getSoldItemsSummary']);

    Route::get('/stores', [StoreController::class, 'index'])->name('store');
    Route::post('/store', [StoreController::class, 'store']);
    Route::post('/store/{id}', [StoreController::class, 'update']);
    Route::post('/change-store', [StoreController::class, 'changeSelectedStore'])->name('change.store');

    Route::get('/collections', [CollectionController::class, 'index'])->name('collection');
    Route::post('/collection', [CollectionController::class, 'store']);
    Route::post('/collection/{id}', [CollectionController::class, 'update']);
    Route::delete('/collections/{id}', [CollectionController::class, 'destroy']);
    Route::post('/collections/quick-create', [CollectionController::class, 'quickCreate'])->name('collections.quick-create');

    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::get('/products/{id}/edit', [ProductController::class, 'find'])->name('products.find');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::post('/products/{id}', [ProductController::class, 'update'])->name('products.update');
    Route::get('/products/search', [ProductController::class, 'searchProduct'])->name('products.search');
    Route::post('/storebatch', [ProductController::class, 'storeNewBatch'])->name('products.newbatch');
    Route::post('/checkBatch', [ProductController::class, 'checkBatch'])->name('products.checkbatch');
    Route::post('/productbatch/{id}', [ProductController::class, 'updateBatch'])->name('products.updatebatch');
    Route::post('/productbatch/{batch_id}/toggle-featured', [ProductController::class, 'toggleFeatured'])->name('products.toggle-featured');
    Route::delete('/productbatch/{batch_id}', [ProductController::class, 'deleteBatch'])->name('products.delete-batch');
    Route::get('/getproducts/{store_id}', [ProductController::class, 'getProductsResponse'])->name('products.getproducts');
    Route::get('/product/{batch_id}/barcode', [ProductController::class, 'getBarcode'])->name('products.barcode');
    Route::get('/product/{batch_id}/barcode-v2', [ProductController::class, 'barcodeV2'])->name('products.barcode-v2');
    Route::get('/api/products/{product_id}/batches', [ProductController::class, 'getBatches'])->name('products.getBatches');

    Route::get('/pos', [POSController::class, 'index'])->name('pos.index');
    Route::get('/restaurant-pos', [POSController::class, 'restaurantIndex'])->name('restaurant.pos.index');
    Route::get('/pos/{sale_id}/return', [POSController::class, 'returnIndex'])->name('pos.return');
    Route::post('/pos/checkout', [POSController::class, 'checkout'])->name('pos.checkout');
    Route::get('/pos/customer-display', [POSController::class, 'customerDisplay']);
    Route::post('/pos/filter', [POSController::class, 'getProductsByFilter']);
    Route::get('/pos/{id}/edit', [POSController::class, 'editSale'])->name('pos.edit');

    Route::get('/customers', [ContactController::class, 'index'])->defaults('type', 'customer')->name('customers.index');
    Route::get('/vendors', [ContactController::class, 'index'])->defaults('type', 'vendor')->name('vendors.index');
    Route::post('/contact', [ContactController::class, 'store'])->name('contacts.store');
    Route::post('/contact/{id}', [ContactController::class, 'update'])->name('contacts.update');

    Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
    Route::get('/sold-items', [SaleController::class, 'solditems'])->name('sales.items');
    Route::get('/sold-items-summary', [SaleController::class, 'soldItemSummary'])->name('sales.items.summary');
    Route::delete('/sales/{id}', [SaleController::class, 'destroy'])->name('sales.destroy');
    Route::get('/sale-notification/{id}', [SaleController::class, 'sendNotification']);

    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/purchase/create', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchase/store', [PurchaseController::class, 'store'])->name('purchases.store');

    Route::post('/quantity/store', [QuantityController::class, 'store'])->name('quantity.store');
    Route::get('/quantity/{stock_id}/log', [QuantityController::class, 'getAdjustmentsLog']);

    Route::post('/customer-transaction', [TransactionController::class, 'storeCustomerTransaction']);
    Route::post('/vendor-transaction', [TransactionController::class, 'storeVendorTransaction']);
    Route::get('/payments/{type}', [TransactionController::class, 'viewPayments']); //It will be purchases or sales

    Route::post('/getpayments/{type}', [TransactionController::class, 'findPayments']); //It will be purchases or sales
    Route::post('/delete-payment/{type}', [TransactionController::class, 'deletePayment']); //It will be purchases or sales
    Route::post('/getorderdetails/{type}', [ReportController::class, 'viewOrderDetails']); //It will be purchases or sales

    Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
    Route::post('/settings-update', [SettingController::class, 'update'])->name('settings.update');
    Route::get('/settings/quote-template', [SettingController::class, 'quoteTemplate']);
    Route::get('/settings/receipt-template', [SettingController::class, 'receiptTemplate']);
    Route::get('/settings/barcode-template', [SettingController::class, 'barcodeTemplate']);
    Route::post('/settings/save-template', [SettingController::class, 'updateTemplate']);
    Route::get('/settings/custom-css', [SettingController::class, 'customCSS']);
    Route::post('/settings/custom-css', [SettingController::class, 'updateCustomCSS']);
    Route::post('/settings/module/{action}', [SettingController::class, 'updateModule']);
    Route::post('/settings/get-template', [SettingController::class, 'getTemplate'])->name('settings.gettemplate');
    Route::post('/settings/save-template', [SettingController::class, 'saveTemplate'])->name('settings.savetemplate');

    // Brand Settings Routes (Legacy)
    Route::get('/settings/brand', [BrandSettingController::class, 'index'])->name('brand.settings.index');
    Route::post('/settings/brand', [BrandSettingController::class, 'update'])->name('brand.settings.update');
    Route::post('/settings/brand/logo', [BrandSettingController::class, 'uploadLogo'])->name('brand.settings.upload-logo');

    // Enhanced Brand Management Routes
    Route::prefix('brands')->name('brands.')->group(function () {
        Route::get('/', [BrandController::class, 'index'])->name('index');
        Route::get('/create', [BrandController::class, 'create'])->name('create');
        Route::post('/', [BrandController::class, 'store'])->name('store');
        Route::get('/{brand}', [BrandController::class, 'show'])->name('show');
        Route::get('/{brand}/edit', [BrandController::class, 'edit'])->name('edit');
        Route::put('/{brand}', [BrandController::class, 'update'])->name('update');
        Route::delete('/{brand}', [BrandController::class, 'destroy'])->name('destroy');
        
        // Theme Builder
        Route::get('/{brand}/theme-builder', [BrandController::class, 'themeBuilder'])->name('theme-builder');
        Route::post('/{brand}/preview', [BrandController::class, 'preview'])->name('preview');
        
        // Industry Templates
        Route::get('/industry-templates/{industryType}', [BrandController::class, 'getIndustryTemplates'])->name('industry-templates');
        
        // Export/Import
        Route::get('/{brand}/export', [BrandController::class, 'export'])->name('export');
        Route::post('/import', [BrandController::class, 'import'])->name('import');
        
        // Multi-brand Support
        Route::post('/switch', [BrandController::class, 'switchBrand'])->name('switch');
        
        // Theme CSS
        Route::get('/theme/{brandKey?}.css', [BrandController::class, 'getThemeCSS'])->name('theme.css');
    });

    Route::get('/api/barcode-template', [SettingController::class, 'getBarcodeTemplate'])->name('barcode.template.get');
    Route::post('/api/barcode-template', [SettingController::class, 'saveBarcodeTemplate'])->name('barcode.template.save');
    Route::post('/api/barcode-template/preview', [SettingController::class, 'renderBarcodeTemplatePreview'])->name('barcode.template.preview');

    Route::get('/charges', [ChargeController::class, 'index'])->name('charges.index');
    Route::post('/charges', [ChargeController::class, 'store'])->name('charges.store');
    Route::put('/charges/{charge}', [ChargeController::class, 'update'])->name('charges.update');
    Route::delete('/charges/{charge}', [ChargeController::class, 'destroy'])->name('charges.destroy');
    Route::get('/api/charges/active', [ChargeController::class, 'getActive'])->name('charges.active');
    Route::get('/api/charges/default', [ChargeController::class, 'getDefault'])->name('charges.default');

    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('/expense', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::post('/expense/{id}/delete', [ExpenseController::class, 'delete'])->name('expenses.delete');

    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/employee', [EmployeeController::class, 'store'])->name('employees.store');
    Route::post('/employee/{id}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::post('/employee/{id}/delete', [EmployeeController::class, 'delete'])->name('employees.delete');

    Route::get('/payroll', [SalaryRecordController::class, 'index'])->name('payroll.dashboard');
    Route::get('/payroll/process-payment', [SalaryRecordController::class, 'processPayment'])->name('payroll.process.payment');
    Route::get('/payroll/salary-adjustments', [SalaryRecordController::class, 'salaryAdjustments'])->name('payroll.salary-adjustments');
    Route::get('/payroll/adjustments/history', [SalaryRecordController::class, 'adjustmentsHistory'])->name('payroll.adjustments.history');
    Route::post('/salary-records', [SalaryRecordController::class, 'store']);
    Route::post('/salary/{id}/delete', [SalaryRecordController::class, 'delete']);
    Route::post('/salary-adjustments', [SalaryRecordController::class, 'storeAdjustment'])->name('payroll.adjustments.store');
    Route::put('/salary-adjustments/{id}', [SalaryRecordController::class, 'updateAdjustment'])->name('payroll.adjustments.update');
    Route::delete('/salary-adjustments/{id}', [SalaryRecordController::class, 'deleteAdjustment'])->name('payroll.adjustments.delete');
    Route::get('/payroll/reports', [SalaryRecordController::class, 'reportsIndex'])->name('payroll.reports.index');
    Route::get('/payroll/reports/monthly', [SalaryRecordController::class, 'monthlyReport'])->name('payroll.reports.monthly');
    Route::get('/payroll/reports/ytd', [SalaryRecordController::class, 'ytdReport'])->name('payroll.reports.ytd');
    Route::get('/payroll/reports/employee/{id}', [SalaryRecordController::class, 'employeeReport'])->name('payroll.reports.employee');
    Route::get('/payroll/export/current-month', [SalaryRecordController::class, 'exportCurrentMonth'])->name('payroll.export.current-month');
    Route::get('/payroll/export/quarterly', [SalaryRecordController::class, 'exportQuarterly'])->name('payroll.export.quarterly');
    Route::get('/payroll/export/yearly', [SalaryRecordController::class, 'exportYearly'])->name('payroll.export.yearly');
    Route::get('/payroll/export/all', [SalaryRecordController::class, 'exportAll'])->name('payroll.export.all');

    Route::post('/employee-balance', [EmployeeBalanceController::class, 'store']);
    Route::get('/employee-balance-log', [EmployeeBalanceController::class, 'balanceLog']);

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/user', [UserController::class, 'store'])->name('user.store');
    Route::get('/user/role', [UserController::class, 'userRole'])->name('user.role');
    Route::post('/user/role', [UserController::class, 'storeRole'])->name('user.storeRole');
    Route::post('/user/{roleId}/role', [UserController::class, 'updateRole'])->name('user.updateRole');
    Route::post('/user/{id}', [UserController::class, 'update'])->name('user.update');
    Route::post('/users/{id}/deactivate', [UserController::class, 'userDeactivate'])->name('user.deactivate');

    // Route::get('reports/daily',[ReportController::class, 'getDailyReport'])->name('reports.daily');
    Route::get('reports/dailycash', [ReportController::class, 'getDailyCashReport'])->name('reports.dailycash');
    Route::post('reports/dailycash', [ReportController::class, 'storeDailyCashReport'])->name('reports.store.dailycash');
    Route::get('reports/sales', [ReportController::class, 'getSalesReport'])->name('reports.sales');
    Route::get('reports/{customer}/customer-pending', [ReportController::class, 'getCustomerPendingReport']);
    Route::get('reports/{vendor}/vendor-pending', [ReportController::class, 'getVendorPendingReport']);
    Route::get('reports/{id}/customer', [ReportController::class, 'getCustomerReport'])->name('reports.customer');
    Route::get('reports/{id}/vendor', [ReportController::class, 'getVendorReport'])->name('reports.vendor');
    Route::get('reports/summary-report', [ReportController::class, 'getSummaryReport'])->name('reports.summary');

    Route::get('/reloads', [ReloadController::class, 'index']);
    Route::post('/reloads/{id}/update', [ReloadController::class, 'update']);

    Route::get('/link-storage', function () {
        Artisan::call('storage:link');
        return 'Linked with storage';
    });

    // Maintenance Routes
    Route::get('/maintenance', [UpgradeController::class, 'showMaintenance'])->name('maintenance.index');
    Route::post('/upload-v2', [UpgradeController::class, 'handleUploadV2'])->name('maintenance.upload');
Route::get('/update', [UpgradeController::class, 'showUploadForm'])->name('upload.form');
    Route::post('/upload', [UpgradeController::class, 'handleUpload'])->name('upload.handle');
    
    // Database Management Routes
    Route::get('/api/maintenance/database/tables', [UpgradeController::class, 'getDatabaseTables']);
    Route::get('/api/maintenance/database/migrations', [UpgradeController::class, 'getMigrationStatus']);
    Route::post('/api/maintenance/database/migrate', [UpgradeController::class, 'runMigrations']);
    Route::post('/api/maintenance/database/seed', [UpgradeController::class, 'runSeeders']);
    Route::get('/api/maintenance/database/backup', [UpgradeController::class, 'backupDatabase']);

    Route::get('/media', [MediaController::class, 'index']);
    Route::get('/migrate-images', [MediaController::class, 'migrateImages']);
    Route::post('/optimize-image', [MediaController::class, 'optimizeImages']);

    Route::get('/cheques', [ChequeController::class, 'index'])->name('cheques.index');
    Route::post('/cheques/store', [ChequeController::class, 'store'])->name('cheques.store');
    Route::post('/cheques/{cheque}/update', [ChequeController::class, 'update'])->name('cheques.update');
    Route::post('/cheques/{cheque}/destroy', [ChequeController::class, 'destroy'])->name('cheques.destroy');

    Route::post('/quotations', [QuotationController::class, 'store'])->name('quotations.store');
    Route::get('/quotations', [QuotationController::class, 'index'])->name('quotations.index');
    Route::post('/quotations/{quotation}', [QuotationController::class, 'destroy'])->name('quotations.destroy');
    Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show');

    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory-items', [InventoryController::class, 'store'])->name('inventory.store');
    Route::post('/inventory-items/{id}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::delete('/inventory-items/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
    Route::post('/inventory-single-transaction', [InventoryController::class, 'inventorySingleTransactionStore']);
    Route::get('/inventory-purchase', [InventoryController::class, 'inventoryPurchase']);
    Route::post('/inventory-purchase', [InventoryController::class, 'inventoryPurchaseStore']);
    Route::get('/inventory-logs', [InventoryController::class, 'inventoryLogs']);

    Route::resource('sale-templates', SaleTemplateController::class);

    Route::get('/clear-cache', function () {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
        Artisan::call('event:clear');
        Artisan::call('optimize:clear');

        return 'All caches cleared and configurations updated!';
    });

    Route::get('/check-update', function () {
        return 'Update';
    });

    Route::get('/api/backups', [BackupController::class, 'listBackups'])->name('backups.list');
    Route::delete('/api/backups/{file}', [BackupController::class, 'deleteBackup'])
        ->where('file', '[A-Za-z0-9._-]+')
        ->name('backups.delete');
    Route::get('/download-backup/{file}', [BackupController::class, 'download'])->name('backups.download');
    Route::get('/backup-now', [BackupController::class, 'downloadBackupZip'])->name('backups.download-now');

    Route::post('/test-mail', function (Request $request) {
        Mail::raw('Test email', function ($message) use ($request) {
            $message->to($request->input('test_mail'))->subject('Mail received');
        });
        return 'Mail sent';
    });

    // Restaurant Management Routes
    Route::prefix('restaurant')->name('restaurant.')->group(function () {
        // Restaurant Dashboard and Main Routes
        Route::get('/dashboard', [RestaurantController::class, 'dashboard'])->name('dashboard');
        Route::get('/floor-plan', [RestaurantController::class, 'floorPlan'])->name('floor-plan');
        Route::get('/statistics', [RestaurantController::class, 'getStatistics'])->name('statistics');
        Route::get('/live-status', [RestaurantController::class, 'getLiveStatus'])->name('live-status');
        Route::get('/quick-actions', [RestaurantController::class, 'getQuickActions'])->name('quick-actions');
        Route::get('/shift-management', [RestaurantController::class, 'shiftManagement'])->name('shift-management');
        
        // Table Management Routes
        Route::prefix('tables')->name('tables.')->group(function () {
            Route::get('/', [TableController::class, 'index'])->name('index');
            Route::get('/create', [TableController::class, 'create'])->name('create');
            Route::post('/', [TableController::class, 'store'])->name('store');
            Route::get('/{id}/edit', [TableController::class, 'edit'])->name('edit');
            Route::put('/{id}', [TableController::class, 'update'])->name('update');
            Route::delete('/{id}', [TableController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/status', [TableController::class, 'updateStatus'])->name('update-status');
            Route::get('/available', [TableController::class, 'getAvailableTables'])->name('available');
            Route::get('/{id}/details', [TableController::class, 'getTableDetails'])->name('details');
            Route::post('/positions', [TableController::class, 'updatePositions'])->name('update-positions');
            Route::get('/statistics', [TableController::class, 'getStatistics'])->name('statistics');
        });
        
        // Kitchen Display Routes
        Route::prefix('kitchen')->name('kitchen.')->group(function () {
            Route::get('/dashboard', [KitchenController::class, 'dashboard'])->name('dashboard');
            Route::get('/station/{stationId}', [KitchenController::class, 'station'])->name('station');
            Route::post('/queue/{queueId}/start', [KitchenController::class, 'startPreparation'])->name('start-preparation');
            Route::post('/queue/{queueId}/ready', [KitchenController::class, 'markAsReady'])->name('mark-ready');
            Route::post('/queue/{queueId}/complete', [KitchenController::class, 'complete'])->name('complete');
            Route::post('/queue/add', [KitchenController::class, 'addToQueue'])->name('add-to-queue');
            Route::post('/queue/{queueId}/priority', [KitchenController::class, 'updatePriority'])->name('update-priority');
            Route::get('/statistics', [KitchenController::class, 'getStatistics'])->name('statistics');
            Route::get('/queue-status', [KitchenController::class, 'getQueueStatus'])->name('queue-status');
            Route::get('/stations', [KitchenController::class, 'getStations'])->name('stations');
        });
        
        // Reservation Management Routes
        Route::prefix('reservations')->name('reservations.')->group(function () {
            Route::get('/', [ReservationController::class, 'index'])->name('index');
            Route::get('/create', [ReservationController::class, 'create'])->name('create');
            Route::post('/', [ReservationController::class, 'store'])->name('store');
            Route::get('/{id}/edit', [ReservationController::class, 'edit'])->name('edit');
            Route::put('/{id}', [ReservationController::class, 'update'])->name('update');
            Route::delete('/{id}', [ReservationController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/status', [ReservationController::class, 'updateStatus'])->name('update-status');
            Route::get('/available-slots', [ReservationController::class, 'getAvailableSlots'])->name('available-slots');
            Route::get('/upcoming', [ReservationController::class, 'getUpcoming'])->name('upcoming');
            Route::get('/statistics', [ReservationController::class, 'getStatistics'])->name('statistics');
        });
        
        // Order Management Routes
        Route::prefix('orders')->name('orders.')->group(function () {
            Route::get('/', [OrderController::class, 'index'])->name('index');
            Route::get('/create', [OrderController::class, 'create'])->name('create');
            Route::post('/', [OrderController::class, 'store'])->name('store');
            Route::get('/{id}', [OrderController::class, 'show'])->name('show');
            Route::put('/{id}', [OrderController::class, 'update'])->name('update');
            Route::post('/{id}/status', [OrderController::class, 'updateStatus'])->name('update-status');
            Route::post('/{id}/add-item', [OrderController::class, 'addItem'])->name('add-item');
            Route::put('/{orderId}/items/{itemId}', [OrderController::class, 'updateItem'])->name('update-item');
            Route::delete('/{orderId}/items/{itemId}', [OrderController::class, 'removeItem'])->name('remove-item');
            Route::post('/{id}/split', [OrderController::class, 'splitOrder'])->name('split');
            Route::post('/{id}/cancel', [OrderController::class, 'cancel'])->name('cancel');
            Route::get('/statistics', [OrderController::class, 'getStatistics'])->name('statistics');
        });
    });
});

require __DIR__ . '/auth.php';
