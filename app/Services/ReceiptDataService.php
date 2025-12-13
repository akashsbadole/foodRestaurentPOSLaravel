<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\User;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\RestaurantOrderItemModifier;
use App\Models\Restaurant\OrderSplit;
use App\Models\Restaurant\OrderSplitItem;
use App\Models\Contact;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReceiptDataService
{
    /**
     * Get receipt data for a given sale ID
     * Returns a structured array with sale, salesItems, settings, and user_name
     *
     * @param int $saleId
     * @return array
     */
    public static function getReceiptData($saleId)
    {
        $imageUrl = '';
        if (app()->environment('production')) {
            $imageUrl = 'public/';
        }

        // Fetch all settings
        $settings = Setting::all();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        $settingArray['shop_logo'] = $imageUrl . $settingArray['shop_logo'];

        // Fetch sale with joins
        $sale = Sale::select(
            'sales.id',
            'contact_id',
            'sale_date',
            'total_amount',
            'total_charge_amount',
            'discount',
            'amount_received',
            'status',
            'stores.address',
            'contacts.name',
            'contacts.whatsapp',
            'sales.created_by',
            'invoice_number',
            'stores.sale_prefix',
            'stores.contact_number',
            'sales.created_at'
        )
            ->leftJoin('contacts', 'sales.contact_id', '=', 'contacts.id')
            ->join('stores', 'sales.store_id', '=', 'stores.id')
            ->where('sales.id', $saleId)
            ->first();

        // Fetch sale items with joins
        $salesItems = SaleItem::select(
            'sale_items.quantity',
            'sale_items.unit_price',
            'sale_items.discount',
            'sale_items.flat_discount',
            'sale_items.free_quantity',
            'sale_items.charge_id',
            'sale_items.item_type',
            'sale_items.description',
            'sale_items.charge_type',
            'sale_items.rate_value',
            'sale_items.rate_type',
            'products.name',
            DB::raw("CASE
                WHEN products.product_type = 'reload'
                THEN reload_and_bill_metas.account_number
                ELSE NULL
             END as account_number")
        )
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('reload_and_bill_metas', function ($join) {
                $join->on('sale_items.id', '=', 'reload_and_bill_metas.sale_item_id')
                    ->where('products.product_type', '=', 'reload');
            })
            ->where('sale_items.sale_id', $saleId)
            ->get();

        // Fetch user name
        $user = User::find($sale->created_by);

        return [
            'sale' => $sale,
            'salesItems' => $salesItems,
            'settings' => $settingArray,
            'user_name' => $user->name ?? 'Unknown',
        ];
    }

    /**
     * Get restaurant order receipt data
     *
     * @param int $orderId
     * @param array $options
     * @return array
     */
    public static function getRestaurantReceiptData($orderId, $options = [])
    {
        $imageUrl = '';
        if (app()->environment('production')) {
            $imageUrl = 'public/';
        }

        // Fetch all settings
        $settings = Setting::all();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        $settingArray['shop_logo'] = $imageUrl . $settingArray['shop_logo'];

        // Fetch restaurant order with relationships
        $order = RestaurantOrder::with([
            'table.section',
            'waiter',
            'creator',
            'store',
            'items.product',
            'items.modifiers.modifier',
            'splits.items.orderItem',
            'sale.contact'
        ])->find($orderId);

        if (!$order) {
            return null;
        }

        // Generate QR code URL for digital receipt
        $qrCodeUrl = self::generateDigitalReceiptUrl($order);

        // Get customer loyalty points if applicable
        $loyaltyPoints = self::getCustomerLoyaltyPoints($order);

        // Get split bill information if applicable
        $splitInfo = self::getSplitBillInfo($order);

        return [
            'order' => $order,
            'settings' => $settingArray,
            'qr_code_url' => $qrCodeUrl,
            'loyalty_points' => $loyaltyPoints,
            'split_info' => $splitInfo,
            'options' => $options,
            'receipt_type' => 'restaurant'
        ];
    }

    /**
     * Get split bill receipt data
     *
     * @param int $splitId
     * @return array
     */
    public static function getSplitBillReceiptData($splitId)
    {
        $imageUrl = '';
        if (app()->environment('production')) {
            $imageUrl = 'public/';
        }

        // Fetch all settings
        $settings = Setting::all();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        $settingArray['shop_logo'] = $imageUrl . $settingArray['shop_logo'];

        // Fetch split bill with relationships
        $split = OrderSplit::with([
            'order.table.section',
            'order.waiter',
            'items.orderItem.product',
            'items.orderItem.modifiers.modifier',
            'contact'
        ])->find($splitId);

        if (!$split) {
            return null;
        }

        // Generate QR code URL for digital receipt
        $qrCodeUrl = self::generateDigitalReceiptUrl($split->order, $split);

        return [
            'split' => $split,
            'settings' => $settingArray,
            'qr_code_url' => $qrCodeUrl,
            'receipt_type' => 'split_bill'
        ];
    }

    /**
     * Generate digital receipt URL with QR code
     *
     * @param RestaurantOrder $order
     * @param OrderSplit|null $split
     * @return string
     */
    private static function generateDigitalReceiptUrl($order, $split = null)
    {
        $baseUrl = config('app.url');
        $token = Str::random(40);
        
        // Store token in cache for 30 days
        $cacheKey = "receipt_token_{$token}";
        $data = [
            'order_id' => $order->id,
            'split_id' => $split?->id,
            'expires_at' => now()->addDays(30)->timestamp
        ];
        
        cache([$cacheKey => $data], now()->addDays(30));
        
        return "{$baseUrl}/receipt/digital/{$token}";
    }

    /**
     * Get customer loyalty points information
     *
     * @param RestaurantOrder $order
     * @return array|null
     */
    private static function getCustomerLoyaltyPoints($order)
    {
        if (!$order->sale || !$order->sale->contact_id) {
            return null;
        }

        $contact = Contact::find($order->sale->contact_id);
        if (!$contact) {
            return null;
        }

        // Calculate points earned (example: 1 point per $10 spent)
        $pointsEarned = floor($order->total_amount / 10);
        
        return [
            'customer_id' => $contact->id,
            'customer_name' => $contact->name,
            'current_points' => $contact->loyalty_points ?? 0,
            'points_earned' => $pointsEarned,
            'total_points_after' => ($contact->loyalty_points ?? 0) + $pointsEarned
        ];
    }

    /**
     * Get split bill information
     *
     * @param RestaurantOrder $order
     * @return array|null
     */
    private static function getSplitBillInfo($order)
    {
        if ($order->splits->isEmpty()) {
            return null;
        }

        return [
            'is_split' => true,
            'split_type' => $order->splits->first()->split_type,
            'split_count' => $order->splits->count(),
            'splits' => $order->splits->map(function ($split) {
                return [
                    'id' => $split->id,
                    'split_number' => $split->split_number,
                    'contact_name' => $split->contact?->name ?? 'Guest',
                    'total_amount' => $split->total_amount,
                    'status' => $split->status
                ];
            })
        ];
    }

    /**
     * Get receipt history for a specific date range
     *
     * @param string $startDate
     * @param string $endDate
     * @param int|null $storeId
     * @return array
     */
    public static function getReceiptHistory($startDate, $endDate, $storeId = null)
    {
        $query = RestaurantOrder::with(['table', 'sale.contact'])
            ->whereBetween('order_date', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'paid']);

        if ($storeId) {
            $query->where('store_id', $storeId);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get receipt analytics data
     *
     * @param string $startDate
     * @param string $endDate
     * @param int|null $storeId
     * @return array
     */
    public static function getReceiptAnalytics($startDate, $endDate, $storeId = null)
    {
        $query = RestaurantOrder::whereBetween('order_date', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'paid']);

        if ($storeId) {
            $query->where('store_id', $storeId);
        }

        $totalOrders = $query->count();
        $totalRevenue = $query->sum('total_amount');
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Get order type breakdown
        $orderTypeBreakdown = $query->selectRaw('order_type, COUNT(*) as count, SUM(total_amount) as revenue')
            ->groupBy('order_type')
            ->get();

        // Get payment method breakdown (if available)
        $paymentBreakdown = [];
        if ($storeId) {
            $paymentBreakdown = DB::table('transactions')
                ->join('restaurant_orders', 'transactions.reference_id', '=', 'restaurant_orders.sale_id')
                ->whereBetween('restaurant_orders.order_date', [$startDate, $endDate])
                ->where('restaurant_orders.store_id', $storeId)
                ->selectRaw('payment_method, COUNT(*) as count, SUM(amount) as total')
                ->groupBy('payment_method')
                ->get();
        }

        return [
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'average_order_value' => $averageOrderValue,
            'order_type_breakdown' => $orderTypeBreakdown,
            'payment_breakdown' => $paymentBreakdown,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ];
    }
}
