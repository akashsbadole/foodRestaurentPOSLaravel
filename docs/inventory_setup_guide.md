# Restaurant POS Inventory Management Setup Guide

## Overview

This guide provides step-by-step instructions for setting up and configuring the inventory management system integration with the restaurant POS system.

## Prerequisites

- Laravel application with restaurant POS system
- MySQL database with existing tables
- Redis for caching and real-time updates
- WebSocket server for real-time notifications
- Appropriate user permissions

## Installation Steps

### 1. Database Setup

Run the following migrations to create the necessary tables:

```bash
php artisan migrate
```

Required migrations include:
- `create_inventory_items_table.php`
- `create_inventory_item_stores_table.php`
- `create_inventory_transactions_table.php`
- `create_inventory_transaction_items_table.php`
- `create_product_batches_table.php`

### 2. Service Registration

Register the inventory services in your `AppServiceProvider`:

```php
// app/Providers/AppServiceProvider.php
public function register()
{
    $this->app->singleton(InventoryManagementService::class);
    $this->app->singleton(RestaurantInventoryIntegrationService::class);
    $this->app->singleton(InventoryAlertService::class);
    $this->app->singleton(InventoryRealTimeService::class);
    $this->app->singleton(InventoryReportingService::class);
}
```

### 3. Route Configuration

Include the inventory API routes in your `routes/api.php`:

```php
// routes/api.php
require __DIR__.'/inventory_api.php';
require __DIR__.'/inventory_reporting_api.php';
```

### 4. Observer Registration

Register the inventory observers in `AppServiceProvider`:

```php
// app/Providers/AppServiceProvider.php
public function boot()
{
    // Register inventory observers
    Product::observe(ProductObserver::class);
    RestaurantOrder::observe(RestaurantOrderObserver::class);
    RestaurantOrderItem::observe(RestaurantOrderItemObserver::class);
}
```

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Inventory Configuration
INVENTORY_CACHE_TTL=3600
INVENTORY_ALERT_ENABLED=true
INVENTORY_REAL_TIME_ENABLED=true
INVENTORY_BATCH_TRACKING=true
INVENTORY_LOW_STOCK_THRESHOLD=10

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=1

# WebSocket Configuration
WEBSOCKET_PORT=6001
WEBSOCKET_HOST=127.0.0.1
```

### 2. Cache Configuration

Configure Redis for inventory caching in `config/cache.php`:

```php
// config/cache.php
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'inventory',
    ],
],
```

Add the inventory Redis connection in `config/database.php`:

```php
// config/database.php
'redis' => [
    'inventory' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '1'),
    ],
],
```

### 3. Queue Configuration

Set up queues for background inventory operations:

```bash
php artisan queue:table
php artisan migrate
```

Configure the queue worker in `config/queue.php`:

```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
        'block_for' => null,
    ],
],
```

## Product Configuration

### 1. Enable Inventory Tracking

Update your products to enable inventory tracking:

```php
// Enable inventory tracking for a product
$product = Product::find(1);
$product->track_inventory = true;
$product->alert_quantity = 10; // Low stock threshold
$product->reorder_point = 20;  // Reorder when stock falls below this
$product->reorder_quantity = 50; // Quantity to reorder
$product->save();
```

### 2. Configure Restaurant-Specific Fields

For restaurant products, configure additional fields:

```php
$product->is_recipe = true; // For complex menu items
$product->shelf_life_days = 7; // For perishable items
$product->allergens = 'gluten,dairy'; // Allergen information
$product->nutritional_info = json_encode([
    'calories' => 250,
    'protein' => 15,
    'carbs' => 30,
    'fat' => 8
]);
$product->kitchen_station = 'grill'; // Kitchen station assignment
$product->prep_time_minutes = 15; // Preparation time
```

### 3. Create Recipe Ingredients

For recipe-based products, define ingredients:

```php
// Create recipe ingredients for a complex menu item
$product = Product::find(1);
$product->recipeIngredients()->createMany([
    [
        'ingredient_product_id' => 2,
        'quantity' => 0.5,
        'unit' => 'kg',
        'is_optional' => false,
    ],
    [
        'ingredient_product_id' => 3,
        'quantity' => 2,
        'unit' => 'pieces',
        'is_optional' => true,
    ],
]);
```

## Stock Initialization

### 1. Create Initial Stock Records

Set up initial stock levels for each store:

```php
// Create initial stock for a product in a store
$productStock = new ProductStockEnhanced();
$productStock->store_id = 1;
$productStock->product_id = 1;
$productStock->quantity = 100;
$productStock->available_quantity = 100;
$productStock->reserved_quantity = 0;
$productStock->location = 'Main Storage';
$productStock->bin_location = 'A1-B2';
$productStock->save();
```

### 2. Create Batch Records

For perishable items, create batch records:

```php
// Create a batch for perishable items
$batch = new ProductBatch();
$batch->product_id = 1;
$batch->batch_number = 'BATCH-2024-001';
$batch->manufacturing_date = now()->subDays(7);
$batch->expiry_date = now()->addDays(23);
$batch->quantity = 50;
$batch->unit_cost = 2.50;
$batch->save();

