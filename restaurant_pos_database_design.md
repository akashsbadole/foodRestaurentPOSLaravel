# Restaurant POS Database Schema Extensions

## Overview
This document outlines the database schema extensions needed to transform the existing InfoShop POS system into a comprehensive restaurant POS system for full-service restaurants with table service, waiters, and comprehensive kitchen operations.

## New Tables for Restaurant Functionality

### 1. restaurant_tables
Manages restaurant table information and status

```sql
CREATE TABLE `restaurant_tables` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `table_number` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 4,
  `section_id` BIGINT UNSIGNED NULL COMMENT 'Reference to table_sections',
  `shape` ENUM('rectangle', 'circle', 'square', 'oval') DEFAULT 'rectangle',
  `position_x` DECIMAL(8,2) DEFAULT 0 COMMENT 'X position for floor plan',
  `position_y` DECIMAL(8,2) DEFAULT 0 COMMENT 'Y position for floor plan',
  `width` DECIMAL(8,2) DEFAULT 100 COMMENT 'Width for floor plan',
  `height` DECIMAL(8,2) DEFAULT 100 COMMENT 'Height for floor plan',
  `status` ENUM('available', 'occupied', 'reserved', 'cleaning', 'maintenance') DEFAULT 'available',
  `current_order_id` BIGINT UNSIGNED NULL COMMENT 'Currently active order',
  `reserved_until` DATETIME NULL,
  `notes` TEXT NULL,
  `store_id` BIGINT UNSIGNED NOT NULL,
  `created_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `restaurant_tables_status_index` (`status`),
  INDEX `restaurant_tables_section_id_index` (`section_id`),
  INDEX `restaurant_tables_store_id_index` (`store_id`),
  FOREIGN KEY (`section_id`) REFERENCES `table_sections` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. table_sections
Manages restaurant sections/zones

```sql
CREATE TABLE `table_sections` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `store_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `table_sections_store_id_index` (`store_id`),
  FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. restaurant_orders
Extended order management for restaurant operations

```sql
CREATE TABLE `restaurant_orders` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `sale_id` BIGINT UNSIGNED NULL COMMENT 'Link to sales table when order is paid',
  `table_id` BIGINT UNSIGNED NOT NULL,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `order_type` ENUM('dine_in', 'takeaway', 'delivery') NOT NULL DEFAULT 'dine_in',
  `customer_count` INT DEFAULT 1,
  `waiter_id` BIGINT UNSIGNED NULL COMMENT 'Assigned waiter/staff',
  `status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') DEFAULT 'pending',
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  `special_instructions` TEXT NULL,
  `estimated_time` INT NULL COMMENT 'Estimated preparation time in minutes',
  `actual_time` INT NULL COMMENT 'Actual preparation time in minutes',
  `subtotal` DECIMAL(10,2) DEFAULT 0,
  `tax_amount` DECIMAL(10,2) DEFAULT 0,
  `discount_amount` DECIMAL(10,2) DEFAULT 0,
  `service_charge` DECIMAL(10,2) DEFAULT 0,
  `total_amount` DECIMAL(10,2) DEFAULT 0,
  `order_date` DATE NOT NULL,
  `order_time` TIME NOT NULL,
  `completed_at` TIMESTAMP NULL,
  `store_id` BIGINT UNSIGNED NOT NULL,
  `created_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `restaurant_orders_table_id_index` (`table_id`),
  INDEX `restaurant_orders_status_index` (`status`),
  INDEX `restaurant_orders_order_type_index` (`order_type`),
  INDEX `restaurant_orders_order_date_index` (`order_date`),
  INDEX `restaurant_orders_store_id_index` (`store_id`),
  FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. restaurant_order_items
Detailed order items with modifiers and preparation notes

```sql
CREATE TABLE `restaurant_order_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `batch_id` BIGINT UNSIGNED NULL,
  `quantity` DECIMAL(10,2) NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `unit_cost` DECIMAL(10,2) NULL,
  `discount` DECIMAL(10,2) DEFAULT 0,
  `status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled') DEFAULT 'pending',
  `special_instructions` TEXT NULL,
  `preparation_notes` TEXT NULL COMMENT 'Notes for kitchen staff',
  `course_number` INT DEFAULT 1 COMMENT 'Course sequence for multi-course meals',
  `is_complimentary` BOOLEAN DEFAULT FALSE,
  `void_reason` TEXT NULL,
  `kitchen_printed` BOOLEAN DEFAULT FALSE,
  `kitchen_printed_at` TIMESTAMP NULL,
  `served_by` BIGINT UNSIGNED NULL COMMENT 'Staff who served this item',
  `served_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `restaurant_order_items_order_id_index` (`order_id`),
  INDEX `restaurant_order_items_product_id_index` (`product_id`),
  INDEX `restaurant_order_items_status_index` (`status`),
  FOREIGN KEY (`order_id`) REFERENCES `restaurant_orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`served_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5. menu_modifiers
Product modification options (extra cheese, no onions, etc.)

```sql
CREATE TABLE `menu_modifiers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `modifier_type` ENUM('addition', 'removal', 'substitution', 'preference') NOT NULL,
  `price_adjustment` DECIMAL(10,2) DEFAULT 0 COMMENT 'Additional cost for this modifier',
  `price_adjustment_type` ENUM('fixed', 'percentage') DEFAULT 'fixed',
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `store_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `menu_modifiers_type_index` (`modifier_type`),
  INDEX `menu_modifiers_store_id_index` (`store_id`),
  FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6. menu_modifier_groups
