# Restaurant POS Inventory Management Integration Documentation

## Overview

This document provides comprehensive documentation for the inventory management system integration with the restaurant POS system. The integration ensures proper stock management throughout the entire order lifecycle, from order entry to payment completion.

## Architecture

### Core Services

1. **InventoryManagementService** - Core inventory operations
2. **RestaurantInventoryIntegrationService** - Restaurant-specific inventory integration
3. **InventoryAlertService** - Alerting and notification system
4. **InventoryRealTimeService** - Real-time updates and broadcasting
5. **InventoryReportingService** - Comprehensive reporting and analytics

### Enhanced Models

1. **ProductEnhanced** - Extended product model with restaurant-specific fields
2. **ProductStockEnhanced** - Detailed stock tracking with reservations
3. **RestaurantOrderItemEnhanced** - Order items with inventory tracking
4. **InventoryTransaction** - Transaction records with full audit trail
5. **ProductBatch** - Batch tracking for perishable items

## Integration Points

### 1. Order Entry Phase

**Service:** `InventoryManagementService::reserveStock()`
**Trigger:** When order is created or items are added to cart
**Process:**
- Validate stock availability
- Reserve stock using FIFO/FEFO logic
- Create inventory reservation transaction
- Update available/reserved quantities

```php
// Example usage
$inventoryService = new InventoryManagementService();
$result = $inventoryService->reserveStock([
    'store_id' => 1,
    'order_id' => 123,
    'items' => [
        ['product_id' => 456, 'quantity' => 2, 'batch_preference' => 'fifo'],
        ['product_id' => 789, 'quantity' => 1, 'batch_preference' => 'fefo']
    ]
]);
```

### 2. Order Modification Phase

**Service:** `InventoryManagementService::adjustReservation()`
**Trigger:** When order items are modified or quantities change
**Process:**
- Release previously reserved stock
- Reserve new quantities
- Handle batch changes
- Update transaction records

### 3. Payment Completion Phase

**Service:** `RestaurantInventoryIntegrationService::processOrderPayment()`
**Trigger:** When order payment is confirmed
**Process:**
- Convert reservations to actual deductions
- Handle recipe-based stock deduction
- Track waste and spoilage
- Update batch usage
- Calculate food costs

### 4. Order Cancellation Phase

**Service:** `InventoryManagementService::releaseReservation()`
**Trigger:** When order is cancelled
**Process:**
- Release all reserved stock
- Update available quantities
- Log cancellation reason
- Send notifications if needed

## API Endpoints

### Stock Management

```
POST /api/inventory/stock/reserve
POST /api/inventory/stock/release
POST /api/inventory/stock/deduct
POST /api/inventory/stock/add
POST /api/inventory/stock/transfer
GET  /api/inventory/stock/availability
GET  /api/inventory/stock/real-time-updates
```

### Restaurant Integration

```
POST /api/inventory/restaurant/order-stock
POST /api/inventory/restaurant/modifier-stock
POST /api/inventory/restaurant/recipe-deduction
GET  /api/inventory/restaurant/ingredient-usage
```

### Alerts Management

```
GET  /api/inventory/alerts/low-stock
GET  /api/inventory/alerts/expiring
GET  /api/inventory/alerts/reorder-suggestions
POST /api/inventory/alerts/custom
GET  /api/inventory/alerts/preferences
```

### Reporting

```
GET  /api/inventory/reports/valuation
GET  /api/inventory/reports/food-cost
GET  /api/inventory/reports/waste
GET  /api/inventory/reports/turnover
GET  /api/inventory/reports/usage
GET  /api/inventory/reports/variance
GET  /api/inventory/reports/dashboard
POST /api/inventory/reports/export
```

## Validation Rules

### Stock Reservation Validation

- Order must be in valid status (pending, confirmed, preparing)
- Stock must be available for reservation
- Products must have inventory tracking enabled
- Batch preferences must be valid
- No duplicate reservations for same order

### Stock Transfer Validation

- User must have permissions for both source and destination stores
- Sufficient stock must be available at source
- Transfer reason must be valid
- Approval requirements must be met
- Batch ownership must be validated

### General Inventory Validation

- Store must exist and be accessible
- Products must exist and track inventory
- Quantities must be positive
- Batch information must be consistent
- Business rules must be enforced

## Real-Time Updates

### WebSocket Events

The system broadcasts real-time updates for:

1. **Stock Level Changes**
   ```javascript
   {
     event: 'stock.updated',
     data: {
       product_id: 123,
       store_id: 1,
       available_quantity: 45.5,
       reserved_quantity: 5.0,
       batch_number: 'BATCH-001'
     }
   }
   ```

2. **Low Stock Alerts**
   ```javascript
   {
     event: 'alert.low_stock',
     data: {
       product_id: 123,
       store_id: 1,
       current_stock: 5,
       alert_threshold: 10,
       severity: 'high'
     }
   }
   ```

3. **Expiration Warnings**
   ```javascript
   {
     event: 'alert.expiring',
     data: {
       product_id: 456,
       batch_number: 'BATCH-002',
       expiry_date: '2024-12-20',
       days_until_expiry: 7,
       quantity: 25
     }
   }
   ```

### Subscription Management

Users can subscribe to specific inventory updates:

```javascript
// Subscribe to store-specific updates
socket.emit('subscribe', {
  channel: 'inventory.store.1',
  events: ['stock.updated', 'alert.low_stock']
});

// Subscribe to product-specific updates
socket.emit('subscribe', {
  channel: 'inventory.product.123',
  events: ['stock.updated', 'alert.expiring']
});
```

## Batch Management