// Link batch to stock
$productStock->batch_id = $batch->id;
$productStock->save();
```

### 3. Bulk Stock Import

For bulk stock initialization, use the following approach:

```php
// Bulk stock import example
$inventoryService = app(InventoryManagementService::class);

$stockData = [
    [
        'product_id' => 1,
        'quantity' => 100,
        'batch_number' => 'BATCH-001',
        'expiry_date' => '2024-12-31',
        'unit_cost' => 2.50,
    ],
    [
        'product_id' => 2,
        'quantity' => 50,
        'batch_number' => 'BATCH-002',
        'expiry_date' => '2024-12-15',
        'unit_cost' => 1.75,
    ],
];

foreach ($stockData as $stock) {
    $inventoryService->addStock([
        'store_id' => 1,
        'reference_type' => 'purchase',
        'reference_id' => 1, // Purchase ID
        'items' => [$stock],
    ]);
}
```

## Alert Configuration

### 1. Set Up Alert Preferences

Configure user alert preferences:

```php
$user = User::find(1);
$user->alertPreferences()->createMany([
    [
        'alert_type' => 'low_stock',
        'enabled' => true,
        'channels' => ['email', 'in_app'],
        'threshold' => 'medium',
    ],
    [
        'alert_type' => 'expiring',
        'enabled' => true,
        'channels' => ['email', 'sms'],
        'days_before_expiry' => 7,
    ],
]);
```

### 2. Configure Store-Level Alerts

Set up store-specific alert thresholds:

```php
$store = Store::find(1);
$store->alertSettings()->create([
    'low_stock_threshold_percentage' => 20,
    'critical_stock_threshold_percentage' => 10,
    'expiring_alert_days' => 7,
    'auto_reorder_enabled' => true,
    'alert_email_recipients' => ['manager@restaurant.com'],
]);
```

## Real-Time Updates Setup

### 1. WebSocket Server Configuration

Set up the WebSocket server for real-time updates:

```bash
npm install -g laravel-echo-server
```

Create `laravel-echo-server.json` configuration:

```json
{
    "authHost": "http://localhost:8000",
    "authEndpoint": "/broadcasting/auth",
    "clients": [],
    "database": "redis",
    "databaseConfig": {
        "redis": {
            "host": "127.0.0.1",
            "port": "6379",
            "password": null,
            "db": 1
        }
    },
    "devMode": true,
    "host": "127.0.0.1",
    "port": "6001",
    "protocol": "http",
    "socketio": {},
    "sslCertPath": "",
    "sslKeyPath": "",
    "sslCertChainPath": "",
    "sslPassphrase": ""
}
```

Start the WebSocket server:

```bash
laravel-echo-server start
```

### 2. Frontend Integration

Integrate with Laravel Echo for real-time updates:

```javascript
// resources/js/app.js
import Echo from 'laravel-echo';

window.Echo = new Echo({
    broadcaster: 'socket.io',
    host: window.location.hostname + ':6001'
});

// Listen for inventory updates
window.Echo.channel('inventory.store.1')
    .listen('StockUpdated', (e) => {
        console.log('Stock updated:', e.data);
        // Update UI accordingly
    });

window.Echo.channel('inventory.alerts')
    .listen('LowStockAlert', (e) => {
        console.log('Low stock alert:', e.data);
        // Show notification
    });