Groups of modifiers (e.g., "Choose one: Rice/Pasta/Potato")

```sql
CREATE TABLE `menu_modifier_groups` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `selection_type` ENUM('single', 'multiple', 'optional') NOT NULL DEFAULT 'optional',
  `min_selections` INT DEFAULT 0,
  `max_selections` INT DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `store_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `menu_modifier_groups_store_id_index` (`store_id`),
  FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 7. menu_modifier_group_items
Links modifier groups to specific modifiers

```sql
CREATE TABLE `menu_modifier_group_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `modifier_group_id` BIGINT UNSIGNED NOT NULL,
  `modifier_id` BIGINT UNSIGNED NOT NULL,
  `price_adjustment` DECIMAL(10,2) DEFAULT 0 COMMENT 'Override default modifier price for this group',
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `menu_modifier_group_items_group_index` (`modifier_group_id`),
  INDEX `menu_modifier_group_items_modifier_index` (`modifier_id`),
  FOREIGN KEY (`modifier_group_id`) REFERENCES `menu_modifier_groups` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`modifier_id`) REFERENCES `menu_modifiers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8. product_modifier_groups
Links products to available modifier groups

```sql
CREATE TABLE `product_modifier_groups` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `modifier_group_id` BIGINT UNSIGNED NOT NULL,
  `is_required` BOOLEAN DEFAULT FALSE,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `product_modifier_groups_product_index` (`product_id`),
  INDEX `product_modifier_groups_group_index` (`modifier_group_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`modifier_group_id`) REFERENCES `menu_modifier_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. restaurant_order_item_modifiers
Specific modifiers applied to order items

```sql
CREATE TABLE `restaurant_order_item_modifiers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_item_id` BIGINT UNSIGNED NOT NULL,
  `modifier_id` BIGINT UNSIGNED NOT NULL,
  `quantity` DECIMAL(10,2) DEFAULT 1,
  `price_adjustment` DECIMAL(10,2) DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `restaurant_order_item_modifiers_item_index` (`order_item_id`),
  INDEX `restaurant_order_item_modifiers_modifier_index` (`modifier_id`),
  FOREIGN KEY (`order_item_id`) REFERENCES `restaurant_order_items` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`modifier_id`) REFERENCES `menu_modifiers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 10. kitchen_stations
Kitchen preparation stations (grill, bar, salad station, etc.)

```sql
CREATE TABLE `kitchen_stations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `printer_name` VARCHAR(100) NULL COMMENT 'Kitchen printer identifier',
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `store_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `kitchen_stations_store_id_index` (`store_id`),
  FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 11. kitchen_station_items
Links products to their preparation stations

```sql
CREATE TABLE `kitchen_station_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `station_id` BIGINT UNSIGNED NOT NULL,
  `preparation_time` INT DEFAULT 0 COMMENT 'Standard preparation time in minutes',
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `kitchen_station_items_product_index` (`product_id`),
  INDEX `kitchen_station_items_station_index` (`station_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`station_id`) REFERENCES `kitchen_stations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4_unicode_ci;
```

### 12. kitchen_order_queue
Kitchen display system queue

