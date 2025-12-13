<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\Store;
use App\Models\User;
use App\Models\Contact;
use App\Models\Employee;
use App\Models\SalaryRecord;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transaction;
use App\Models\Restaurant\TableSection;
use App\Models\Restaurant\RestaurantTable;
use App\Models\Restaurant\KitchenStation;
use App\Models\Restaurant\MenuModifierGroup;
use App\Models\Restaurant\MenuModifier;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\RestaurantOrderItemModifier;
use App\Models\Restaurant\TableReservation;

class RestaurantPOSDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $store = Store::first();
        
        if (!$store) {
            $this->command->warn('No store found. Please create a store first.');
            return;
        }

        DB::beginTransaction();
        try {
            $this->command->info('Seeding Restaurant POS Data...');
            
            // 1. Restaurant Setup Data
            $this->seedTableSections($store);
            $this->seedRestaurantTables($store);
            $this->seedKitchenStations($store);
            
            // 2. Menu Data
            $this->seedProductCategories($store);
            $this->seedProducts($store);
            $this->seedMenuModifiers($store);
            
            // 3. Employee Data
            $this->seedEmployees($store);
            $this->seedSalaryRecords($store);
            
            // 4. Inventory Data
            $this->seedInventoryItems($store);
            $this->seedProductBatches($store);
            $this->seedInventoryTransactions($store);
            
            // 5. Customer Data
            $this->seedCustomers($store);
            
            // 6. Order and Sales Data
            $this->seedRestaurantOrders($store);
            $this->seedSales($store);
            
            // 7. Reservation Data
            $this->seedTableReservations($store);
            
            DB::commit();
            $this->command->info('Restaurant POS Data seeded successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error seeding Restaurant POS Data: ' . $e->getMessage());
        }
    }

    private function seedTableSections($store)
    {
        // Only create sections if they don't exist
        $existingSections = TableSection::where('store_id', $store->id)->pluck('name')->toArray();
        
        $sections = [
            ['name' => 'Indoor', 'description' => 'Main indoor dining area', 'store_id' => $store->id],
            ['name' => 'Outdoor', 'description' => 'Outdoor seating with garden view', 'store_id' => $store->id],
            ['name' => 'VIP', 'description' => 'Exclusive VIP dining area', 'store_id' => $store->id],
            ['name' => 'Bar', 'description' => 'Bar and lounge area', 'store_id' => $store->id],
        ];

        foreach ($sections as $sectionData) {
            if (!in_array($sectionData['name'], $existingSections)) {
                TableSection::create($sectionData);
            }
        }
    }

    private function seedRestaurantTables($store)
    {
        $indoorSection = TableSection::where('name', 'Indoor')->first() ?: TableSection::where('name', 'Main Dining')->first();
        $outdoorSection = TableSection::where('name', 'Outdoor')->first() ?: TableSection::where('name', 'Outdoor Patio')->first();
        $vipSection = TableSection::where('name', 'VIP')->first() ?: TableSection::where('name', 'Private Dining')->first();
        $barSection = TableSection::where('name', 'Bar')->first() ?: TableSection::where('name', 'Bar Area')->first();

        // Only create tables if they don't exist
        $existingTableNumbers = RestaurantTable::where('store_id', $store->id)->pluck('table_number')->toArray();
        
        $tables = [
            // Indoor Tables - using different numbers to avoid conflicts
            ['table_number' => 'T11', 'name' => 'Table 11', 'capacity' => 2, 'section_id' => $indoorSection->id, 'shape' => 'circle', 'position_x' => 50, 'position_y' => 50, 'store_id' => $store->id],
            ['table_number' => 'T12', 'name' => 'Table 12', 'capacity' => 4, 'section_id' => $indoorSection->id, 'shape' => 'rectangle', 'position_x' => 150, 'position_y' => 50, 'store_id' => $store->id],
            ['table_number' => 'T13', 'name' => 'Table 13', 'capacity' => 4, 'section_id' => $indoorSection->id, 'shape' => 'rectangle', 'position_x' => 250, 'position_y' => 50, 'store_id' => $store->id],
            ['table_number' => 'T14', 'name' => 'Table 14', 'capacity' => 6, 'section_id' => $indoorSection->id, 'shape' => 'rectangle', 'position_x' => 50, 'position_y' => 150, 'store_id' => $store->id],
            ['table_number' => 'T15', 'name' => 'Table 15', 'capacity' => 6, 'section_id' => $indoorSection->id, 'shape' => 'rectangle', 'position_x' => 150, 'position_y' => 150, 'store_id' => $store->id],
            ['table_number' => 'T16', 'name' => 'Table 16', 'capacity' => 8, 'section_id' => $indoorSection->id, 'shape' => 'rectangle', 'position_x' => 250, 'position_y' => 150, 'store_id' => $store->id],
            
            // Outdoor Tables - using different numbers to avoid conflicts
            ['table_number' => 'O11', 'name' => 'Patio 11', 'capacity' => 4, 'section_id' => $outdoorSection->id, 'shape' => 'square', 'position_x' => 50, 'position_y' => 250, 'store_id' => $store->id],
            ['table_number' => 'O12', 'name' => 'Patio 12', 'capacity' => 4, 'section_id' => $outdoorSection->id, 'shape' => 'square', 'position_x' => 150, 'position_y' => 250, 'store_id' => $store->id],
            ['table_number' => 'O13', 'name' => 'Garden 11', 'capacity' => 6, 'section_id' => $outdoorSection->id, 'shape' => 'rectangle', 'position_x' => 50, 'position_y' => 350, 'store_id' => $store->id],
            ['table_number' => 'O14', 'name' => 'Garden 12', 'capacity' => 6, 'section_id' => $outdoorSection->id, 'shape' => 'rectangle', 'position_x' => 150, 'position_y' => 350, 'store_id' => $store->id],
            
            // VIP Tables - using different numbers to avoid conflicts
            ['table_number' => 'V11', 'name' => 'VIP Room 11', 'capacity' => 10, 'section_id' => $vipSection->id, 'shape' => 'rectangle', 'position_x' => 50, 'position_y' => 450, 'store_id' => $store->id],
            ['table_number' => 'V12', 'name' => 'VIP Room 12', 'capacity' => 12, 'section_id' => $vipSection->id, 'shape' => 'rectangle', 'position_x' => 150, 'position_y' => 450, 'store_id' => $store->id],
            
            // Bar Tables - using different numbers to avoid conflicts
            ['table_number' => 'B11', 'name' => 'Bar Seat 11', 'capacity' => 2, 'section_id' => $barSection->id, 'shape' => 'circle', 'position_x' => 50, 'position_y' => 550, 'store_id' => $store->id],
            ['table_number' => 'B12', 'name' => 'Bar Seat 12', 'capacity' => 2, 'section_id' => $barSection->id, 'shape' => 'circle', 'position_x' => 100, 'position_y' => 550, 'store_id' => $store->id],
            ['table_number' => 'B13', 'name' => 'Bar Seat 13', 'capacity' => 2, 'section_id' => $barSection->id, 'shape' => 'circle', 'position_x' => 150, 'position_y' => 550, 'store_id' => $store->id],
            ['table_number' => 'B14', 'name' => 'Bar Table 11', 'capacity' => 4, 'section_id' => $barSection->id, 'shape' => 'square', 'position_x' => 50, 'position_y' => 600, 'store_id' => $store->id],
        ];

        foreach ($tables as $tableData) {
            if (!in_array($tableData['table_number'], $existingTableNumbers)) {
                RestaurantTable::create($tableData);
            }
        }
    }

    private function seedKitchenStations($store)
    {
        // Only create stations if they don't exist
        $existingStations = KitchenStation::where('store_id', $store->id)->pluck('name')->toArray();
        
        $stations = [
            ['name' => 'Grill', 'description' => 'Grilling and BBQ station', 'printer_name' => 'Grill_Printer', 'is_active' => true, 'display_order' => 1, 'store_id' => $store->id],
            ['name' => 'Bar', 'description' => 'Beverage and cocktail station', 'printer_name' => 'Bar_Printer', 'is_active' => true, 'display_order' => 2, 'store_id' => $store->id],
            ['name' => 'Appetizer', 'description' => 'Cold appetizers and salads', 'printer_name' => 'Appetizer_Printer', 'is_active' => true, 'display_order' => 3, 'store_id' => $store->id],
            ['name' => 'Dessert', 'description' => 'Desserts and sweets preparation', 'printer_name' => 'Dessert_Printer', 'is_active' => true, 'display_order' => 4, 'store_id' => $store->id],
            ['name' => 'Main Course', 'description' => 'Main course preparation', 'printer_name' => 'Main_Printer', 'is_active' => true, 'display_order' => 5, 'store_id' => $store->id],
        ];

        foreach ($stations as $stationData) {
            if (!in_array($stationData['name'], $existingStations)) {
                KitchenStation::create($stationData);
            }
        }
    }

    private function seedProductCategories($store)
    {
        // Note: This assumes there's a product_categories table
        // If not implemented, products will be created without categories
        $categories = [
            ['name' => 'Appetizers', 'description' => 'Starters and small bites', 'store_id' => $store->id],
            ['name' => 'Main Course', 'description' => 'Main dishes and entrees', 'store_id' => $store->id],
            ['name' => 'Beverages', 'description' => 'Drinks and refreshments', 'store_id' => $store->id],
            ['name' => 'Desserts', 'description' => 'Sweet endings', 'store_id' => $store->id],
            ['name' => 'Soups', 'description' => 'Hot and cold soups', 'store_id' => $store->id],
            ['name' => 'Salads', 'description' => 'Fresh and healthy salads', 'store_id' => $store->id],
        ];

        // This would need to be adjusted based on the actual product categories implementation
        // For now, we'll proceed without creating categories
    }

    private function seedProducts($store)
    {
        $grillStation = KitchenStation::where('name', 'Grill')->first();
        $barStation = KitchenStation::where('name', 'Bar')->first();
        $appetizerStation = KitchenStation::where('name', 'Appetizer')->first();
        $dessertStation = KitchenStation::where('name', 'Dessert')->first();
        $mainCourseStation = KitchenStation::where('name', 'Main Course')->first();

        $products = [
            // Appetizers
            ['name' => 'Spring Rolls', 'description' => 'Crispy vegetable spring rolls with sweet chili sauce', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 15, 'is_kitchen_item' => true, 'station_id' => $appetizerStation->id, 'price' => 8.99],
            ['name' => 'Garlic Bread', 'description' => 'Toasted bread with garlic butter and herbs', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 10, 'is_kitchen_item' => true, 'station_id' => $appetizerStation->id, 'price' => 6.99],
            ['name' => 'Caesar Salad', 'description' => 'Romaine lettuce, parmesan, croutons, caesar dressing', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 12, 'is_kitchen_item' => true, 'station_id' => $appetizerStation->id, 'price' => 9.99],
            ['name' => 'Tomato Soup', 'description' => 'Creamy tomato soup with basil', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 15, 'is_kitchen_item' => true, 'station_id' => $mainCourseStation->id, 'price' => 7.99],
            
            // Main Course
            ['name' => 'Grilled Salmon', 'description' => 'Atlantic salmon with lemon butter sauce', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 25, 'is_kitchen_item' => true, 'station_id' => $grillStation->id, 'price' => 24.99],
            ['name' => 'Ribeye Steak', 'description' => '12oz ribeye with mashed potatoes and vegetables', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 30, 'is_kitchen_item' => true, 'station_id' => $grillStation->id, 'price' => 32.99],
            ['name' => 'Chicken Parmesan', 'description' => 'Breaded chicken with marinara and mozzarella', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 20, 'is_kitchen_item' => true, 'station_id' => $mainCourseStation->id, 'price' => 22.99],
            ['name' => 'Vegetable Pasta', 'description' => 'Pasta with seasonal vegetables in olive oil', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 18, 'is_kitchen_item' => true, 'station_id' => $mainCourseStation->id, 'price' => 18.99],
            ['name' => 'Fish and Chips', 'description' => 'Beer battered cod with french fries', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 20, 'is_kitchen_item' => true, 'station_id' => $grillStation->id, 'price' => 19.99],
            
            // Beverages
            ['name' => 'Coca Cola', 'description' => 'Classic cola drink', 'product_type' => 'simple', 'product_category' => 'beverage', 'is_active' => true, 'is_available' => true, 'preparation_time' => 5, 'is_kitchen_item' => false, 'station_id' => $barStation->id, 'price' => 2.99],
            ['name' => 'Orange Juice', 'description' => 'Fresh squeezed orange juice', 'product_type' => 'simple', 'product_category' => 'beverage', 'is_active' => true, 'is_available' => true, 'preparation_time' => 5, 'is_kitchen_item' => false, 'station_id' => $barStation->id, 'price' => 4.99],
            ['name' => 'Coffee', 'description' => 'Freshly brewed coffee', 'product_type' => 'simple', 'product_category' => 'beverage', 'is_active' => true, 'is_available' => true, 'preparation_time' => 8, 'is_kitchen_item' => false, 'station_id' => $barStation->id, 'price' => 3.99],
            ['name' => 'Lemonade', 'description' => 'Fresh lemonade with mint', 'product_type' => 'simple', 'product_category' => 'beverage', 'is_active' => true, 'is_available' => true, 'preparation_time' => 5, 'is_kitchen_item' => false, 'station_id' => $barStation->id, 'price' => 3.49],
            ['name' => 'Red Wine', 'description' => 'House red wine', 'product_type' => 'simple', 'product_category' => 'beverage', 'is_active' => true, 'is_available' => true, 'preparation_time' => 5, 'is_kitchen_item' => false, 'station_id' => $barStation->id, 'price' => 8.99],
            ['name' => 'Beer', 'description' => 'Local craft beer', 'product_type' => 'simple', 'product_category' => 'beverage', 'is_active' => true, 'is_available' => true, 'preparation_time' => 5, 'is_kitchen_item' => false, 'station_id' => $barStation->id, 'price' => 5.99],
            
            // Desserts
            ['name' => 'Chocolate Cake', 'description' => 'Rich chocolate cake with ganache', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 10, 'is_kitchen_item' => true, 'station_id' => $dessertStation->id, 'price' => 7.99],
            ['name' => 'Ice Cream Sundae', 'description' => 'Vanilla ice cream with toppings', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 8, 'is_kitchen_item' => true, 'station_id' => $dessertStation->id, 'price' => 6.99],
            ['name' => 'Tiramisu', 'description' => 'Classic Italian dessert', 'product_type' => 'simple', 'product_category' => 'food', 'is_active' => true, 'is_available' => true, 'preparation_time' => 12, 'is_kitchen_item' => true, 'station_id' => $dessertStation->id, 'price' => 8.99],
        ];

        foreach ($products as $productData) {
            $stationId = $productData['station_id'];
            $price = $productData['price'];
            unset($productData['station_id'], $productData['price']);
            
            $product = Product::create(array_merge($productData, [
                'sku' => 'PROD-' . strtoupper(str_replace(' ', '', $productData['name'])),
                'unit' => 'pcs',
                'quantity' => 100,
                'alert_quantity' => 10,
                'is_stock_managed' => true,
                'meta_data' => json_encode(['preparation_time' => $productData['preparation_time']]),
                'allergen_info' => json_encode(['contains' => ['gluten', 'dairy']]),
                'nutritional_info' => json_encode(['calories' => rand(150, 500), 'protein' => rand(10, 30)]),
                'spice_level' => 'none',
            ]));
            
            // Assign to kitchen station
            if ($stationId) {
                // Skip kitchen station assignment for now to avoid table issues
                // $station = KitchenStation::find($stationId);
                // $station->products()->attach($product->id, ['preparation_time' => $productData['preparation_time'], 'display_order' => 0]);
            }
            
            // Create a product batch with price
            ProductBatch::create([
                'product_id' => $product->id,
                'batch_number' => $product->sku . '-BATCH-001',
                'expiry_date' => Carbon::now()->addDays(180),
                'cost' => $price * 0.6, // 40% margin
                'price' => $price,
                'is_active' => true,
                'is_featured' => false,
                'discount' => 0,
                'discount_percentage' => 0,
            ]);
        }
    }

    private function seedMenuModifiers($store)
    {
        // Only create modifier groups if they don't exist
        $existingGroups = MenuModifierGroup::where('store_id', $store->id)->pluck('name')->toArray();
        
        $modifierGroups = [
            ['name' => 'Cooking Preference', 'description' => 'How would you like your food cooked?', 'selection_type' => 'single', 'min_selections' => 1, 'max_selections' => 1, 'store_id' => $store->id],
            ['name' => 'Spice Level', 'description' => 'How spicy would you like it?', 'selection_type' => 'single', 'min_selections' => 0, 'max_selections' => 1, 'store_id' => $store->id],
            ['name' => 'Extra Ingredients', 'description' => 'Add extra ingredients to your dish', 'selection_type' => 'multiple', 'min_selections' => 0, 'max_selections' => 5, 'store_id' => $store->id],
            ['name' => 'Side Dishes', 'description' => 'Choose your side dishes', 'selection_type' => 'multiple', 'min_selections' => 0, 'max_selections' => 2, 'store_id' => $store->id],
        ];

        foreach ($modifierGroups as $groupData) {
            if (!in_array($groupData['name'], $existingGroups)) {
                MenuModifierGroup::create($groupData);
            }
        }

        // Get or create modifier groups
        $cookingGroup = MenuModifierGroup::where('name', 'Cooking Preference')->first() ?: MenuModifierGroup::where('name', 'Temperature')->first();
        $spiceGroup = MenuModifierGroup::where('name', 'Spice Level')->first();
        $extraGroup = MenuModifierGroup::where('name', 'Extra Ingredients')->first();
        $sideGroup = MenuModifierGroup::where('name', 'Side Dishes')->first();

        // Only create modifiers if they don't exist
        $existingModifiers = MenuModifier::where('store_id', $store->id)->pluck('name')->toArray();

        $modifiers = [
            // Cooking preference
            ['name' => 'Rare', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Medium Rare', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Medium', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Medium Well', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Well Done', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            
            // Spice level
            ['name' => 'No Spice', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Mild', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Hot', 'modifier_type' => 'preference', 'price_adjustment' => 0.75, 'store_id' => $store->id],
            ['name' => 'Extra Hot', 'modifier_type' => 'preference', 'price_adjustment' => 1.00, 'store_id' => $store->id],
            
            // Extra ingredients
            ['name' => 'Extra Cheese', 'modifier_type' => 'addition', 'price_adjustment' => 1.50, 'store_id' => $store->id],
            ['name' => 'Extra Bacon', 'modifier_type' => 'addition', 'price_adjustment' => 2.00, 'store_id' => $store->id],
            ['name' => 'Extra Mushrooms', 'modifier_type' => 'addition', 'price_adjustment' => 1.25, 'store_id' => $store->id],
            ['name' => 'Extra Onions', 'modifier_type' => 'addition', 'price_adjustment' => 0.75, 'store_id' => $store->id],
            ['name' => 'Extra Sauce', 'modifier_type' => 'addition', 'price_adjustment' => 0.50, 'store_id' => $store->id],
            
            // Side dishes
            ['name' => 'Rice', 'modifier_type' => 'substitution', 'price_adjustment' => 2.50, 'store_id' => $store->id],
        ];

        foreach ($modifiers as $modifierData) {
            if (!in_array($modifierData['name'], $existingModifiers)) {
                MenuModifier::create($modifierData);
            }
        }

        // Only assign modifiers to groups if the relationship doesn't exist
        if ($cookingGroup) {
            $this->assignModifiersToGroups($cookingGroup, ['Rare', 'Medium Rare', 'Medium', 'Medium Well', 'Well Done']);
        }
        if ($spiceGroup) {
            $this->assignModifiersToGroups($spiceGroup, ['No Spice', 'Mild', 'Hot', 'Extra Hot']);
        }
        if ($extraGroup) {
            $this->assignModifiersToGroups($extraGroup, ['Extra Cheese', 'Extra Bacon', 'Extra Mushrooms', 'Extra Onions', 'Extra Sauce']);
        }
        if ($sideGroup) {
            $this->assignModifiersToGroups($sideGroup, ['Rice']);
        }
    }

    private function assignModifiersToGroups($group, $modifierNames)
    {
        foreach ($modifierNames as $index => $modifierName) {
            $modifier = MenuModifier::where('name', $modifierName)->first();
            if ($modifier) {
                DB::table('menu_modifier_group_items')->insert([
                    'modifier_group_id' => $group->id,
                    'modifier_id' => $modifier->id,
                    'price_adjustment' => $modifier->price_adjustment,
                    'display_order' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedEmployees($store)
    {
        $employees = [
            ['name' => 'John Smith', 'contact_number' => '+1234567890', 'address' => '123 Main St, City, State', 'role' => 'Manager', 'salary' => 4500, 'salary_frequency' => 'monthly', 'gender' => 'male', 'status' => 'active', 'joined_at' => Carbon::now()->subYears(2)],
            ['name' => 'Sarah Johnson', 'contact_number' => '+1234567891', 'address' => '456 Oak Ave, City, State', 'role' => 'Chef', 'salary' => 3800, 'salary_frequency' => 'monthly', 'gender' => 'female', 'status' => 'active', 'joined_at' => Carbon::now()->subYears(1)],
            ['name' => 'Mike Wilson', 'contact_number' => '+1234567892', 'address' => '789 Pine Rd, City, State', 'role' => 'Waiter', 'salary' => 2200, 'salary_frequency' => 'monthly', 'gender' => 'male', 'status' => 'active', 'joined_at' => Carbon::now()->subMonths(6)],
            ['name' => 'Emily Davis', 'contact_number' => '+1234567893', 'address' => '321 Elm St, City, State', 'role' => 'Waiter', 'salary' => 2200, 'salary_frequency' => 'monthly', 'gender' => 'female', 'status' => 'active', 'joined_at' => Carbon::now()->subMonths(8)],
            ['name' => 'David Brown', 'contact_number' => '+1234567894', 'address' => '654 Maple Dr, City, State', 'role' => 'Bartender', 'salary' => 2500, 'salary_frequency' => 'monthly', 'gender' => 'male', 'status' => 'active', 'joined_at' => Carbon::now()->subMonths(4)],
            ['name' => 'Lisa Anderson', 'contact_number' => '+1234567895', 'address' => '987 Cedar Ln, City, State', 'role' => 'Host', 'salary' => 2000, 'salary_frequency' => 'monthly', 'gender' => 'female', 'status' => 'active', 'joined_at' => Carbon::now()->subMonths(3)],
            ['name' => 'Tom Martinez', 'contact_number' => '+1234567896', 'address' => '147 Birch Way, City, State', 'role' => 'Kitchen Helper', 'salary' => 1800, 'salary_frequency' => 'monthly', 'gender' => 'male', 'status' => 'active', 'joined_at' => Carbon::now()->subMonths(2)],
            ['name' => 'Jessica Taylor', 'contact_number' => '+1234567897', 'address' => '258 Spruce St, City, State', 'role' => 'Waiter', 'salary' => 2200, 'salary_frequency' => 'monthly', 'gender' => 'female', 'status' => 'active', 'joined_at' => Carbon::now()->subMonths(1)],
        ];

        foreach ($employees as $employeeData) {
            Employee::create(array_merge($employeeData, [
                'store_id' => $store->id,
                'balance' => 0,
            ]));
        }
    }

    private function seedSalaryRecords($store)
    {
        $employees = Employee::all();
        $currentDate = Carbon::now();
        
        foreach ($employees as $employee) {
            // Create salary records for the last 6 months
            for ($i = 5; $i >= 0; $i--) {
                $salaryDate = $currentDate->copy()->subMonths($i)->endOfMonth();
                
                SalaryRecord::create([
                    'employee_id' => $employee->id,
                    'salary_date' => $salaryDate,
                    'basic_salary' => $employee->salary,
                    'allowances' => rand(100, 500),
                    'deductions' => rand(50, 200),
                    'gross_salary' => $employee->salary + rand(100, 500),
                    'net_salary' => $employee->salary + rand(100, 500) - rand(50, 200),
                    'salary_from' => $salaryDate->copy()->startOfMonth(),
                    'store_id' => $store->id,
                    'adjusts_balance' => true,
                    'remarks' => 'Monthly salary payment',
                ]);
            }
        }
    }

    private function seedInventoryItems($store)
    {
        $inventoryItems = [
            ['name' => 'Tomatoes', 'unit_type' => 'kg', 'alert_quantity' => 5, 'cost' => 2.50],
            ['name' => 'Potatoes', 'unit_type' => 'kg', 'alert_quantity' => 10, 'cost' => 1.80],
            ['name' => 'Onions', 'unit_type' => 'kg', 'alert_quantity' => 8, 'cost' => 1.50],
            ['name' => 'Chicken Breast', 'unit_type' => 'kg', 'alert_quantity' => 5, 'cost' => 8.50],
            ['name' => 'Salmon Fillet', 'unit_type' => 'kg', 'alert_quantity' => 3, 'cost' => 15.00],
            ['name' => 'Beef Ribeye', 'unit_type' => 'kg', 'alert_quantity' => 3, 'cost' => 25.00],
            ['name' => 'Lettuce', 'unit_type' => 'kg', 'alert_quantity' => 2, 'cost' => 3.00],
            ['name' => 'Cheese', 'unit_type' => 'kg', 'alert_quantity' => 2, 'cost' => 12.00],
            ['name' => 'Flour', 'unit_type' => 'kg', 'alert_quantity' => 10, 'cost' => 1.20],
            ['name' => 'Cooking Oil', 'unit_type' => 'liter', 'alert_quantity' => 5, 'cost' => 3.50],
            ['name' => 'Sugar', 'unit_type' => 'kg', 'alert_quantity' => 5, 'cost' => 1.80],
            ['name' => 'Salt', 'unit_type' => 'kg', 'alert_quantity' => 3, 'cost' => 1.00],
        ];

        foreach ($inventoryItems as $itemData) {
            InventoryItem::create(array_merge($itemData, [
                'batch_number' => 'BATCH-' . strtoupper(str_replace(' ', '', $itemData['name'])) . '-' . date('Ym'),
            ]));
        }
    }

    private function seedProductBatches($store)
    {
        // This method is no longer needed as we create batches in seedProducts method
        // Keeping it empty to avoid errors
    }

    private function seedInventoryTransactions($store)
    {
        $inventoryItems = InventoryItem::all();
        $transactionTypes = ['purchase', 'adjustment', 'waste', 'transfer'];
        
        // Create transactions for the last 30 days
        for ($i = 0; $i < 20; $i++) {
            $transactionDate = Carbon::now()->subDays(rand(0, 30));
            $transactionType = $transactionTypes[array_rand($transactionTypes)];
            
            $transaction = InventoryTransaction::create([
                'store_id' => $store->id,
                'transaction_type' => $transactionType,
                'reason' => $this->getTransactionReason($transactionType),
                'transaction_date' => $transactionDate,
                'total' => rand(50, 500),
            ]);
            
            // Add random items to transaction
            $itemCount = rand(1, 5);
            $selectedItems = $inventoryItems->random($itemCount);
            
            foreach ($selectedItems as $item) {
                InventoryTransactionItem::create([
                    'inventory_transaction_id' => $transaction->id,
                    'inventory_item_id' => $item->id,
                    'quantity' => rand(1, 20),
                    'cost' => $item->cost,
                    'transaction_date' => $transactionDate,
                ]);
            }
        }
    }

    private function getTransactionReason($transactionType)
    {
        $reasons = [
            'purchase' => ['Regular stock purchase', 'Bulk purchase', 'Emergency purchase'],
            'adjustment' => ['Stock count adjustment', 'Price adjustment', 'Quantity correction'],
            'waste' => ['Expired items', 'Spoiled food', 'Damaged goods'],
            'transfer' => ['Transfer to kitchen', 'Transfer to bar', 'Inter-department transfer'],
        ];
        
        return $reasons[$transactionType][array_rand($reasons[$transactionType])];
    }

    private function seedCustomers($store)
    {
        $customers = [
            ['name' => 'Robert Johnson', 'email' => 'robert.johnson@email.com', 'phone' => '+1234567890', 'address' => '123 Main St, City, State'],
            ['name' => 'Mary Williams', 'email' => 'mary.williams@email.com', 'phone' => '+1234567891', 'address' => '456 Oak Ave, City, State'],
            ['name' => 'James Davis', 'email' => 'james.davis@email.com', 'phone' => '+1234567892', 'address' => '789 Pine Rd, City, State'],
            ['name' => 'Patricia Miller', 'email' => 'patricia.miller@email.com', 'phone' => '+1234567893', 'address' => '321 Elm St, City, State'],
            ['name' => 'Michael Brown', 'email' => 'michael.brown@email.com', 'phone' => '+1234567894', 'address' => '654 Maple Dr, City, State'],
            ['name' => 'Jennifer Jones', 'email' => 'jennifer.jones@email.com', 'phone' => '+1234567895', 'address' => '987 Cedar Ln, City, State'],
            ['name' => 'William Garcia', 'email' => 'william.garcia@email.com', 'phone' => '+1234567896', 'address' => '147 Birch Way, City, State'],
            ['name' => 'Linda Martinez', 'email' => 'linda.martinez@email.com', 'phone' => '+1234567897', 'address' => '258 Spruce St, City, State'],
            ['name' => 'Richard Anderson', 'email' => 'richard.anderson@email.com', 'phone' => '+1234567898', 'address' => '369 Willow Ave, City, State'],
            ['name' => 'Susan Taylor', 'email' => 'susan.taylor@email.com', 'phone' => '+1234567899', 'address' => '741 Poplar Dr, City, State'],
        ];

        foreach ($customers as $customerData) {
            Contact::create(array_merge($customerData, [
                'type' => 'customer',
                'balance' => rand(-100, 500),
                'loyalty_points' => rand(0, 1000),
                'whatsapp' => $customerData['phone'],
            ]));
        }
    }


    private function seedRestaurantOrders($store)
    {
        $tables = RestaurantTable::all();
        $customers = Contact::customers()->get();
        $waiters = User::all();
        $products = Product::all();
        $statuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'];
        $orderTypes = ['dine_in', 'takeaway', 'delivery'];
        
        // Create orders for the last 7 days
        for ($i = 0; $i < 50; $i++) {
            $orderDate = Carbon::now()->subDays(rand(0, 7));
            $orderTime = $orderDate->copy()->setTime(rand(10, 22), rand(0, 59));
            
            $order = RestaurantOrder::create([
                'order_number' => 'ORD-' . date('Ymd') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'table_id' => $tables->random()->id,
                'order_type' => $orderTypes[array_rand($orderTypes)],
                'customer_count' => rand(1, 8),
                'waiter_id' => $waiters->random()->id,
                'status' => $statuses[array_rand($statuses)],
                'priority' => rand(0, 1) == 1 ? 'high' : 'normal',
                'special_instructions' => rand(0, 1) == 1 ? 'Extra napkins please' : null,
                'estimated_time' => rand(15, 45),
                'order_date' => $orderDate,
                'order_time' => $orderTime,
                'store_id' => $store->id,
                'created_by' => $waiters->random()->id,
            ]);
            
            // Add items to order
            $itemCount = rand(1, 6);
            $selectedProducts = $products->random($itemCount);
            $subtotal = 0;
            
            foreach ($selectedProducts as $product) {
                $quantity = rand(1, 3);
                // Get price from the first batch of the product
                $batch = $product->batches()->first();
                $unitPrice = $batch ? $batch->price : 10.00; // Default price if no batch
                $itemTotal = $quantity * $unitPrice;
                $subtotal += $itemTotal;
                
                $orderItem = RestaurantOrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'special_instructions' => rand(0, 1) == 1 ? 'No onions please' : null,
                    'status' => 'pending',
                ]);
                
                // Add modifiers to some items
                if (rand(0, 1) == 1) {
                    $modifiers = MenuModifier::inRandomOrder()->limit(rand(1, 3))->get();
                    foreach ($modifiers as $modifier) {
                        RestaurantOrderItemModifier::create([
                            'order_item_id' => $orderItem->id,
                            'modifier_id' => $modifier->id,
                            'quantity' => 1,
                            'price_adjustment' => $modifier->price_adjustment,
                        ]);
                    }
                }
            }
            
            // Calculate order totals
            $taxAmount = $subtotal * 0.1; // 10% tax
            $serviceCharge = $order->order_type === 'dine_in' ? $subtotal * 0.1 : 0; // 10% service charge for dine-in
            $discountAmount = rand(0, 10) > 7 ? $subtotal * 0.05 : 0; // 30% chance of 5% discount
            $totalAmount = $subtotal + $taxAmount + $serviceCharge - $discountAmount;
            
            $order->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'service_charge' => $serviceCharge,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
            ]);
        }
    }

    private function seedSales($store)
    {
        $restaurantOrders = RestaurantOrder::all();
        $customers = Contact::customers()->get();
        $paymentMethods = ['cash', 'card', 'mobile_payment', 'bank_transfer'];
        
        foreach ($restaurantOrders as $order) {
            if ($order->status === 'completed' || $order->status === 'served') {
                $sale = Sale::create([
                    'sale_type' => 'restaurant',
                    'store_id' => $store->id,
                    'contact_id' => $customers->random()->id,
                    'sale_date' => $order->order_date,
                    'total_amount' => $order->total_amount,
                    'discount' => $order->discount_amount,
                    'amount_received' => $order->total_amount,
                    'profit_amount' => $order->total_amount * 0.3, // 30% profit margin
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'note' => 'Restaurant order #' . $order->order_number,
                    'sale_time' => $order->order_time,
                    'created_by' => $order->waiter_id,
                ]);
                
                // Update order with sale_id
                $order->update(['sale_id' => $sale->id]);
                
                // Create transaction
                Transaction::create([
                    'sales_id' => $sale->id,
                    'transaction_type' => 'payment',
                    'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                    'amount' => $order->total_amount,
                    'transaction_date' => $order->order_time,
                    'store_id' => $store->id,
                    'contact_id' => $sale->contact_id,
                ]);
            }
        }
    }

    private function seedTableReservations($store)
    {
        $tables = RestaurantTable::all();
        $customers = Contact::customers()->get();
        $statuses = ['confirmed', 'seated', 'completed', 'cancelled', 'no_show'];
        
        // Create reservations for the next 30 days
        for ($i = 0; $i < 40; $i++) {
            $reservationDate = Carbon::now()->addDays(rand(-7, 30));
            $reservationTime = $reservationDate->copy()->setTime(rand(11, 21), rand(0, 59));
            $duration = rand(60, 180); // 1-3 hours
            
            TableReservation::create([
                'table_id' => $tables->random()->id,
                'contact_id' => $customers->random()->id,
                'customer_name' => $customers->random()->name, // Use contact name
                'customer_phone' => $customers->random()->phone, // Use contact phone
                'reservation_date' => $reservationDate,
                'reservation_time' => $reservationTime,
                'duration_minutes' => $duration,
                'party_size' => rand(1, 8),
                'status' => $statuses[array_rand($statuses)],
                'special_requests' => rand(0, 1) == 1 ? 'Window seat preferred' : null,
                'deposit_amount' => rand(0, 1) == 1 ? rand(20, 100) : 0,
                'deposit_paid' => rand(0, 1) == 1,
                'notes' => rand(0, 1) == 1 ? 'Regular customer' : null,
            ]);
        }
    }
}