```

## Queue Workers

### 1. Start Queue Workers

Run queue workers for background inventory operations:

```bash
php artisan queue:work --queue=inventory,default --sleep=3 --tries=3
```

### 2. Supervisor Configuration

Configure Supervisor to keep queue workers running:

```ini
[program:inventory-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/your/project/artisan queue:work --queue=inventory --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/your/project/storage/logs/worker.log
stopwaitsecs=3600
```

## Testing the Setup

### 1. Stock Reservation Test

Test stock reservation functionality:

```php
use App\Services\InventoryManagementService;

$inventoryService = new InventoryManagementService();

$result = $inventoryService->reserveStock([
    'store_id' => 1,
    'order_id' => 1,
    'items' => [
        ['product_id' => 1, 'quantity' => 5, 'batch_preference' => 'fifo']
    ]
]);

if ($result['success']) {
    echo "Stock reserved successfully";
} else {
    echo "Reservation failed: " . $result['message'];
}
```

### 2. Alert Test

Test alert generation:

```php
use App\Services\InventoryAlertService;

$alertService = new InventoryAlertService();

$result = $alertService->checkLowStockAlerts(1);

if ($result['success']) {
    echo "Alerts checked: " . count($result['data']['alerts']) . " alerts found";
}
```

### 3. Real-Time Updates Test

Test real-time updates:

```php
use App\Services\InventoryRealTimeService;

$realTimeService = new InventoryRealTimeService();

$realTimeService->broadcastStockUpdate([
    'product_id' => 1,
    'store_id' => 1,
    'available_quantity' => 45,
    'reserved_quantity' => 5
]);
```

## Monitoring and Maintenance

### 1. Log Monitoring

Monitor inventory operation logs:

```bash
tail -f storage/logs/inventory.log
```

### 2. Performance Monitoring

Monitor Redis performance:

```bash
redis-cli monitor
```

### 3. Database Maintenance

Run regular database maintenance:

```bash
php artisan inventory:cleanup-old-transactions
php artisan inventory:optimize-queries
```

## Troubleshooting

### Common Issues

1. **Stock Not Updating**
   - Check queue workers are running
   - Verify Redis connection
   - Check database transactions

2. **Real-Time Updates Not Working**
   - Verify WebSocket server is running
   - Check Laravel Echo configuration
   - Verify channel permissions

3. **Alerts Not Sending**
   - Check alert preferences
   - Verify email/SMS configuration
   - Check queue processing

### Debug Commands

```bash
# Check queue status
php artisan queue:failed

# Restart queue workers
php artisan queue:restart

# Clear cache
php artisan cache:clear

# Check Redis connection
php artisan tinker
>>> Redis::ping()
```

## Security Considerations

### 1. Permissions

Ensure proper user permissions:

```php
// Grant inventory management permissions
$user->givePermissionTo('manage-inventory');
$user->givePermissionTo('view-inventory-reports');
$user->givePermissionTo('approve-inventory-transfers');
```

### 2. Access Control

Implement store-level access control:

```php
// Check user store access
if (!$user->hasStoreAccess($storeId)) {
    abort(403, 'Access denied');
}
```

### 3. Audit Trail

Enable audit logging:

```php
// Enable audit logging for inventory operations
config(['inventory.audit_enabled' => true]);
```

## Performance Optimization

### 1. Database Indexes

Ensure proper database indexes:

```sql
-- Add indexes for performance
CREATE INDEX idx_product_stocks_store_product ON product_stocks(store_id, product_id);
CREATE INDEX idx_inventory_transactions_store_type ON inventory_transactions(store_id, transaction_type);
CREATE INDEX idx_product_batches_product_expiry ON product_batches(product_id, expiry_date);
```

### 2. Caching Strategy

Implement caching for frequently accessed data:

```php
// Cache stock levels
Cache::put("stock.{$storeId}.{$productId}", $stockLevel, 3600);
```

### 3. Query Optimization

Optimize inventory queries:

```php
// Use eager loading to reduce queries
$stocks = ProductStock::with('product', 'batch')
    ->where('store_id', $storeId)
    ->get();
```

This setup guide provides comprehensive instructions for implementing the inventory management system integration. Follow these steps carefully to ensure proper functionality and performance.