```sql
CREATE TABLE `kitchen_order_queue` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_item_id` BIGINT UNSIGNED NOT NULL,
  `station_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('queued', 'in_progress', 'ready', 'completed', 'cancelled') DEFAULT 'queued',
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  `estimated_time` INT NULL COMMENT 'Estimated completion time in minutes',
  `started_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  `completed_by` BIGINT UNSIGNED NULL COMMENT 'Kitchen staff who completed',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `kitchen_order_queue_station_index` (`station_id`),
  INDEX `kitchen_order_queue_status_index` (`status`),
  INDEX `kitchen_order_queue_priority_index` (`priority`),
  FOREIGN KEY (`order_item_id`) REFERENCES `restaurant_order_items` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`station_id`) REFERENCES `kitchen_stations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 13. order_splits
Split billing functionality

```sql
CREATE TABLE `order_splits` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `split_type` ENUM('equal', 'item_based', 'amount_based') NOT NULL,
  `split_count` INT NOT NULL DEFAULT 1,
  `split_number` INT NOT NULL DEFAULT 1,
  `contact_id` BIGINT UNSIGNED NULL COMMENT 'Customer for this split',
  `subtotal` DECIMAL(10,2) DEFAULT 0,
  `tax_amount` DECIMAL(10,2) DEFAULT 0,
  `discount_amount` DECIMAL(10,2) DEFAULT 0,
  `service_charge` DECIMAL(10,2) DEFAULT 0,
  `total_amount` DECIMAL(10,2) DEFAULT 0,
  `paid_amount` DECIMAL(10,2) DEFAULT 0,
  `status` ENUM('pending', 'partial_paid', 'paid') DEFAULT 'pending',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `order_splits_order_index` (`order_id`),
  INDEX `order_splits_contact_index` (`contact_id`),
  FOREIGN KEY (`order_id`) REFERENCES `restaurant_orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 14. order_split_items
Items assigned to each split

```sql
CREATE TABLE `order_split_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `split_id` BIGINT UNSIGNED NOT NULL,
  `order_item_id` BIGINT UNSIGNED NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `order_split_items_split_index` (`split_id`),
  INDEX `order_split_items_order_item_index` (`order_item_id`),
  FOREIGN KEY (`split_id`) REFERENCES `order_splits` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_item_id`) REFERENCES `restaurant_order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 15. table_reservations
Table reservation management

```sql
CREATE TABLE `table_reservations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `table_id` BIGINT UNSIGNED NOT NULL,
  `contact_id` BIGINT UNSIGNED NULL,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_phone` VARCHAR(20) NULL,
  `reservation_date` DATE NOT NULL,
  `reservation_time` TIME NOT NULL,
  `duration_minutes` INT DEFAULT 120,
  `party_size` INT NOT NULL,
  `status` ENUM('confirmed', 'seated', 'completed', 'cancelled', 'no_show') DEFAULT 'confirmed',
  `special_requests` TEXT NULL,
  `deposit_amount` DECIMAL(10,2) DEFAULT 0,
  `deposit_paid` BOOLEAN DEFAULT FALSE,
  `notes` TEXT NULL,
  `created_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `table_reservations_table_index` (`table_id`),
  INDEX `table_reservations_contact_index` (`contact_id`),
  INDEX `table_reservations_date_time_index` (`reservation_date`, `reservation_time`),
  INDEX `table_reservations_status_index` (`status`),
  FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Modifications to Existing Tables

### 1. sales table extensions

```sql
ALTER TABLE `sales`
  ADD COLUMN `restaurant_order_id` BIGINT UNSIGNED NULL COMMENT 'Link to restaurant_orders table' AFTER `id`,
  ADD COLUMN `order_type` ENUM('retail', 'restaurant') NOT NULL DEFAULT 'retail' AFTER `sale_type`,
  ADD COLUMN `tip_amount` DECIMAL(10,2) DEFAULT 0 AFTER `total_amount`,
  ADD COLUMN `tip_method` ENUM('cash', 'card', 'split') NULL AFTER `tip_amount`,
  ADD COLUMN `service_charge_amount` DECIMAL(10,2) DEFAULT 0 AFTER `tip_amount`,
  ADD INDEX `sales_restaurant_order_id_index` (`restaurant_order_id`),
  ADD INDEX `sales_order_type_index` (`order_type`),
  ADD FOREIGN KEY (`restaurant_order_id`) REFERENCES `restaurant_orders` (`id`) ON DELETE SET NULL;
