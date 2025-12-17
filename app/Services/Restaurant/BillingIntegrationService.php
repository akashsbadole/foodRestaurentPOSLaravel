<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantInvoice;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Charge;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BillingIntegrationService
{
    /**
     * Create a Sale record from a RestaurantOrder
     */
    public function createSaleFromOrder(RestaurantOrder $order, array $paymentDetails = []): Sale
    {
        return DB::transaction(function () use ($order, $paymentDetails) {
            // Create the main sale record
            $sale = Sale::create([
                'store_id' => $order->store_id,
                'customer_id' => $order->customer_id,
                'user_id' => $order->created_by,
                'sale_number' => $this->generateSaleNumber(),
                'sale_date' => now()->format('Y-m-d'),
                'sale_time' => now(),
                'subtotal' => $order->subtotal,
                'tax_amount' => $order->tax_amount,
                'discount_amount' => $order->discount_amount,
                'total_amount' => $order->final_total,
                'payment_status' => $paymentDetails['payment_status'] ?? 'pending',
                'payment_method' => $paymentDetails['payment_method'] ?? null,
                'paid_amount' => $paymentDetails['paid_amount'] ?? 0,
                'change_amount' => $paymentDetails['change_amount'] ?? 0,
                'notes' => $order->billing_notes ?? null,
                'restaurant_order_id' => $order->id,
                'table_id' => $order->table_id,
                'order_type' => $order->order_type,
                'customer_count' => $order->customer_count,
                'waiter_id' => $order->waiter_id,
                'tax_breakdown' => $order->tax_breakdown,
                'discount_breakdown' => $order->discount_breakdown,
                'service_charge_breakdown' => $order->service_charge_breakdown,
            ]);

            // Create sale items from order items
            foreach ($order->items as $orderItem) {
                $this->createSaleItemFromOrderItem($sale, $orderItem);
            }

            // Create service charge records if applicable
            $this->createServiceCharges($sale, $order);

            // Update order with sale reference
            $order->update([
                'sale_id' => $sale->id,
                'payment_status' => $paymentDetails['payment_status'] ?? 'pending',
            ]);

            Log::info('Sale created from restaurant order', [
                'order_id' => $order->id,
                'sale_id' => $sale->id,
                'amount' => $sale->total_amount,
            ]);

            return $sale;
        });
    }

    /**
     * Create a SaleItem from a RestaurantOrderItem
     */
    private function createSaleItemFromOrderItem(Sale $sale, $orderItem): SaleItem
    {
        $saleItem = SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $orderItem->product_id,
            'quantity' => $orderItem->quantity,
            'unit_price' => $orderItem->unit_price,
            'unit_cost' => $orderItem->unit_cost ?? $orderItem->product->cost_price ?? 0,
            'discount' => $orderItem->discount ?? 0,
            'tax' => $orderItem->tax ?? 0,
            'total' => $orderItem->calculateSubtotal(),
            'notes' => $orderItem->special_instructions,
            'restaurant_order_item_id' => $orderItem->id,
            'kitchen_printed' => $orderItem->kitchen_printed,
            'kitchen_printed_at' => $orderItem->kitchen_printed_at,
            'served_by' => $orderItem->served_by,
            'served_at' => $orderItem->served_at,
            'is_complimentary' => $orderItem->is_complimentary ?? false,
            'void_reason' => $orderItem->void_reason,
        ]);

        // Create sale item modifiers if any
        foreach ($orderItem->modifiers as $modifier) {
            $saleItem->modifiers()->create([
                'modifier_id' => $modifier->modifier_id,
                'quantity' => $modifier->quantity,
                'price_adjustment' => $modifier->price_adjustment,
            ]);
        }

        return $saleItem;
    }

    /**
     * Create service charge records
     */
    private function createServiceCharges(Sale $sale, RestaurantOrder $order): void
    {
        if (!$order->service_charge_breakdown) {
            return;
        }

        foreach ($order->service_charge_breakdown as $serviceCharge) {
            Charge::create([
                'store_id' => $sale->store_id,
                'sale_id' => $sale->id,
                'charge_type' => 'service_charge',
                'name' => $serviceCharge['name'] ?? 'Service Charge',
                'amount' => $serviceCharge['amount'] ?? 0,
                'percentage' => $serviceCharge['percentage'] ?? null,
                'applied_to' => 'subtotal',
                'description' => $serviceCharge['description'] ?? null,
                'restaurant_order_id' => $order->id,
            ]);
        }
    }

    /**
     * Create additional charges from invoice
     */
    public function createChargesFromInvoice(RestaurantInvoice $invoice): void
    {
        // Create delivery charges if applicable
        if ($invoice->order_type === 'delivery') {
            $this->createDeliveryCharge($invoice);
        }

        // Create other additional charges
        $this->createAdditionalCharges($invoice);
    }

    /**
     * Create delivery charge
     */
    private function createDeliveryCharge(RestaurantInvoice $invoice): void
    {
        $deliveryCharge = setting('restaurant.delivery_charge', 0, $invoice->store_id);
        
        if ($deliveryCharge > 0) {
            Charge::create([
                'store_id' => $invoice->store_id,
                'sale_id' => $invoice->sale_id,
                'invoice_id' => $invoice->id,
                'charge_type' => 'delivery',
                'name' => 'Delivery Charge',
                'amount' => $deliveryCharge,
                'description' => 'Delivery fee for order ' . $invoice->order->order_number,
                'restaurant_order_id' => $invoice->order_id,
            ]);
        }
    }

    /**
     * Create additional charges
     */
    private function createAdditionalCharges(RestaurantInvoice $invoice): void
    {
        // This could be extended to handle various types of additional charges
        // For now, we'll handle common restaurant charges
        
        // Corkage charge if applicable
        $corkageCharge = setting('restaurant.corkage_charge', 0, $invoice->store_id);
        if ($corkageCharge > 0 && $this->hasCorkageItems($invoice)) {
            Charge::create([
                'store_id' => $invoice->store_id,
                'sale_id' => $invoice->sale_id,
                'invoice_id' => $invoice->id,
                'charge_type' => 'corkage',
                'name' => 'Corkage Charge',
                'amount' => $corkageCharge,
                'description' => 'Corkage fee for BYO items',
                'restaurant_order_id' => $invoice->order_id,
            ]);
        }
    }

    /**
     * Check if order has corkage items
     */
    private function hasCorkageItems(RestaurantInvoice $invoice): bool
    {
        // This would check if the order contains items that incur corkage charges
        // Implementation depends on how corkage items are identified
        return false; // Placeholder
    }

    /**
     * Update sale when invoice is modified
     */
    public function updateSaleFromInvoice(RestaurantInvoice $invoice): void
    {
        if (!$invoice->sale_id) {
            return;
        }

        DB::transaction(function () use ($invoice) {
            $sale = $invoice->sale;
            
            $sale->update([
                'subtotal' => $invoice->subtotal,
                'tax_amount' => $invoice->total_tax,
                'discount_amount' => $invoice->total_discounts,
                'total_amount' => $invoice->final_total,
                'tax_breakdown' => $invoice->tax_breakdown,
                'discount_breakdown' => $invoice->discounts,
                'service_charge_breakdown' => $invoice->service_charges,
            ]);

            Log::info('Sale updated from invoice', [
                'invoice_id' => $invoice->id,
                'sale_id' => $sale->id,
                'new_total' => $invoice->final_total,
            ]);
        });
    }

    /**
     * Handle invoice refund
     */
    public function handleInvoiceRefund(RestaurantInvoice $invoice, float $refundAmount, string $reason): void
    {
        if (!$invoice->sale_id) {
            return;
        }

        DB::transaction(function () use ($invoice, $refundAmount, $reason) {
            $sale = $invoice->sale;
            
            // Create a refund sale record
            $refundSale = Sale::create([
                'store_id' => $sale->store_id,
                'customer_id' => $sale->customer_id,
                'user_id' => auth()->id(),
                'sale_number' => $this->generateRefundSaleNumber($sale->sale_number),
                'sale_date' => now()->format('Y-m-d'),
                'sale_time' => now(),
                'subtotal' => -$refundAmount,
                'tax_amount' => 0, // Tax calculations for refunds can be complex
                'discount_amount' => 0,
                'total_amount' => -$refundAmount,
                'payment_status' => 'refunded',
                'payment_method' => $sale->payment_method,
                'notes' => "Refund for order {$sale->sale_number}: {$reason}",
                'parent_sale_id' => $sale->id,
                'restaurant_order_id' => $invoice->order_id,
                'refund_reason' => $reason,
                'original_invoice_id' => $invoice->id,
            ]);

            // Update original sale payment status if fully refunded
            if ($invoice->amount_paid <= $refundAmount) {
                $sale->update([
                    'payment_status' => 'refunded',
                ]);
            }

            Log::info('Invoice refund processed', [
                'invoice_id' => $invoice->id,
                'sale_id' => $sale->id,
                'refund_sale_id' => $refundSale->id,
                'refund_amount' => $refundAmount,
                'reason' => $reason,
            ]);
        });
    }

    /**
     * Generate unique sale number
     */
    private function generateSaleNumber(): string
    {
        $prefix = 'SAL';
        $date = now()->format('Ymd');
        
        $lastSale = Sale::whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->first();

        $sequence = $lastSale ? intval(substr($lastSale->sale_number, -4)) + 1 : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate refund sale number
     */
    private function generateRefundSaleNumber(string $originalSaleNumber): string
    {
        return 'R' . $originalSaleNumber;
    }

    /**
     * Sync inventory for restaurant order
     */
    public function syncInventoryForOrder(RestaurantOrder $order): void
    {
        foreach ($order->items as $orderItem) {
            $product = $orderItem->product;
            
            if ($product && $product->track_inventory) {
                // Reduce inventory for the product
                $product->decrement('stock_quantity', $orderItem->quantity);
                
                // Log inventory transaction
                \App\Models\InventoryTransaction::create([
                    'store_id' => $order->store_id,
                    'product_id' => $product->id,
                    'transaction_type' => 'sale',
                    'quantity' => -$orderItem->quantity,
                    'reference_type' => 'restaurant_order',
                    'reference_id' => $order->id,
                    'notes' => "Sold in restaurant order {$order->order_number}",
                ]);
            }
        }
    }

    /**
     * Reverse inventory for cancelled/refunded order
     */
    public function reverseInventoryForOrder(RestaurantOrder $order): void
    {
        foreach ($order->items as $orderItem) {
            $product = $orderItem->product;
            
            if ($product && $product->track_inventory) {
                // Restore inventory for the product
                $product->increment('stock_quantity', $orderItem->quantity);
                
                // Log inventory transaction
                \App\Models\InventoryTransaction::create([
                    'store_id' => $order->store_id,
                    'product_id' => $product->id,
                    'transaction_type' => 'return',
                    'quantity' => $orderItem->quantity,
                    'reference_type' => 'restaurant_order',
                    'reference_id' => $order->id,
                    'notes' => "Restored from cancelled/refunded order {$order->order_number}",
                ]);
            }
        }
    }
}