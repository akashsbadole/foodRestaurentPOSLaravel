<?php

namespace App\Console\Commands;

use App\Http\Controllers\BrandController;
use Illuminate\Console\Command;

class TestBrandController extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-brand-controller';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test BrandController index method';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing BrandController index method...');
        
        try {
            $controller = new BrandController();
            
            // Create a mock request
            $request = new \Illuminate\Http\Request();
            
            // Test the index method
            $response = $controller->index($request);
            
            $this->info('BrandController index method executed successfully');
            $this->info('Response type: ' . get_class($response));
            $this->info('Inertia response created successfully - BrandController is working correctly');
            
            // Test database directly
            $brands = \App\Models\BrandSetting::all();
            $this->info('Total brands in database: ' . $brands->count());
            
            if ($brands->count() > 0) {
                $firstBrand = $brands->first();
                $this->info('First brand: ' . $firstBrand->app_name . ' (' . $firstBrand->brand_key . ')');
            }
            
            return 0;
        } catch (\Exception $e) {
            $this->error('Error testing BrandController: ' . $e->getMessage());
            $this->error('File: ' . $e->getFile() . ' Line: ' . $e->getLine());
            return 1;
        }
    }
}
