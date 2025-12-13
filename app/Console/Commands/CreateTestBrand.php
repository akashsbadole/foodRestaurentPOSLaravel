<?php

namespace App\Console\Commands;

use App\Models\BrandSetting;
use Illuminate\Console\Command;

class CreateTestBrand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-test-brand';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a test brand for testing purposes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $brand = BrandSetting::create([
            'app_name' => 'Test Brand',
            'brand_key' => 'test-brand',
            'industry_type' => 'restaurant',
            'industry_template' => 'modern',
            'primary_color' => '#3B82F6',
            'secondary_color' => '#64748B',
            'accent_color' => '#EF4444',
            'is_active' => true,
            'sort_order' => 1
        ]);
        
        $this->info("Created test brand with ID: {$brand->id}");
        return 0;
    }
}