### FIFO (First In, First Out)

- Used for standard inventory rotation
- Oldest batches are used first
- Default for most products

### FEFO (First Expired, First Out)

- Used for perishable items
- Items closest to expiration are used first
- Automatically calculated based on expiry dates

### Batch Tracking

- Each batch has unique identifier
- Tracks manufacturing date, expiry date, and quantity
- Supports partial batch usage
- Maintains batch integrity across transfers

## Recipe-Based Stock Deduction

### Complex Menu Items

For menu items with multiple ingredients:

```php
// Example recipe structure
$recipe = [
    'main_product_id' => 123,
    'ingredients' => [
        ['product_id' => 456, 'quantity' => 0.5, 'unit' => 'kg'],
        ['product_id' => 789, 'quantity' => 2, 'unit' => 'pieces'],
        ['product_id' => 101, 'quantity' => 0.1, 'unit' => 'liter']
    ]
];
```

### Ingredient-Level Tracking

- Each ingredient stock is deducted separately
- Maintains accurate cost calculation
- Handles ingredient substitutions
- Tracks waste at ingredient level

## Alert System

### Alert Types

1. **Low Stock Alerts**
   - Triggered when stock falls below threshold
   - Severity levels: low, medium, high, critical
   - Automatic reorder suggestions

2. **Expiration Alerts**
   - Triggered based on days until expiry
   - Configurable warning periods
   - Batch-specific notifications

3. **Waste Alerts**
   - Unusual waste patterns
   - Spoilage rate monitoring
   - Cost impact analysis

### Notification Channels

- In-app notifications
- Email alerts
- SMS notifications (critical alerts)
- Push notifications (mobile app)

## Reporting System

### Key Reports

1. **Inventory Valuation Report**
   - Total stock value by category
   - Low stock and out of stock items
   - Expiring items analysis
   - Overstock identification

2. **Food Cost Analysis**
   - Food cost percentage by item
   - Profit margin analysis
   - Cost trends over time
   - Recipe cost breakdown

3. **Waste and Spoilage Report**
   - Waste value and quantity
   - Waste by reason category
   - Spoilage trends
   - Cost impact analysis

4. **Inventory Turnover Report**
   - Turnover ratios by product
   - Days of supply calculation
   - Fast/slow moving items
   - Dead stock identification

### Export Capabilities

- CSV export for all reports
- Custom date ranges
- Filtered data export
- Scheduled report generation

## Error Handling

### Common Error Scenarios

1. **Insufficient Stock**
   ```json
   {
     "success": false,
     "message": "Insufficient stock for product ID 123. Available: 5, Requested: 10",
     "error_code": "INSUFFICIENT_STOCK",
     "data": {
       "product_id": 123,
       "available_quantity": 5,
       "requested_quantity": 10
     }
   }
   ```

2. **Invalid Batch**
   ```json
   {
     "success": false,
     "message": "Specified batch does not exist or has no available stock",
     "error_code": "INVALID_BATCH",
     "data": {
       "batch_number": "BATCH-001",
       "product_id": 456
     }
   }
   ```

3. **Permission Denied**
   ```json
   {
     "success": false,
     "message": "You do not have permission to perform this inventory operation",
     "error_code": "PERMISSION_DENIED",
     "data": {
       "required_permission": "manage-inventory",
       "store_id": 1
     }
   }
   ```

## Performance Considerations

### Database Optimization

- Indexed queries on product_id, store_id, and batch_id
- Optimized stock calculation queries
- Efficient transaction logging
- Batch processing for bulk operations

### Caching Strategy

- Redis caching for real-time stock levels
- Cached product information
- Alert threshold caching
- Report data caching

### Queue System

- Background processing for inventory updates
- Alert notification queuing
- Report generation jobs
- Batch operation processing

## Security Considerations

### Access Control

- Role-based permissions for inventory operations
- Store-specific access restrictions
- Audit trail for all inventory changes
- Sensitive operation approvals

### Data Integrity

- Transaction rollback on errors
- Concurrent update handling
- Data validation at all levels
- Backup and recovery procedures

## Testing Strategy

### Unit Tests

- Service method testing
- Validation rule testing
- Business logic verification
- Error scenario handling

### Integration Tests

- API endpoint testing
- Database interaction testing
- Real-time update testing
- Cross-service integration

### Performance Tests

- Load testing for high-volume operations
- Concurrent user testing
- Database performance testing
- Memory usage optimization

## Deployment Considerations

### Environment Setup

- Database migrations for new tables
- Redis configuration for caching
- WebSocket server setup
- Queue worker configuration

### Monitoring

- Inventory operation metrics
- Alert system performance
- Real-time update latency
- Report generation performance

### Maintenance

- Regular data cleanup
- Archive old transactions
- Optimize database indexes
- Monitor system health

## Future Enhancements

### Planned Features

1. **AI-Powered Forecasting**
   - Predictive inventory needs
   - Seasonal demand analysis
   - Automatic reorder optimization

2. **Mobile App Integration**
   - Mobile inventory management
   - Barcode scanning
   - Offline mode support

3. **Advanced Analytics**
   - Inventory optimization algorithms
   - Cost reduction suggestions
   - Performance benchmarking

### Scalability Improvements

- Microservices architecture
- Distributed inventory management
- Multi-region support
- Advanced caching strategies

## Conclusion

This comprehensive inventory management integration provides robust stock management capabilities for the restaurant POS system. The integration ensures real-time stock visibility, proactive alerting, and comprehensive reporting while maintaining data integrity and performance.

The modular architecture allows for easy extension and customization, while the comprehensive validation and error handling ensure reliable operation in production environments.