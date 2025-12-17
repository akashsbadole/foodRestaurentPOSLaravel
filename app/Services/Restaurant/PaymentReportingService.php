<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantPayment;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class PaymentReportingService
{
    /**
     * Update sales reports on payment completion
     */
    public function updateSalesReportsOnPayment(RestaurantOrder $order, RestaurantPayment $payment): array
    {
        try {
            // Update daily sales summary
            $this->updateDailySalesSummary($order, $payment);
            
            // Update payment method analytics
            $this->updatePaymentMethodAnalytics($payment);
            
            // Update revenue by payment type
            $this->updateRevenueByPaymentType($order, $payment);
            
            // Update tax reporting
            $this->updateTaxReporting($order, $payment);
            
            // Update tip reporting
            $this->updateTipReporting($payment);
            
            // Update sales dashboard data
            $this->updateSalesDashboard($order, $payment);
            
            Log::info('Sales reports updated on payment', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'amount' => $payment->total_amount,
            ]);
            
            return [
                'success' => true,
                'message' => 'Sales reports updated successfully',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to update sales reports on payment', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to update sales reports: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update sales reports on refund
     */
    public function updateSalesReportsOnRefund(RestaurantOrder $order, RestaurantPayment $payment, float $refundAmount): array
    {
        try {
            // Update daily sales summary (negative adjustment)
            $this->updateDailySalesSummary($order, $payment, $refundAmount, true);
            
            // Update payment method analytics (negative adjustment)
            $this->updatePaymentMethodAnalytics($payment, $refundAmount, true);
            
            // Update revenue by payment type (negative adjustment)
            $this->updateRevenueByPaymentType($order, $payment, $refundAmount, true);
            
            // Update tax reporting (negative adjustment)
            $this->updateTaxReporting($order, $payment, $refundAmount, true);
            
            // Update tip reporting (negative adjustment)
            $this->updateTipReporting($payment, $refundAmount, true);
            
            // Update sales dashboard data (negative adjustment)
            $this->updateSalesDashboard($order, $payment, $refundAmount, true);
            
            Log::info('Sales reports updated on refund', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'refund_amount' => $refundAmount,
            ]);
            
            return [
                'success' => true,
                'message' => 'Sales reports updated successfully on refund',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to update sales reports on refund', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'refund_amount' => $refundAmount,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to update sales reports on refund: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get comprehensive payment analytics
     */
    public function getPaymentAnalytics(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $payments = RestaurantPayment::forStore($storeId)
                ->byDateRange($startDate, $endDate)
                ->with(['order', 'customer'])
                ->get();

            return [
                'success' => true,
                'data' => [
                    'summary' => $this->getPaymentSummary($payments),
                    'payment_methods' => $this->getPaymentMethodBreakdown($payments),
                    'payment_types' => $this->getPaymentTypeBreakdown($payments),
                    'hourly_breakdown' => $this->getHourlyBreakdown($payments),
                    'daily_breakdown' => $this->getDailyBreakdown($payments, $startDate, $endDate),
                    'tips_analysis' => $this->getTipsAnalysis($payments),
                    'refunds_analysis' => $this->getRefundsAnalysis($payments),
                    'average_transaction' => $this->getAverageTransactionMetrics($payments),
                    'top_payment_methods' => $this->getTopPaymentMethods($payments),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get payment analytics', [
                'store_id' => $storeId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to get payment analytics: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get revenue by payment type
     */
    public function getRevenueByPaymentType(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $payments = RestaurantPayment::forStore($storeId)
                ->byDateRange($startDate, $endDate)
                ->get();

            $revenueByType = $payments->groupBy('payment_method')->map(function ($methodPayments) {
                return [
                    'payment_method' => $methodPayments->first()->payment_method,
                    'payment_method_display' => $methodPayments->first()->payment_method_display_name,
                    'total_revenue' => $methodPayments->sum('total_amount'),
                    'total_tips' => $methodPayments->sum('tip_amount'),
                    'total_processing_fees' => $methodPayments->sum('processing_fee'),
                    'net_revenue' => $methodPayments->sum('amount'),
                    'transaction_count' => $methodPayments->count(),
                    'average_transaction' => $methodPayments->avg('total_amount'),
                    'refund_count' => $methodPayments->where('status', 'refunded')->count(),
                    'refund_amount' => $methodPayments->sum('refunded_amount'),
                    'net_revenue_after_refunds' => $methodPayments->sum('total_amount') - $methodPayments->sum('refunded_amount'),
                ];
            });

            return [
                'success' => true,
                'data' => [
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'total_revenue' => $payments->sum('total_amount'),
                    'total_tips' => $payments->sum('tip_amount'),
                    'total_processing_fees' => $payments->sum('processing_fee'),
                    'net_revenue' => $payments->sum('amount'),
                    'total_transactions' => $payments->count(),
                    'total_refunds' => $payments->where('status', 'refunded')->count(),
                    'total_refund_amount' => $payments->sum('refunded_amount'),
                    'revenue_by_type' => $revenueByType->values(),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get revenue by payment type', [
                'store_id' => $storeId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to get revenue by payment type: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get daily sales summary
     */
    public function getDailySalesSummary(int $storeId, string $date): array
    {
        try {
            $payments = RestaurantPayment::forStore($storeId)
                ->byDate($date)
                ->with(['order'])
                ->get();

            $orders = RestaurantOrder::forStore($storeId)
                ->byDate($date)
                ->with(['items'])
                ->get();

            return [
                'success' => true,
                'data' => [
                    'date' => $date,
                    'total_revenue' => $payments->sum('total_amount'),
                    'net_revenue' => $payments->sum('amount'),
                    'total_tips' => $payments->sum('tip_amount'),
                    'total_processing_fees' => $payments->sum('processing_fee'),
                    'total_orders' => $orders->count(),
                    'paid_orders' => $orders->where('payment_status', 'paid')->count(),
                    'total_transactions' => $payments->count(),
                    'average_order_value' => $orders->count() > 0 ? $orders->sum('final_total') / $orders->count() : 0,
                    'average_transaction_value' => $payments->count() > 0 ? $payments->sum('total_amount') / $payments->count() : 0,
                    'payment_methods_breakdown' => $this->getPaymentMethodBreakdown($payments),
                    'hourly_sales' => $this->getHourlyBreakdown($payments),
                    'refund_count' => $payments->where('status', 'refunded')->count(),
                    'refund_amount' => $payments->sum('refunded_amount'),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get daily sales summary', [
                'store_id' => $storeId,
                'date' => $date,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to get daily sales summary: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update daily sales summary
     */
    private function updateDailySalesSummary(RestaurantOrder $order, RestaurantPayment $payment, float $adjustmentAmount = null, bool $isRefund = false): void
    {
        $date = $payment->created_at->format('Y-m-d');
        $amount = $adjustmentAmount ?? $payment->total_amount;
        
        // In a real implementation, this would update a daily_sales_summary table
        // For now, we'll log the update
        Log::info('Daily sales summary updated', [
            'date' => $date,
            'store_id' => $order->store_id,
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'amount' => $amount,
            'is_refund' => $isRefund,
            'payment_method' => $payment->payment_method,
        ]);
    }

    /**
     * Update payment method analytics
     */
    private function updatePaymentMethodAnalytics(RestaurantPayment $payment, float $adjustmentAmount = null, bool $isRefund = false): void
    {
        $amount = $adjustmentAmount ?? $payment->total_amount;
        
        // In a real implementation, this would update a payment_method_analytics table
        Log::info('Payment method analytics updated', [
            'date' => $payment->created_at->format('Y-m-d'),
            'store_id' => $payment->store_id,
            'payment_method' => $payment->payment_method,
            'amount' => $amount,
            'is_refund' => $isRefund,
        ]);
    }

    /**
     * Update revenue by payment type
     */
    private function updateRevenueByPaymentType(RestaurantOrder $order, RestaurantPayment $payment, float $adjustmentAmount = null, bool $isRefund = false): void
    {
        $amount = $adjustmentAmount ?? $payment->total_amount;
        
        // In a real implementation, this would update a revenue_by_payment_type table
        Log::info('Revenue by payment type updated', [
            'date' => $payment->created_at->format('Y-m-d'),
            'store_id' => $order->store_id,
            'order_type' => $order->order_type,
            'payment_method' => $payment->payment_method,
            'amount' => $amount,
            'is_refund' => $isRefund,
        ]);
    }

    /**
     * Update tax reporting
     */
    private function updateTaxReporting(RestaurantOrder $order, RestaurantPayment $payment, float $adjustmentAmount = null, bool $isRefund = false): void
    {
        $amount = $adjustmentAmount ?? $payment->total_amount;
        
        // In a real implementation, this would update a tax_reporting table
        Log::info('Tax reporting updated', [
            'date' => $payment->created_at->format('Y-m-d'),
            'store_id' => $order->store_id,
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'tax_amount' => $order->tax_amount,
            'amount' => $amount,
            'is_refund' => $isRefund,
        ]);
    }

    /**
     * Update tip reporting
     */
    private function updateTipReporting(RestaurantPayment $payment, float $adjustmentAmount = null, bool $isRefund = false): void
    {
        $tipAmount = $adjustmentAmount ? ($payment->tip_amount / $payment->total_amount) * $adjustmentAmount : $payment->tip_amount;
        
        // In a real implementation, this would update a tip_reporting table
        Log::info('Tip reporting updated', [
            'date' => $payment->created_at->format('Y-m-d'),
            'store_id' => $payment->store_id,
            'payment_id' => $payment->id,
            'tip_amount' => $tipAmount,
            'is_refund' => $isRefund,
        ]);
    }

    /**
     * Update sales dashboard
     */
    private function updateSalesDashboard(RestaurantOrder $order, RestaurantPayment $payment, float $adjustmentAmount = null, bool $isRefund = false): void
    {
        $amount = $adjustmentAmount ?? $payment->total_amount;
        
        // In a real implementation, this would update dashboard cache or real-time data
        Log::info('Sales dashboard updated', [
            'date' => $payment->created_at->format('Y-m-d'),
            'store_id' => $order->store_id,
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'amount' => $amount,
            'is_refund' => $isRefund,
        ]);
    }

    /**
     * Get payment summary
     */
    private function getPaymentSummary($payments): array
    {
        return [
            'total_payments' => $payments->count(),
            'total_revenue' => $payments->sum('total_amount'),
            'net_revenue' => $payments->sum('amount'),
            'total_tips' => $payments->sum('tip_amount'),
            'total_processing_fees' => $payments->sum('processing_fee'),
            'total_refunds' => $payments->where('status', 'refunded')->count(),
            'total_refund_amount' => $payments->sum('refunded_amount'),
            'net_revenue_after_refunds' => $payments->sum('total_amount') - $payments->sum('refunded_amount'),
            'average_transaction_value' => $payments->count() > 0 ? $payments->sum('total_amount') / $payments->count() : 0,
        ];
    }

    /**
     * Get payment method breakdown
     */
    private function getPaymentMethodBreakdown($payments): array
    {
        return $payments->groupBy('payment_method')->map(function ($methodPayments) {
            return [
                'payment_method' => $methodPayments->first()->payment_method,
                'payment_method_display' => $methodPayments->first()->payment_method_display_name,
                'count' => $methodPayments->count(),
                'amount' => $methodPayments->sum('total_amount'),
                'percentage' => round(($methodPayments->sum('total_amount') / $payments->sum('total_amount')) * 100, 2),
            ];
        })->values()->toArray();
    }

    /**
     * Get payment type breakdown
     */
    private function getPaymentTypeBreakdown($payments): array
    {
        return $payments->groupBy('payment_type')->map(function ($typePayments) {
            return [
                'payment_type' => $typePayments->first()->payment_type,
                'count' => $typePayments->count(),
                'amount' => $typePayments->sum('total_amount'),
                'percentage' => round(($typePayments->sum('total_amount') / $payments->sum('total_amount')) * 100, 2),
            ];
        })->values()->toArray();
    }

    /**
     * Get hourly breakdown
     */
    private function getHourlyBreakdown($payments): array
    {
        $hourlyData = [];
        
        for ($hour = 0; $hour < 24; $hour++) {
            $hourlyPayments = $payments->filter(function ($payment) use ($hour) {
                return $payment->created_at->hour === $hour;
            });
            
            $hourlyData[] = [
                'hour' => $hour,
                'count' => $hourlyPayments->count(),
                'amount' => $hourlyPayments->sum('total_amount'),
            ];
        }
        
        return $hourlyData;
    }

    /**
     * Get daily breakdown
     */
    private function getDailyBreakdown($payments, string $startDate, string $endDate): array
    {
        $period = CarbonPeriod::create($startDate, $endDate);
        $dailyData = [];
        
        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $dailyPayments = $payments->filter(function ($payment) use ($dateStr) {
                return $payment->created_at->format('Y-m-d') === $dateStr;
            });
            
            $dailyData[] = [
                'date' => $dateStr,
                'count' => $dailyPayments->count(),
                'amount' => $dailyPayments->sum('total_amount'),
            ];
        }
        
        return $dailyData;
    }

    /**
     * Get tips analysis
     */
    private function getTipsAnalysis($payments): array
    {
        $paymentsWithTips = $payments->where('tip_amount', '>', 0);
        
        return [
            'total_tips' => $payments->sum('tip_amount'),
            'average_tip' => $paymentsWithTips->count() > 0 ? $paymentsWithTips->avg('tip_amount') : 0,
            'tip_rate' => $payments->sum('amount') > 0 ? round(($payments->sum('tip_amount') / $payments->sum('amount')) * 100, 2) : 0,
            'payments_with_tips' => $paymentsWithTips->count(),
            'tip_percentage' => $payments->count() > 0 ? round(($paymentsWithTips->count() / $payments->count()) * 100, 2) : 0,
        ];
    }

    /**
     * Get refunds analysis
     */
    private function getRefundsAnalysis($payments): array
    {
        $refundedPayments = $payments->where('status', 'refunded');
        
        return [
            'total_refunds' => $refundedPayments->count(),
            'total_refund_amount' => $payments->sum('refunded_amount'),
            'refund_rate' => $payments->count() > 0 ? round(($refundedPayments->count() / $payments->count()) * 100, 2) : 0,
            'average_refund_amount' => $refundedPayments->count() > 0 ? $refundedPayments->avg('refunded_amount') : 0,
            'refund_reasons' => $refundedPayments->groupBy('refund_reason')->map(function ($reasonPayments) {
                return [
                    'reason' => $reasonPayments->first()->refund_reason,
                    'count' => $reasonPayments->count(),
                    'amount' => $reasonPayments->sum('refunded_amount'),
                ];
            })->values()->toArray(),
        ];
    }

    /**
     * Get average transaction metrics
     */
    private function getAverageTransactionMetrics($payments): array
    {
        return [
            'average_transaction_value' => $payments->count() > 0 ? $payments->avg('total_amount') : 0,
            'average_tip_amount' => $payments->count() > 0 ? $payments->avg('tip_amount') : 0,
            'average_processing_fee' => $payments->count() > 0 ? $payments->avg('processing_fee') : 0,
            'median_transaction_value' => $this->calculateMedian($payments->pluck('total_amount')->toArray()),
        ];
    }

    /**
     * Get top payment methods
     */
    private function getTopPaymentMethods($payments, int $limit = 5): array
    {
        return $payments->groupBy('payment_method')
            ->map(function ($methodPayments) {
                return [
                    'payment_method' => $methodPayments->first()->payment_method,
                    'payment_method_display' => $methodPayments->first()->payment_method_display_name,
                    'count' => $methodPayments->count(),
                    'amount' => $methodPayments->sum('total_amount'),
                ];
            })
            ->sortByDesc('amount')
            ->take($limit)
            ->values()
            ->toArray();
    }

    /**
     * Calculate median value
     */
    private function calculateMedian(array $values): float
    {
        sort($values);
        $count = count($values);
        
        if ($count === 0) {
            return 0;
        }
        
        $middle = floor($count / 2);
        
        if ($count % 2 === 0) {
            return ($values[$middle - 1] + $values[$middle]) / 2;
        } else {
            return $values[$middle];
        }
    }
}