# KOT (Kitchen Order Ticket) Generation System

## Overview

The KOT Generation System is a comprehensive solution for managing kitchen order tickets in the restaurant POS system. It handles the second stage of the order lifecycle: "KOT Generation: Application Tier verifies stock (IMS), generates a KOT → Data sent to the Data Tier (unpaid orders) and to the Kitchen Display System (KDS)".

## Architecture

### Core Components

1. **KOTGenerationService** - Main service for KOT generation logic
2. **KOTPrintService** - Handles KOT printing and export functionality
3. **Enhanced KitchenOrderQueue Model** - Manages KOT lifecycle
4. **Enhanced RestaurantOrder Model** - Triggers and tracks KOTs
5. **Enhanced RestaurantOrderItem Model** - Links items to KOTs
6. **KOT Controller Endpoints** - API and web routes for KOT management

## Features Implemented

### 1. Automatic KOT Generation
- Triggers when order status changes to 'confirmed'
- Generates KOTs for all pending order items
- Verifies stock availability before generation
- Routes items to appropriate kitchen stations

### 2. Stock Verification with IMS Integration
- Checks product stock availability before KOT generation
- Reserves stock when KOT is created
- Creates inventory transactions for stock tracking
- Handles modifier stock requirements

### 3. Station-Based Routing
- Routes items to kitchen stations based on product assignments
- Handles modifier-based routing for complex items
- Balances load across stations
- Falls back to default station when needed

### 4. Priority Handling
- Calculates priority based on order priority, wait time, and order type
- Dynamic priority scoring for queue management
- Urgent order handling for delivery/takeaway
- Automatic priority escalation for overdue items

### 5. KOT Status Tracking
- Complete lifecycle: queued → in_progress → ready → completed
- Real-time status updates
- Preparation time tracking
- Overdue detection and alerts

### 6. KOT Printing/Export
- Thermal printer support
- Text and JSON export formats
- Consolidated KOT printing by station
- Printer connection testing

### 7. Error Handling
- Graceful handling of stock shortages
- KOT regeneration for modified orders
- Comprehensive logging and error reporting
- Transaction rollback on failures

## API Endpoints

### Web Routes (restaurant.kitchen.kot.*)
- `POST /restaurant/kitchen/kot/order/{orderId}/generate` - Generate KOTs for order
- `POST /restaurant/kitchen/kot/item/{orderItemId}/regenerate` - Regenerate KOT for item
- `POST /restaurant/kitchen/kot/{kotId}/print` - Print KOT
- `POST /restaurant/kitchen/kot/order/{orderId}/print-consolidated` - Print consolidated KOTs
- `POST /restaurant/kitchen/kot/{kotId}/verify-stock` - Verify stock for KOT
- `GET /restaurant/kitchen/kot/{kotId}/details` - Get KOT details
- `GET /restaurant/kitchen/kot/{kotId}/export/text` - Export KOT as text
- `GET /restaurant/kitchen/kot/{kotId}/export/json` - Export KOT as JSON
- `GET /restaurant/kitchen/kot/statistics` - Get KOT statistics
- `POST /restaurant/kitchen/kot/test-printer` - Test printer connection

### API Routes (api.v1.kitchen.kot.*)
- All web routes also available as API endpoints
- Requires authentication and rate limiting
- Returns JSON responses

## Database Schema

### kitchen_order_queue Table Enhancements
- `kot_number` - Unique KOT identifier (KOTYYYYMMDDNNNN)
- `printed_at` - When KOT was printed
- `stock_verified` - Whether stock has been verified
- `stock_verified_at` - When stock was verified
- `stock_verified_by` - Who verified the stock

## Model Methods

### KitchenOrderQueue
- `generateKOTNumber()` - Creates unique KOT number
- `markStockVerified()` - Marks stock as verified
- `printKOT()` - Prints KOT to configured printer
- `isOverdue()` - Checks if KOT is overdue
- `getPriorityScore()` - Calculates priority for queue sorting
- `updateStatus()` - Updates KOT status with validation

### RestaurantOrder
- `generateKOTs()` - Triggers KOT generation for all items
- `getKOTs()` - Retrieves all KOTs for order
- `areAllKOTsCompleted()` - Checks if all KOTs are completed
- `cancelPendingKOTs()` - Cancels all pending KOTs
- `getKOTStatistics()` - Returns KOT statistics for order

