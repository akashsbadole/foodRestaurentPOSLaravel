<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Store;
use App\Models\Restaurant\TableSection;
use App\Models\Restaurant\RestaurantTable;
use App\Models\Restaurant\KitchenStation;
use App\Models\Restaurant\MenuModifier;
use App\Models\Restaurant\MenuModifierGroup;

class RestaurantSeeder extends Seeder
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

        // Create table sections
        $sections = [
            ['name' => 'Main Dining', 'description' => 'Primary dining area', 'store_id' => $store->id],
            ['name' => 'Private Dining', 'description' => 'Private dining area for special occasions', 'store_id' => $store->id],
            ['name' => 'Outdoor Patio', 'description' => 'Outdoor seating area', 'store_id' => $store->id],
            ['name' => 'Bar Area', 'description' => 'Bar seating area', 'store_id' => $store->id],
        ];

        foreach ($sections as $sectionData) {
            TableSection::create($sectionData);
        }

        // Create restaurant tables
        $mainSection = TableSection::where('name', 'Main Dining')->first();
        $privateSection = TableSection::where('name', 'Private Dining')->first();
        $outdoorSection = TableSection::where('name', 'Outdoor Patio')->first();
        $barSection = TableSection::where('name', 'Bar Area')->first();

        $tables = [
            // Main Dining Tables
            ['table_number' => 'T01', 'name' => 'Table 1', 'capacity' => 4, 'section_id' => $mainSection->id, 'shape' => 'rectangle', 'position_x' => 100, 'position_y' => 100, 'store_id' => $store->id],
            ['table_number' => 'T02', 'name' => 'Table 2', 'capacity' => 4, 'section_id' => $mainSection->id, 'shape' => 'rectangle', 'position_x' => 250, 'position_y' => 100, 'store_id' => $store->id],
            ['table_number' => 'T03', 'name' => 'Table 3', 'capacity' => 6, 'section_id' => $mainSection->id, 'shape' => 'rectangle', 'position_x' => 400, 'position_y' => 100, 'store_id' => $store->id],
            ['table_number' => 'T04', 'name' => 'Table 4', 'capacity' => 6, 'section_id' => $mainSection->id, 'shape' => 'rectangle', 'position_x' => 100, 'position_y' => 250, 'store_id' => $store->id],
            ['table_number' => 'T05', 'name' => 'Table 5', 'capacity' => 8, 'section_id' => $mainSection->id, 'shape' => 'rectangle', 'position_x' => 250, 'position_y' => 250, 'store_id' => $store->id],
            
            // Private Dining Tables
            ['table_number' => 'P01', 'name' => 'Private Room 1', 'capacity' => 10, 'section_id' => $privateSection->id, 'shape' => 'rectangle', 'position_x' => 100, 'position_y' => 400, 'store_id' => $store->id],
            ['table_number' => 'P02', 'name' => 'Private Room 2', 'capacity' => 12, 'section_id' => $privateSection->id, 'shape' => 'rectangle', 'position_x' => 300, 'position_y' => 400, 'store_id' => $store->id],
            
            // Bar Area Tables
            ['table_number' => 'B01', 'name' => 'Bar Table 1', 'capacity' => 2, 'section_id' => $barSection->id, 'shape' => 'circle', 'position_x' => 100, 'position_y' => 500, 'store_id' => $store->id],
            ['table_number' => 'B02', 'name' => 'Bar Table 2', 'capacity' => 2, 'section_id' => $barSection->id, 'shape' => 'circle', 'position_x' => 200, 'position_y' => 500, 'store_id' => $store->id],
            ['table_number' => 'B03', 'name' => 'Bar Table 3', 'capacity' => 4, 'section_id' => $barSection->id, 'shape' => 'rectangle', 'position_x' => 300, 'position_y' => 500, 'store_id' => $store->id],
            
            // Outdoor Patio Tables
            ['table_number' => 'O01', 'name' => 'Patio Table 1', 'capacity' => 6, 'section_id' => $outdoorSection->id, 'shape' => 'square', 'position_x' => 100, 'position_y' => 650, 'store_id' => $store->id],
            ['table_number' => 'O02', 'name' => 'Patio Table 2', 'capacity' => 6, 'section_id' => $outdoorSection->id, 'shape' => 'square', 'position_x' => 250, 'position_y' => 650, 'store_id' => $store->id],
        ];

        foreach ($tables as $tableData) {
            RestaurantTable::create($tableData);
        }

        // Create kitchen stations
        $stations = [
            ['name' => 'Main Kitchen', 'description' => 'Main food preparation area', 'store_id' => $store->id],
            ['name' => 'Grill Station', 'description' => 'Grilling and BBQ preparation', 'store_id' => $store->id],
            ['name' => 'Salad Station', 'description' => 'Cold salads and appetizers', 'store_id' => $store->id],
            ['name' => 'Bar Station', 'description' => 'Beverage and drink preparation', 'store_id' => $store->id],
        ];

        foreach ($stations as $stationData) {
            KitchenStation::create($stationData);
        }

        // Create modifier groups
        $modifierGroups = [
            ['name' => 'Temperature', 'description' => 'Cooking temperature preference', 'selection_type' => 'single', 'min_selections' => 1, 'max_selections' => 1, 'store_id' => $store->id],
            ['name' => 'Spice Level', 'description' => 'Spice level preference', 'selection_type' => 'single', 'min_selections' => 1, 'max_selections' => 1, 'store_id' => $store->id],
            ['name' => 'Extra Ingredients', 'description' => 'Additional ingredients options', 'selection_type' => 'multiple', 'min_selections' => 0, 'max_selections' => 5, 'store_id' => $store->id],
            ['name' => 'Side Dishes', 'description' => 'Side dish selections', 'selection_type' => 'multiple', 'min_selections' => 0, 'max_selections' => 3, 'store_id' => $store->id],
        ];

        foreach ($modifierGroups as $groupData) {
            MenuModifierGroup::create($groupData);
        }

        // Create modifiers
        $tempGroup = MenuModifierGroup::where('name', 'Temperature')->first();
        $spiceGroup = MenuModifierGroup::where('name', 'Spice Level')->first();
        $extraGroup = MenuModifierGroup::where('name', 'Extra Ingredients')->first();
        $sideGroup = MenuModifierGroup::where('name', 'Side Dishes')->first();

        $modifiers = [
            // Temperature modifiers
            ['name' => 'Rare', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Medium Rare', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Medium', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Medium Well', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Well Done', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            
            // Spice level modifiers
            ['name' => 'No Spice', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Mild', 'modifier_type' => 'preference', 'price_adjustment' => 0, 'store_id' => $store->id],
            ['name' => 'Medium', 'modifier_type' => 'preference', 'price_adjustment' => 0.50, 'store_id' => $store->id],
            ['name' => 'Hot', 'modifier_type' => 'preference', 'price_adjustment' => 0.75, 'store_id' => $store->id],
            ['name' => 'Extra Hot', 'modifier_type' => 'preference', 'price_adjustment' => 1.00, 'store_id' => $store->id],
            
            // Extra ingredients
            ['name' => 'Extra Cheese', 'modifier_type' => 'addition', 'price_adjustment' => 1.50, 'store_id' => $store->id],
            ['name' => 'Extra Bacon', 'modifier_type' => 'addition', 'price_adjustment' => 2.00, 'store_id' => $store->id],
            ['name' => 'Extra Mushrooms', 'modifier_type' => 'addition', 'price_adjustment' => 1.25, 'store_id' => $store->id],
            ['name' => 'Extra Onions', 'modifier_type' => 'addition', 'price_adjustment' => 0.75, 'store_id' => $store->id],
            
            // Side dishes
            ['name' => 'French Fries', 'modifier_type' => 'substitution', 'price_adjustment' => 3.50, 'store_id' => $store->id],
            ['name' => 'Mashed Potatoes', 'modifier_type' => 'substitution', 'price_adjustment' => 3.50, 'store_id' => $store->id],
            ['name' => 'Garden Salad', 'modifier_type' => 'substitution', 'price_adjustment' => 4.00, 'store_id' => $store->id],
            ['name' => 'Steamed Vegetables', 'modifier_type' => 'substitution', 'price_adjustment' => 4.00, 'store_id' => $store->id],
        ];

        foreach ($modifiers as $modifierData) {
            MenuModifier::create($modifierData);
        }

        // Assign modifiers to groups
        $this->assignModifiersToGroups($tempGroup, ['Rare', 'Medium Rare', 'Medium', 'Medium Well', 'Well Done']);
        $this->assignModifiersToGroups($spiceGroup, ['No Spice', 'Mild', 'Medium', 'Hot', 'Extra Hot']);
        $this->assignModifiersToGroups($extraGroup, ['Extra Cheese', 'Extra Bacon', 'Extra Mushrooms', 'Extra Onions']);
        $this->assignModifiersToGroups($sideGroup, ['French Fries', 'Mashed Potatoes', 'Garden Salad', 'Steamed Vegetables']);

        $this->command->info('Restaurant data seeded successfully!');
    }

    private function assignModifiersToGroups($group, $modifierNames)
    {
        foreach ($modifierNames as $modifierName) {
            $modifier = MenuModifier::where('name', $modifierName)->first();
            if ($modifier) {
                $group->modifiers()->attach($modifier->id, ['display_order' => 0]);
            }
        }
    }
}