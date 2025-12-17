<?php

namespace App\Http\Controllers;

use App\Services\InventoryReportingService;
use App\Services\InventoryRealTimeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InventoryReportingController extends Controller
{
    protected InventoryReportingService $reportingService;
    protected InventoryRealTimeService $realTimeService;

    public function __construct(
        InventoryReportingService $reportingService,
        InventoryRealTimeService $realTimeService
    ) {
        $this->reportingService = $reportingService;
        $this->realTimeService = $realTimeService;
    }

    /**
     * Generate inventory valuation report
     */
    public function generateInventoryValuation(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $result = $this->reportingService->generateInventoryValuationReport(
                $storeId,
                $startDate,
                $endDate
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to generate inventory valuation report', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate inventory valuation report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate food cost analysis report
     */
    public function generateFoodCostAnalysis(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);

            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $result = $this->reportingService->generateFoodCostAnalysisReport(
                $storeId,
                $startDate,
                $endDate
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to generate food cost analysis report', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate food cost analysis report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate waste and spoilage report
     */
    public function generateWasteSpoilageReport(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);

            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $result = $this->reportingService->generateWasteSpoilageReport(
                $storeId,
                $startDate,
                $endDate
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to generate waste and spoilage report', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate waste and spoilage report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate inventory turnover report
     */
    public function generateInventoryTurnover(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);

            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $result = $this->reportingService->generateInventoryTurnoverReport(
                $storeId,
                $startDate,
                $endDate
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to generate inventory turnover report', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate inventory turnover report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate ingredient usage report
     */
    public function generateIngredientUsage(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);

            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $result = $this->reportingService->generateIngredientUsageReport(
                $storeId,
                $startDate,
                $endDate
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to generate ingredient usage report', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate ingredient usage report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate variance analysis report
     */
    public function generateVarianceAnalysis(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);

            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $result = $this->reportingService->generateVarianceAnalysisReport(
                $storeId,
                $startDate,
                $endDate
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to generate variance analysis report', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate variance analysis report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive inventory dashboard data
     */
    public function getInventoryDashboard(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
            ]);

            $storeId = $request->input('store_id');
            $endDate = now();
            $startDate = now()->subDays(30);

            // Generate multiple reports for dashboard
            $valuationResult = $this->reportingService->generateInventoryValuationReport($storeId);
            $foodCostResult = $this->reportingService->generateFoodCostAnalysisReport($storeId, $startDate->format('Y-m-d'), $endDate->format('Y-m-d'));
            $turnoverResult = $this->reportingService->generateInventoryTurnoverReport($storeId, $startDate->format('Y-m-d'), $endDate->format('Y-m-d'));

            $dashboardData = [
                'store_id' => $storeId,
                'dashboard_type' => 'inventory_overview',
                'generated_at' => now()->toISOString(),
                'period' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                ],
                'key_metrics' => [
                    'total_products' => $valuationResult['data']['summary']['total_products'] ?? 0,
                    'total_stock_value' => $valuationResult['data']['summary']['total_value'] ?? 0,
                    'low_stock_items' => count($valuationResult['data']['low_stock_items'] ?? []),
                    'out_of_stock_items' => count($valuationResult['data']['out_of_stock_items'] ?? []),
                    'expiring_items' => count($valuationResult['data']['expiring_items'] ?? []),
                    'average_food_cost_percentage' => $foodCostResult['data']['summary']['average_food_cost_percentage'] ?? 0,
                    'average_turnover_ratio' => $turnoverResult['data']['summary']['average_turnover_ratio'] ?? 0,
                ],
                'alerts' => [
                    'critical_stock_alerts' => $valuationResult['data']['out_of_stock_items'] ?? [],
                    'low_stock_alerts' => array_slice($valuationResult['data']['low_stock_items'] ?? [], 0, 5),
                    'expiring_items' => array_slice($valuationResult['data']['expiring_items'] ?? [], 0, 5),
                ],
                'charts' => [
                    'stock_by_category' => $valuationResult['data']['categories'] ?? [],
                    'top_value_items' => array_slice($valuationResult['data']['top_value_items'] ?? [], 0, 10),
                    'food_cost_trends' => $this->generateFoodCostTrends($storeId, $startDate, $endDate),
                    'stock_movement_trends' => $this->generateStockMovementTrends($storeId, $startDate, $endDate),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $dashboardData,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate inventory dashboard', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate inventory dashboard: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export report to CSV
     */
    public function exportReportToCsv(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
                'report_type' => 'required|string|in:valuation,food_cost,waste,turnover,usage,variance',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            $storeId = $request->input('store_id');
            $reportType = $request->input('report_type');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            // Generate the report based on type
            $result = match ($reportType) {
                'valuation' => $this->reportingService->generateInventoryValuationReport($storeId, $startDate, $endDate),
                'food_cost' => $this->reportingService->generateFoodCostAnalysisReport($storeId, $startDate, $endDate),
                'waste' => $this->reportingService->generateWasteSpoilageReport($storeId, $startDate, $endDate),
                'turnover' => $this->reportingService->generateInventoryTurnoverReport($storeId, $startDate, $endDate),
                'usage' => $this->reportingService->generateIngredientUsageReport($storeId, $startDate, $endDate),
                'variance' => $this->reportingService->generateVarianceAnalysisReport($storeId, $startDate, $endDate),
                default => throw new \InvalidArgumentException('Invalid report type'),
            };

            if (!$result['success']) {
                return response()->json($result, 400);
            }

            // Generate CSV content (simplified)
            $csvContent = $this->generateCsvFromReportData($result['data'], $reportType);
            $filename = "inventory_{$reportType}_report_" . now()->format('Y-m-d_H-i-s') . ".csv";

            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => $filename,
                    'content' => $csvContent,
                    'download_url' => "/api/inventory/reports/download/{$filename}",
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to export report to CSV', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'report_type' => $request->input('report_type'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export report to CSV: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get real-time inventory updates
     */
    public function getRealTimeUpdates(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'store_id' => 'required|integer|exists:stores,id',
                'last_update' => 'nullable|date',
            ]);

            $storeId = $request->input('store_id');
            $lastUpdate = $request->input('last_update');

            $updates = $this->realTimeService->getUpdatesSince($storeId, $lastUpdate);

            return response()->json([
                'success' => true,
                'data' => $updates,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get real-time inventory updates', [
                'user_id' => Auth::id(),
                'store_id' => $request->input('store_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get real-time inventory updates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate food cost trends data
     */
    private function generateFoodCostTrends(int $storeId, Carbon $startDate, Carbon $endDate): array
    {
        // This would generate trend data for charts
        // For now, return sample data
        return [
            'labels' => ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            'datasets' => [
                [
                    'label' => 'Food Cost %',
                    'data' => [28.5, 29.2, 27.8, 28.9],
                    'borderColor' => 'rgb(255, 99, 132)',
                    'backgroundColor' => 'rgba(255, 99, 132, 0.2)',
                ],
            ],
        ];
    }

    /**
     * Generate stock movement trends data
     */
    private function generateStockMovementTrends(int $storeId, Carbon $startDate, Carbon $endDate): array
    {
        // This would generate trend data for charts
        // For now, return sample data
        return [
            'labels' => ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            'datasets' => [
                [
                    'label' => 'Stock In',
                    'data' => [1200, 1350, 1100, 1450],
                    'borderColor' => 'rgb(54, 162, 235)',
                    'backgroundColor' => 'rgba(54, 162, 235, 0.2)',
                ],
                [
                    'label' => 'Stock Out',
                    'data' => [980, 1120, 1050, 1200],
                    'borderColor' => 'rgb(255, 159, 64)',
                    'backgroundColor' => 'rgba(255, 159, 64, 0.2)',
                ],
            ],
        ];
    }

    /**
     * Generate CSV from report data
     */
    private function generateCsvFromReportData(array $data, string $reportType): string
    {
        // Simplified CSV generation
        // In a real implementation, this would be more sophisticated
        $csv = "Report Type: {$reportType}\n";
        $csv .= "Generated At: " . now()->format('Y-m-d H:i:s') . "\n\n";

        switch ($reportType) {
            case 'valuation':
                $csv .= "Product Name,SKU,Current Stock,Unit Cost,Total Value\n";
                // Add data rows here
                break;
            case 'food_cost':
                $csv .= "Product Name,Total Revenue,Total Cost,Food Cost %,Profit Margin\n";
                // Add data rows here
                break;
            // Add other report types as needed
        }

        return $csv;
    }
}