### RestaurantOrderItem
- `generateKOT()` - Generates KOT for specific item
- `regenerateKOT()` - Regenerates KOT for modified item
- `getKOTSummary()` - Returns comprehensive KOT information
- `getPreparationProgress()` - Calculates preparation progress percentage
- `updateKOTStatus()` - Updates KOT status with validation

## Workflow

### Order Confirmation → KOT Generation
1. Order status changes to 'confirmed'
2. System triggers automatic KOT generation
3. For each pending item:
   - Verifies stock availability
   - Determines appropriate station
   - Calculates estimated preparation time
   - Determines priority level
   - Creates KOT queue entry
   - Reserves stock
   - Updates item status
4. Updates overall order status to 'preparing'

### KOT Preparation Lifecycle
1. **Queued**: KOT created, waiting to start
2. **In Progress**: Kitchen staff starts preparation
3. **Ready**: Item prepared, waiting for serving
4. **Completed**: Item served or picked up
5. **Cancelled**: Item cancelled (stock released)

### Stock Management Integration
1. Stock verification during KOT generation
2. Stock reservation when KOT created
3. Stock consumption when item completed
4. Stock release when KOT cancelled
5. Inventory transaction logging for audit trail

## Error Scenarios

### Stock Shortage
- Detects insufficient stock before KOT generation
- Reports specific shortage details
- Prevents KOT creation for unavailable items
- Allows partial order processing

### Station Unavailable
- Handles missing station assignments
- Routes to fallback stations
- Logs routing errors for review
- Prevents KOT creation without valid station

### Printer Failures
- Graceful handling of printer errors
- Fallback to digital display
- Error logging for troubleshooting
- Manual retry options

## Performance Optimizations

### Efficient Queue Management
- Priority-based sorting for optimal processing
- Load balancing across stations
- Overdue detection and escalation
- Real-time status updates

### Database Optimization
- Indexed queries for fast retrieval
- Eager loading to prevent N+1 problems
- Transaction isolation for data consistency
- Optimized status transitions

## Security Considerations

### Access Control
- Store-based data isolation
- User authentication required
- Role-based permissions
- Audit trail for all actions

### Data Integrity
- Transaction-based operations
- Stock verification constraints
- Status transition validation
- Concurrent modification prevention

## Monitoring and Analytics

### KOT Statistics
- Generation success/failure rates
- Preparation time analytics
- Station performance metrics
- Priority distribution analysis

### Real-time Monitoring
- Queue status tracking
- Overdue KOT alerts
- Station load monitoring
- Stock level warnings

## Testing

### Unit Tests
- KOT generation scenarios
- Stock verification logic
- Station routing algorithms
- Priority calculation tests

### Integration Tests
- End-to-end workflow testing
- Printer integration testing
- Stock management integration
- Error handling validation

## Future Enhancements

### Planned Features
- Mobile KOT display integration
- Voice notification system
- Predictive preparation times
- Automated stock reordering
- Advanced analytics dashboard

### Scalability Considerations
- Multi-location support
- Cloud printer integration
- Real-time synchronization
- Load balancing optimizations

## Configuration

### Printer Setup
- Thermal printer configuration
- Network printer support
- Print template customization
- Fallback printer options

### Station Configuration
- Station-product mapping
- Preparation time settings
- Priority rules configuration
- Load balancing parameters

## Troubleshooting

### Common Issues
1. **KOT not generating**: Check order status and stock availability
2. **Printer not working**: Verify printer connection and configuration
3. **Wrong station routing**: Check product-station assignments
4. **Stock verification failing**: Review inventory setup and stock levels

### Debug Tools
- KOT generation logs
- Stock transaction history
- Printer test utilities
- Status transition tracking

## Conclusion

The KOT Generation System provides a robust, scalable solution for managing kitchen order tickets in a restaurant environment. It integrates seamlessly with the existing POS system while providing comprehensive features for stock management, station routing, priority handling, and real-time tracking.

The system is designed to handle high-volume operations while maintaining data integrity and providing excellent user experience for both kitchen staff and management.