```

### 2. sale_items table extensions

```sql
ALTER TABLE `sale_items`
  ADD COLUMN `restaurant_order_item_id` BIGINT UNSIGNED NULL COMMENT 'Link to restaurant_order_items table' AFTER `id`,
  ADD COLUMN `course_number` INT DEFAULT 1 AFTER `quantity`,
  ADD COLUMN `special_instructions` TEXT NULL AFTER `description`,
  ADD COLUMN `preparation_notes` TEXT NULL AFTER `special_instructions`,
  ADD COLUMN `served_by` BIGINT UNSIGNED NULL AFTER `created_by`,
  ADD COLUMN `served_at` TIMESTAMP NULL AFTER `served_by`,
  ADD INDEX `sale_items_restaurant_order_item_id_index` (`restaurant_order_item_id`),
  ADD FOREIGN KEY (`restaurant_order_item_id`) REFERENCES `restaurant_order_items` (`id`) ON DELETE SET NULL,
  ADD FOREIGN KEY (`served_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
```

### 3. products table extensions

```sql
ALTER TABLE `products`
  ADD COLUMN `product_category` ENUM('food', 'beverage', 'merchandise', 'service') NOT NULL DEFAULT 'food' AFTER `product_type`,
  ADD COLUMN `preparation_time` INT DEFAULT 0 COMMENT 'Standard preparation time in minutes' AFTER `alert_quantity`,
  ADD COLUMN `is_kitchen_item` BOOLEAN DEFAULT TRUE COMMENT 'Whether this item requires kitchen preparation' AFTER `preparation_time`,
  ADD COLUMN `allergen_info` JSON NULL COMMENT 'Allergen information' AFTER `meta_data`,
  ADD COLUMN `nutritional_info` JSON NULL COMMENT 'Nutritional information' AFTER `allergen_info`,
  ADD COLUMN `spice_level` ENUM('none', 'mild', 'medium', 'hot', 'extra_hot') DEFAULT 'none' AFTER `nutritional_info`,
  ADD COLUMN `is_available` BOOLEAN DEFAULT TRUE COMMENT 'Item availability for restaurant' AFTER `is_active`,
  ADD INDEX `products_product_category_index` (`product_category`),
  ADD INDEX `products_is_kitchen_item_index` (`is_kitchen_item`),
  ADD INDEX `products_is_available_index` (`is_available`);
```

### 4. users table extensions

```sql
ALTER TABLE `users`
  ADD COLUMN `employee_role` ENUM('manager', 'waiter', 'kitchen', 'host', 'cashier', 'bartender') NULL AFTER `user_role`,
  ADD COLUMN `can_take_orders` BOOLEAN DEFAULT FALSE AFTER `is_active`,
  ADD COLUMN `can_process_payments` BOOLEAN DEFAULT FALSE AFTER `can_take_orders`,
  ADD COLUMN `can_manage_tables` BOOLEAN DEFAULT FALSE AFTER `can_process_payments`,
  ADD COLUMN `kitchen_station_id` BIGINT UNSIGNED NULL AFTER `can_manage_tables`,
  ADD INDEX `users_employee_role_index` (`employee_role`),
  ADD FOREIGN KEY (`kitchen_station_id`) REFERENCES `kitchen_stations` (`id`) ON DELETE SET NULL;
```

## Relationships Summary

```
restaurant_tables
├── belongs_to table_sections
├── belongs_to stores
├── has_many restaurant_orders
└── has_many table_reservations

restaurant_orders
├── belongs_to restaurant_tables
├── belongs_to users (waiter)
├── belongs_to stores
├── has_many restaurant_order_items
├── has_many order_splits
└── belongs_to sales (when paid)

restaurant_order_items
├── belongs_to restaurant_orders
├── belongs_to products
├── belongs_to product_batches
├── has_many restaurant_order_item_modifiers
├── has_many order_split_items
└── has_many kitchen_order_queue

menu_modifiers
├── belongs_to stores
├── belongs_to many menu_modifier_groups
└── has_many restaurant_order_item_modifiers

menu_modifier_groups
├── belongs_to stores
├── has_many menu_modifier_group_items
├── has_many product_modifier_groups

kitchen_stations
├── belongs_to stores
├── has_many kitchen_station_items
├── has_many kitchen_order_queue
└── has_many users

order_splits
├── belongs_to restaurant_orders
├── belongs_to contacts
└── has_many order_split_items
```

## Data Integrity Considerations

1. **Cascade Operations**: Most relationships use CASCADE DELETE to maintain data integrity
2. **Soft Deletes**: Important tables like orders and reservations should implement soft deletes
3. **Status Constraints**: Enum fields ensure consistent status tracking
4. **Timestamps**: All tables include created_at and updated_at for audit trails
5. **Foreign Key Constraints**: Referential integrity maintained throughout the schema

## Performance Considerations

1. **Indexing Strategy**: Strategic indexes on frequently queried columns (status, dates, foreign keys)
2. **Composite Indexes**: Multi-column indexes for common query patterns
3. **Partitioning**: Consider partitioning large tables like restaurant_orders by date
4. **Query Optimization**: Schema designed to minimize JOIN operations for common queries