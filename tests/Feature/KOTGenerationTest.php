<?php

namespace Tests\Feature;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\KitchenOrderQueue;
use App\Models\Restaurant\KitchenStation;
use App\Models\Product;
use App\Models\Store;
use App\Services\Restaurant\KOTGenerationService;
use App\Services\Restaurant\KOTPrintService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KOTGenerationTest extends TestCase
{
    use RefreshDatabase;

    private $store;
    private $kitchenStation;
    private $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::factory()->create();
        $this->kitchenStation = KitchenStation::factory()->create([
            'store_id' => $this->store->id,
            'is_active' => true
        ]);
        $this->product = Product::factory()->create([
            'is_active' => true,
            'is_stock_managed' => true
        ]);
    }

    /** @test */
    public function it_can_generate_kot_for_confirmed_order()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'status' => 'pending'
        ]);

        // Attach product to station
        $this->kitchenStation->products()->attach($this->product->id, [
            'preparation_time' => 15
        ]);

        $kotService = new KOTGenerationService();
        $result = $kotService->generateKOTForOrder($order);

        $this->assertTrue($result['success']);
        $this->assertCount(1, $result['generated_kots']);
        $this->assertEmpty($result['stock_issues']);

        $this->assertDatabaseHas('kitchen_order_queue', [
            'order_item_id' => $orderItem->id,
            'station_id' => $this->kitchenStation->id,
            'status' => 'queued'
        ]);

        $orderItem->refresh();
        $this->assertEquals('confirmed', $orderItem->status);
    }

    /** @test */
    public function it_fails_to_generate_kot_for_non_confirmed_order()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);

        $kotService = new KOTGenerationService();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Order must be confirmed to generate KOT');

        $kotService->generateKOTForOrder($order);
    }

    /** @test */
    public function it_handles_insufficient_stock_gracefully()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 100, // More than available stock
            'status' => 'pending'
        ]);

        $kotService = new KOTGenerationService();
        $result = $kotService->generateKOTForOrder($order);

        $this->assertFalse($result['success']);
        $this->assertNotEmpty($result['stock_issues']);
        $this->assertStringContainsString('Insufficient stock', $result['message']);
    }

    /** @test */
    public function it_routes_items_to_correct_station()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'status' => 'pending'
        ]);

        // Attach product to station
        $this->kitchenStation->products()->attach($this->product->id, [
            'preparation_time' => 20
        ]);

        $kotService = new KOTGenerationService();
        $result = $kotService->generateKOTForOrder($order);

        $this->assertTrue($result['success']);

        $kot = KitchenOrderQueue::where('order_item_id', $orderItem->id)->first();
        $this->assertEquals($this->kitchenStation->id, $kot->station_id);
        $this->assertEquals(20, $kot->estimated_time);
    }

    /** @test */
    public function it_calculates_priority_correctly()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed',
            'priority' => 'high'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'status' => 'pending'
        ]);

        $this->kitchenStation->products()->attach($this->product->id);

        $kotService = new KOTGenerationService();
        $result = $kotService->generateKOTForOrder($order);

        $this->assertTrue($result['success']);

        $kot = KitchenOrderQueue::where('order_item_id', $orderItem->id)->first();
        $this->assertEquals('high', $kot->priority);
    }

    /** @test */
    public function it_regenerates_kot_for_modified_item()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'status' => 'confirmed'
        ]);

        // Create initial KOT
        $kot = KitchenOrderQueue::factory()->create([
            'order_item_id' => $orderItem->id,
            'station_id' => $this->kitchenStation->id,
            'status' => 'queued'
        ]);

        // Modify the item
        $orderItem->quantity = 3;
        $orderItem->save();

        $kotService = new KOTGenerationService();
        $result = $kotService->regenerateKOTForItem($orderItem);

        $this->assertTrue($result['success']);

        // Check old KOT was cancelled
        $kot->refresh();
        $this->assertEquals('cancelled', $kot->status);

        // Check new KOT was created
        $newKot = KitchenOrderQueue::where('order_item_id', $orderItem->id)
            ->where('status', '!=', 'cancelled')
            ->first();
        $this->assertNotNull($newKot);
    }

    /** @test */
    public function it_generates_unique_kot_numbers()
    {
        $order1 = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed'
        ]);

        $order2 = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed'
        ]);

        $orderItem1 = RestaurantOrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'status' => 'pending'
        ]);

        $orderItem2 = RestaurantOrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'status' => 'pending'
        ]);

        $this->kitchenStation->products()->attach($this->product->id);

        $kotService = new KOTGenerationService();
        
        $result1 = $kotService->generateKOTForOrder($order1);
        $result2 = $kotService->generateKOTForOrder($order2);

        $this->assertTrue($result1['success']);
        $this->assertTrue($result2['success']);

        $kot1 = KitchenOrderQueue::where('order_item_id', $orderItem1->id)->first();
        $kot2 = KitchenOrderQueue::where('order_item_id', $orderItem2->id)->first();

        $this->assertNotEquals($kot1->kot_number, $kot2->kot_number);
        $this->assertStringStartsWith('KOT', $kot1->kot_number);
        $this->assertStringStartsWith('KOT', $kot2->kot_number);
    }

    /** @test */
    public function it_updates_order_status_after_kot_generation()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'status' => 'pending'
        ]);

        $this->kitchenStation->products()->attach($this->product->id);

        $kotService = new KOTGenerationService();
        $result = $kotService->generateKOTForOrder($order);

        $this->assertTrue($result['success']);

        $order->refresh();
        $this->assertEquals('preparing', $order->status);
    }

    /** @test */
    public function it_exports_kot_as_text()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed',
            'order_number' => 'ORD202512140001'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'status' => 'pending',
            'special_instructions' => 'Extra spicy'
        ]);

        $kot = KitchenOrderQueue::factory()->create([
            'order_item_id' => $orderItem->id,
            'station_id' => $this->kitchenStation->id,
            'status' => 'queued',
            'priority' => 'normal',
            'estimated_time' => 15,
            'notes' => 'Customer requested extra spicy'
        ]);

        $printService = new KOTPrintService();
        $textContent = $printService->exportKOTAsText($kot);

        $this->assertStringContainsString('KITCHEN ORDER TICKET', $textContent);
        $this->assertStringContainsString('Order #: ORD202512140001', $textContent);
        $this->assertStringContainsString($this->product->name, $textContent);
        $this->assertStringContainsString('Quantity: 2', $textContent);
        $this->assertStringContainsString('Extra spicy', $textContent);
        $this->assertStringContainsString('Customer requested extra spicy', $textContent);
    }

    /** @test */
    public function it_exports_kot_as_json()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed',
            'order_number' => 'ORD202512140001'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'status' => 'pending'
        ]);

        $kot = KitchenOrderQueue::factory()->create([
            'order_item_id' => $orderItem->id,
            'station_id' => $this->kitchenStation->id,
            'status' => 'queued'
        ]);

        $printService = new KOTPrintService();
        $jsonContent = $printService->exportKOTAsJSON($kot);

        $data = json_decode($jsonContent, true);

        $this->assertArrayHasKey('kot', $data);
        $this->assertArrayHasKey('order', $data);
        $this->assertArrayHasKey('order_item', $data);

        $this->assertEquals($kot->id, $data['kot']['id']);
        $this->assertEquals('ORD202512140001', $data['order']['order_number']);
        $this->assertEquals($this->product->name, $data['order_item']['product']['name']);
    }

    /** @test */
    public function it_handles_kot_priority_scoring()
    {
        $urgentKOT = KitchenOrderQueue::factory()->create([
            'priority' => 'urgent',
            'created_at' => now()->subMinutes(10),
            'estimated_time' => 15
        ]);

        $normalKOT = KitchenOrderQueue::factory()->create([
            'priority' => 'normal',
            'created_at' => now()->subMinutes(5),
            'estimated_time' => 15
        ]);

        $overdueKOT = KitchenOrderQueue::factory()->create([
            'priority' => 'low',
            'created_at' => now()->subMinutes(30),
            'estimated_time' => 15
        ]);

        $urgentScore = $urgentKOT->getPriorityScore();
        $normalScore = $normalKOT->getPriorityScore();
        $overdueScore = $overdueKOT->getPriorityScore();

        $this->assertGreaterThan($normalScore, $urgentScore);
        $this->assertGreaterThan($urgentScore, $overdueScore); // Overdue should have highest score
    }

    /** @test */
    public function it_detects_overdue_kots()
    {
        $overdueKOT = KitchenOrderQueue::factory()->create([
            'created_at' => now()->subMinutes(30),
            'estimated_time' => 15,
            'status' => 'queued'
        ]);

        $normalKOT = KitchenOrderQueue::factory()->create([
            'created_at' => now()->subMinutes(10),
            'estimated_time' => 15,
            'status' => 'queued'
        ]);

        $completedKOT = KitchenOrderQueue::factory()->create([
            'created_at' => now()->subMinutes(30),
            'estimated_time' => 15,
            'status' => 'completed'
        ]);

        $this->assertTrue($overdueKOT->isOverdue());
        $this->assertFalse($normalKOT->isOverdue());
        $this->assertFalse($completedKOT->isOverdue());

        $this->assertEquals(15, $overdueKOT->getOverdueTime());
        $this->assertEquals(0, $normalKOT->getOverdueTime());
        $this->assertEquals(0, $completedKOT->getOverdueTime());
    }

    /** @test */
    public function it_verifies_stock_for_kot()
    {
        $order = RestaurantOrder::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed'
        ]);

        $orderItem = RestaurantOrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'status' => 'pending'
        ]);

        $kot = KitchenOrderQueue::factory()->create([
            'order_item_id' => $orderItem->id,
            'station_id' => $this->kitchenStation->id,
            'status' => 'queued',
            'stock_verified' => false
        ]);

        $this->assertFalse($kot->stock_verified);
        $this->assertNull($kot->stock_verified_at);
        $this->assertNull($kot->stock_verified_by);

        $kot->markStockVerified(1);

        $this->assertTrue($kot->stock_verified);
        $this->assertNotNull($kot->stock_verified_at);
        $this->assertEquals(1, $kot->stock_verified_by);
    }
}