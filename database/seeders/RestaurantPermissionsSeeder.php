<?php

namespace Database\Seeders;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Database\Seeder;

class RestaurantPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the roles
        $superAdminRole = Role::where('name', 'super-admin')->first();
        $adminRole = Role::where('name', 'admin')->first();

        // Define restaurant permissions
        $restaurantPermissions = [
            'restaurant_tables',
            'restaurant_orders',
            'restaurant_kitchen',
            'restaurant_reservations',
        ];

        // Create permissions if they don't exist
        foreach ($restaurantPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign permissions to super admin role
        if ($superAdminRole) {
            $superAdminRole->givePermissionTo($restaurantPermissions);
        }

        // Assign permissions to admin role
        if ($adminRole) {
            $adminRole->givePermissionTo($restaurantPermissions);
        }

        $this->command->info('Restaurant permissions seeded successfully!');
    }
}