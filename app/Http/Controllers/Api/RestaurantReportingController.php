<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Restaurant\RestaurantSalesReportingService;
use App\Services\Restaurant\RestaurantAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class RestaurantReportingController extends Controller
{
    protected $salesReportingService;
    protected $analyticsService;

    public function __construct(
        RestaurantSalesReportingService $salesReportingService,
        RestaurantAnalyticsService $analyticsService
    ) {
        $this->salesReportingService = $salesReportingService;
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get real-time sales dashboard data
     */
    public function getRealTimeDashboard(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $result = $this->salesReportingService->generateRealTimeDashboard($storeId);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Real-time dashboard API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate real-time dashboard data'
            ], 500);
        }
    }

    /**
     * Get daily sales report
     */
    public function getDailySalesReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $date = $request->input('date');
            $result = $this->salesReportingService->generateDailySalesReport($storeId, $date);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Daily sales report API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate daily sales report'
            ], 500);
        }
    }

    /**
     * Get weekly sales report
     */
    public function getWeeklySalesReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $result = $this->salesReportingService->generateWeeklySalesReport($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Weekly sales report API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate weekly sales report'
            ], 500);
        }
    }

    /**
     * Get monthly sales report
     */
    public function getMonthlySalesReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'year' => 'required|integer|min:2020|max:2030',
            'month' => 'required|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $year = $request->input('year');
            $month = $request->input('month');
            $result = $this->salesReportingService->generateMonthlySalesReport($storeId, $year, $month);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Monthly sales report API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate monthly sales report'
            ], 500);
        }
    }

    /**
     * Get yearly sales report
     */
    public function getYearlySalesReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'year' => 'required|integer|min:2020|max:2030',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $year = $request->input('year');
            $result = $this->salesReportingService->generateYearlySalesReport($storeId, $year);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Yearly sales report API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate yearly sales report'
            ], 500);
        }
    }

    /**
     * Get custom date range sales reports
     */
    public function getCustomDateRangeReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'report_type' => 'required|in:daily,weekly,monthly,custom',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $reportType = $request->input('report_type');

            $result = match ($reportType) {
                'daily' => $this->salesReportingService->generateDailySalesReport($storeId, $startDate),
                'weekly' => $this->salesReportingService->generateWeeklySalesReport($storeId, $startDate, $endDate),
                'monthly' => $this->salesReportingService->generateMonthlySalesReport($storeId, 
                    Carbon::parse($startDate)->year, Carbon::parse($startDate)->month),
                'custom' => $this->salesReportingService->generateSalesTrendAnalysis($storeId, $startDate, $endDate),
                default => ['success' => false, 'message' => 'Invalid report type'],
            };

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Custom date range report API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate custom date range report'
            ], 500);
        }
    }

    /**
     * Get menu performance analytics
     */
    public function getMenuPerformanceAnalytics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $result = $this->salesReportingService->generateMenuPopularityReport($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Menu performance analytics API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate menu performance analytics'
            ], 500);
        }
    }

    /**
     * Get staff performance metrics
     */
    public function getStaffPerformanceMetrics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'staff_type' => 'sometimes|in:waiters,kitchen_staff,all',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $staffType = $request->input('staff_type', 'waiters');
            
            $result = $this->salesReportingService->generateWaiterPerformanceReport($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Staff performance metrics API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate staff performance metrics'
            ], 500);
        }
    }

    /**
     * Get customer analytics and insights
     */
    public function getCustomerAnalytics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'analysis_type' => 'sometimes|in:behavior,loyalty,lifetime_value,all',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $analysisType = $request->input('analysis_type', 'all');
            
            $result = $this->analyticsService->generateCustomerBehaviorAnalytics($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Customer analytics API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate customer analytics'
            ], 500);
        }
    }

    /**
     * Get peak hour analysis
     */
    public function getPeakHourAnalysis(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $result = $this->salesReportingService->generatePeakHourAnalysis($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Peak hour analysis API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate peak hour analysis'
            ], 500);
        }
    }

    /**
     * Get table turnover report
     */
    public function getTableTurnoverReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $result = $this->salesReportingService->generateTableTurnoverReport($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Table turnover report API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate table turnover report'
            ], 500);
        }
    }

    /**
     * Get business intelligence report
     */
    public function getBusinessIntelligenceReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $result = $this->analyticsService->generateBusinessIntelligenceReport($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Business intelligence report API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate business intelligence report'
            ], 500);
        }
    }

    /**
     * Get profit and loss analysis
     */
    public function getProfitLossAnalysis(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $result = $this->analyticsService->generateProfitLossAnalysis($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Profit and loss analysis API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate profit and loss analysis'
            ], 500);
        }
    }

    /**
     * Get seasonal trend analysis
     */
    public function getSeasonalTrendAnalysis(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'year' => 'required|integer|min:2020|max:2030',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $year = $request->input('year');
            
            $result = $this->analyticsService->generateSeasonalTrendAnalysis($storeId, $year);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Seasonal trend analysis API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate seasonal trend analysis'
            ], 500);
        }
    }

    /**
     * Get predictive analytics
     */
    public function getPredictiveAnalytics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $result = $this->analyticsService->generatePredictiveAnalytics($storeId, $startDate, $endDate);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Predictive analytics API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate predictive analytics'
            ], 500);
        }
    }

    /**
     * Export report in various formats
     */
    public function exportReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'report_type' => 'required|in:daily,weekly,monthly,yearly,custom,menu_performance,staff_performance,customer_analytics,business_intelligence,profit_loss,seasonal_trends,predictive_analytics',
            'format' => 'required|in:pdf,excel,csv,json',
            'start_date' => 'required_unless:report_type,daily,yearly|date_format:Y-m-d',
            'end_date' => 'required_unless:report_type,daily|date_format:Y-m-d|after_or_equal:start_date',
            'year' => 'required_if:report_type,monthly,yearly,seasonal_trends|integer|min:2020|max:2030',
            'month' => 'required_if:report_type,monthly|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $storeId = $request->input('store_id');
            $reportType = $request->input('report_type');
            $format = $request->input('format');
            
            // Generate report data based on type
            $reportData = $this->generateReportData($request);
            
            if (!$reportData['success']) {
                return response()->json($reportData);
            }

            // Export in requested format
            $exportResult = $this->exportInFormat($reportData['data'], $format, $reportType);

            return response()->json($exportResult);
        } catch (\Exception $e) {
            Log::error('Report export API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export report'
            ], 500);
        }
    }

    /**
     * Generate report data based on type
     */
    private function generateReportData(Request $request): array
    {
        $storeId = $request->input('store_id');
        $reportType = $request->input('report_type');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $year = $request->input('year');
        $month = $request->input('month');

        return match ($reportType) {
            'daily' => $this->salesReportingService->generateDailySalesReport($storeId, $startDate),
            'weekly' => $this->salesReportingService->generateWeeklySalesReport($storeId, $startDate, $endDate),
            'monthly' => $this->salesReportingService->generateMonthlySalesReport($storeId, $year, $month),
            'yearly' => $this->salesReportingService->generateYearlySalesReport($storeId, $year),
            'menu_performance' => $this->salesReportingService->generateMenuPopularityReport($storeId, $startDate, $endDate),
            'staff_performance' => $this->salesReportingService->generateWaiterPerformanceReport($storeId, $startDate, $endDate),
            'customer_analytics' => $this->analyticsService->generateCustomerBehaviorAnalytics($storeId, $startDate, $endDate),
            'business_intelligence' => $this->analyticsService->generateBusinessIntelligenceReport($storeId, $startDate, $endDate),
            'profit_loss' => $this->analyticsService->generateProfitLossAnalysis($storeId, $startDate, $endDate),
            'seasonal_trends' => $this->analyticsService->generateSeasonalTrendAnalysis($storeId, $year),
            'predictive_analytics' => $this->analyticsService->generatePredictiveAnalytics($storeId, $startDate, $endDate),
            default => ['success' => false, 'message' => 'Invalid report type'],
        };
    }

    /**
     * Export data in specified format
     */
    private function exportInFormat($data, string $format, string $reportType): array
    {
        try {
            $filename = $reportType . '_report_' . now()->format('Y-m-d_H-i-s');
            
            return match ($format) {
                'json' => [
                    'success' => true,
                    'data' => $data,
                    'filename' => $filename . '.json',
                    'content_type' => 'application/json',
                ],
                'csv' => [
                    'success' => true,
                    'data' => $this->convertToCSV($data),
                    'filename' => $filename . '.csv',
                    'content_type' => 'text/csv',
                ],
                'excel' => [
                    'success' => true,
                    'data' => $this->convertToExcel($data),
                    'filename' => $filename . '.xlsx',
                    'content_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ],
                'pdf' => [
                    'success' => true,
                    'data' => $this->convertToPDF($data),
                    'filename' => $filename . '.pdf',
                    'content_type' => 'application/pdf',
                ],
                default => [
                    'success' => false,
                    'message' => 'Unsupported export format',
                ],
            };
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Convert data to CSV
     */
    private function convertToCSV($data): string
    {
        // Simplified CSV conversion
        $csv = '';
        foreach ($data as $row) {
            if (is_array($row)) {
                $csv .= implode(',', $row) . "\n";
            }
        }
        return $csv;
    }

    /**
     * Convert data to Excel format
     */
    private function convertToExcel($data): array
    {
        // This would use a library like Laravel Excel
        // For now, return data as-is
        return $data;
    }

    /**
     * Convert data to PDF
     */
    private function convertToPDF($data): array
    {
        // This would use a library like DomPDF
        // For now, return data as-is
        return $data;
    }
}