<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Restaurant\RestaurantSalesReportingService;
use App\Services\Restaurant\RestaurantAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Inertia\Inertia;

class RestaurantReportController extends Controller
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
     * Display reporting dashboard
     */
    public function dashboard(Request $request)
    {
        $stores = $this->getUserStores();
        
        return Inertia::render('Restaurant/Reports/Dashboard', [
            'stores' => $stores,
            'pageLabel' => 'Restaurant Reports Dashboard',
        ]);
    }

    /**
     * Display real-time sales dashboard
     */
    public function realTimeDashboard(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator->errors())
                ->withInput();
        }

        try {
            $storeId = $request->input('store_id');
            
            // Check cache first
            $cacheKey = "realtime_dashboard_{$storeId}";
            $dashboardData = Cache::remember($cacheKey, 60, function () use ($storeId) {
                return $this->salesReportingService->generateRealTimeDashboard($storeId);
            });

            if (!$dashboardData['success']) {
                return redirect()->back()
                    ->with('error', $dashboardData['message']);
            }

            $stores = $this->getUserStores();
            
            return Inertia::render('Restaurant/Reports/RealTimeDashboard', [
                'stores' => $stores,
                'dashboardData' => $dashboardData['data'],
                'selectedStore' => $storeId,
                'pageLabel' => 'Real-Time Sales Dashboard',
            ]);
        } catch (\Exception $e) {
            Log::error('Real-time dashboard error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to load real-time dashboard data');
        }
    }

    /**
     * Display sales reports page
     */
    public function salesReports(Request $request)
    {
        $stores = $this->getUserStores();
        
        return Inertia::render('Restaurant/Reports/SalesReports', [
            'stores' => $stores,
            'pageLabel' => 'Sales Reports',
        ]);
    }

    /**
     * Generate and display sales report
     */
    public function generateSalesReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'report_period' => 'required|in:daily,weekly,monthly,yearly,custom',
            'start_date' => 'required_unless:report_period,daily|date_format:Y-m-d',
            'end_date' => 'required_unless:report_period,daily|date_format:Y-m-d|after_or_equal:start_date',
            'date' => 'required_if:report_period,daily|date_format:Y-m-d',
            'year' => 'required_if:report_period,monthly,yearly|integer|min:2020|max:2030',
            'month' => 'required_if:report_period,monthly|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator->errors())
                ->withInput();
        }

        try {
            $storeId = $request->input('store_id');
            $reportPeriod = $request->input('report_period');
            
            // Generate report based on period
            $result = match ($reportPeriod) {
                'daily' => $this->salesReportingService->generateDailySalesReport(
                    $storeId, $request->input('date')
                ),
                'weekly' => $this->salesReportingService->generateWeeklySalesReport(
                    $storeId, $request->input('start_date'), $request->input('end_date')
                ),
                'monthly' => $this->salesReportingService->generateMonthlySalesReport(
                    $storeId, $request->input('year'), $request->input('month')
                ),
                'yearly' => $this->salesReportingService->generateYearlySalesReport(
                    $storeId, $request->input('year')
                ),
                'custom' => $this->salesReportingService->generateSalesTrendAnalysis(
                    $storeId, $request->input('start_date'), $request->input('end_date')
                ),
                default => ['success' => false, 'message' => 'Invalid report period'],
            };

            if (!$result['success']) {
                return redirect()->back()
                    ->with('error', $result['message']);
            }

            // Cache the report
            $cacheKey = "sales_report_{$storeId}_{$reportPeriod}_" . 
                ($request->input('date') ?? $request->input('start_date')) . "_" . 
                time();
            Cache::put($cacheKey, $result, 3600); // Cache for 1 hour

            $stores = $this->getUserStores();
            
            return Inertia::render('Restaurant/Reports/SalesReportView', [
                'stores' => $stores,
                'reportData' => $result['data'],
                'reportPeriod' => $reportPeriod,
                'selectedStore' => $storeId,
                'pageLabel' => 'Sales Report - ' . ucfirst($reportPeriod),
            ]);
        } catch (\Exception $e) {
            Log::error('Sales report generation error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to generate sales report');
        }
    }

    /**
     * Display menu performance page
     */
    public function menuPerformance(Request $request)
    {
        $stores = $this->getUserStores();
        
        return Inertia::render('Restaurant/Reports/MenuPerformance', [
            'stores' => $stores,
            'pageLabel' => 'Menu Performance Analytics',
        ]);
    }

    /**
     * Generate menu performance report
     */
    public function generateMenuPerformanceReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator->errors())
                ->withInput();
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $result = $this->salesReportingService->generateMenuPopularityReport(
                $storeId, $startDate, $endDate
            );

            if (!$result['success']) {
                return redirect()->back()
                    ->with('error', $result['message']);
            }

            $stores = $this->getUserStores();
            
            return Inertia::render('Restaurant/Reports/MenuPerformanceView', [
                'stores' => $stores,
                'reportData' => $result['data'],
                'selectedStore' => $storeId,
                'period' => ['start_date' => $startDate, 'end_date' => $endDate],
                'pageLabel' => 'Menu Performance Report',
            ]);
        } catch (\Exception $e) {
            Log::error('Menu performance report generation error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to generate menu performance report');
        }
    }

    /**
     * Display staff performance page
     */
    public function staffPerformance(Request $request)
    {
        $stores = $this->getUserStores();
        
        return Inertia::render('Restaurant/Reports/StaffPerformance', [
            'stores' => $stores,
            'pageLabel' => 'Staff Performance Analytics',
        ]);
    }

    /**
     * Generate staff performance report
     */
    public function generateStaffPerformanceReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'staff_type' => 'sometimes|in:waiters,kitchen_staff,all',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator->errors())
                ->withInput();
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $staffType = $request->input('staff_type', 'waiters');
            
            $result = $this->salesReportingService->generateWaiterPerformanceReport(
                $storeId, $startDate, $endDate
            );

            if (!$result['success']) {
                return redirect()->back()
                    ->with('error', $result['message']);
            }

            $stores = $this->getUserStores();
            
            return Inertia::render('Restaurant/Reports/StaffPerformanceView', [
                'stores' => $stores,
                'reportData' => $result['data'],
                'selectedStore' => $storeId,
                'staffType' => $staffType,
                'period' => ['start_date' => $startDate, 'end_date' => $endDate],
                'pageLabel' => 'Staff Performance Report',
            ]);
        } catch (\Exception $e) {
            Log::error('Staff performance report generation error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to generate staff performance report');
        }
    }

    /**
     * Display business intelligence page
     */
    public function businessIntelligence(Request $request)
    {
        $stores = $this->getUserStores();
        
        return Inertia::render('Restaurant/Reports/BusinessIntelligence', [
            'stores' => $stores,
            'pageLabel' => 'Business Intelligence',
        ]);
    }

    /**
     * Generate business intelligence report
     */
    public function generateBusinessIntelligenceReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator->errors())
                ->withInput();
        }

        try {
            $storeId = $request->input('store_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $result = $this->analyticsService->generateBusinessIntelligenceReport(
                $storeId, $startDate, $endDate
            );

            if (!$result['success']) {
                return redirect()->back()
                    ->with('error', $result['message']);
            }

            $stores = $this->getUserStores();
            
            return Inertia::render('Restaurant/Reports/BusinessIntelligenceView', [
                'stores' => $stores,
                'reportData' => $result['data'],
                'selectedStore' => $storeId,
                'period' => ['start_date' => $startDate, 'end_date' => $endDate],
                'pageLabel' => 'Business Intelligence Report',
            ]);
        } catch (\Exception $e) {
            Log::error('Business intelligence report generation error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to generate business intelligence report');
        }
    }

    /**
     * Export report with caching and scheduling
     */
    public function exportReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|integer|exists:stores,id',
            'report_type' => 'required|in:daily,weekly,monthly,yearly,custom,menu_performance,staff_performance,customer_analytics,business_intelligence,profit_loss,seasonal_trends,predictive_analytics',
            'format' => 'required|in:pdf,excel,csv,json',
            'start_date' => 'required_unless:report_type,daily,yearly|date_format:Y-m-d',
            'end_date' => 'required_unless:report_type,daily|date_format:Y-m-d|after_or_equal:start_date',
            'year' => 'required_if:report_type,monthly,yearly,seasonal_trends|integer|min:2020|max:2030',
            'month' => 'required_if:report_type,monthly|integer|min:1|max:12',
            'schedule_report' => 'boolean',
            'email_recipients' => 'sometimes|array',
            'email_recipients.*' => 'email',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator->errors())
                ->withInput();
        }

        try {
            $storeId = $request->input('store_id');
            $reportType = $request->input('report_type');
            $format = $request->input('format');
            $scheduleReport = $request->input('schedule_report', false);
            $emailRecipients = $request->input('email_recipients', []);

            // Generate report data
            $reportData = $this->generateReportDataForExport($request);
            
            if (!$reportData['success']) {
                return redirect()->back()
                    ->with('error', $reportData['message']);
            }

            // Export in requested format
            $exportResult = $this->exportReportInFormat($reportData['data'], $format, $reportType);
            
            if (!$exportResult['success']) {
                return redirect()->back()
                    ->with('error', $exportResult['message']);
            }

            // Handle scheduling if requested
            if ($scheduleReport) {
                $this->scheduleReportDelivery($storeId, $reportType, $emailRecipients, $request);
            }

            // Store file and provide download
            $filename = $exportResult['filename'];
            $content = $exportResult['data'];
            $contentType = $exportResult['content_type'];

            // Store file temporarily
            $path = 'exports/' . $filename;
            Storage::put($path, $content);

            // Handle email delivery
            if (!empty($emailRecipients)) {
                $this->emailReport($filename, $path, $emailRecipients, $reportData['data']);
            }

            $stores = $this->getUserStores();
            
            return Inertia::render('Restaurant/Reports/ExportComplete', [
                'stores' => $stores,
                'downloadUrl' => Storage::url($path),
                'filename' => $filename,
                'reportType' => $reportType,
                'format' => $format,
                'pageLabel' => 'Report Export Complete',
            ]);
        } catch (\Exception $e) {
            Log::error('Report export error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to export report');
        }
    }

    /**
     * Handle report sharing and collaboration
     */
    public function shareReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'report_id' => 'required|string',
            'share_type' => 'required|in:link,email,embed',
            'recipients' => 'required_if:share_type,email|array',
            'recipients.*' => 'email',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'in:view,edit,download',
            'expires_at' => 'sometimes|date|after:now',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator->errors())
                ->withInput();
        }

        try {
            $reportId = $request->input('report_id');
            $shareType = $request->input('share_type');
            $recipients = $request->input('recipients', []);
            $permissions = $request->input('permissions', ['view']);
            $expiresAt = $request->input('expires_at');

            $shareResult = $this->createReportShare($reportId, $shareType, $recipients, $permissions, $expiresAt);
            
            if (!$shareResult['success']) {
                return redirect()->back()
                    ->with('error', $shareResult['message']);
            }

            return redirect()->back()
                ->with('success', 'Report shared successfully')
                ->with('shareData', $shareResult['data']);
        } catch (\Exception $e) {
            Log::error('Report sharing error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to share report');
        }
    }

    /**
     * Get user's accessible stores
     */
    private function getUserStores(): array
    {
        if (auth()->user()->user_role === 'admin' || auth()->user()->user_role === 'super-admin') {
            return \App\Models\Store::select('id', 'name')->get()->toArray();
        }
        
        return \App\Models\Store::where('id', auth()->user()->store_id)
            ->select('id', 'name')
            ->get()
            ->toArray();
    }

    /**
     * Generate report data for export
     */
    private function generateReportDataForExport(Request $request): array
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
     * Export report in specified format
     */
    private function exportReportInFormat($data, string $format, string $reportType): array
    {
        try {
            $filename = $reportType . '_report_' . now()->format('Y-m-d_H-i-s');
            
            return match ($format) {
                'json' => [
                    'success' => true,
                    'data' => json_encode($data, JSON_PRETTY_PRINT),
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
        $csv = '';
        $headers = [];
        
        // Extract headers from first item if available
        if (isset($data['summary']) && is_array($data['summary'])) {
            $headers = array_keys($data['summary']);
            $csv .= implode(',', $headers) . "\n";
        }
        
        // Add summary row
        if (isset($data['summary'])) {
            $csv .= implode(',', array_values($data['summary'])) . "\n";
        }
        
        return $csv;
    }

    /**
     * Convert data to Excel (simplified)
     */
    private function convertToExcel($data): array
    {
        // This would typically use Laravel Excel or similar library
        // For now, return data structure for Excel conversion
        return $data;
    }

    /**
     * Convert data to PDF (simplified)
     */
    private function convertToPDF($data): array
    {
        // This would typically use DomPDF or similar library
        // For now, return data structure for PDF conversion
        return $data;
    }

    /**
     * Schedule report delivery
     */
    private function scheduleReportDelivery(int $storeId, string $reportType, array $recipients, Request $request): void
    {
        $scheduleData = [
            'store_id' => $storeId,
            'report_type' => $reportType,
            'recipients' => $recipients,
            'frequency' => $request->input('frequency', 'once'),
            'next_run' => $request->input('schedule_date', now()->addDay()),
            'parameters' => $request->except(['store_id', 'report_type', 'schedule_report', 'email_recipients']),
        ];

        // Store schedule in database (would need a report_schedules table)
        Cache::put("report_schedule_{$storeId}_{$reportType}_" . time(), $scheduleData, 86400); // 24 hours
        
        Log::info('Report scheduled', $scheduleData);
    }

    /**
     * Email report to recipients
     */
    private function emailReport(string $filename, string $path, array $recipients, $data): void
    {
        foreach ($recipients as $recipient) {
            // This would use Laravel's Mail functionality
            Log::info('Report emailed', [
                'filename' => $filename,
                'recipient' => $recipient,
                'path' => $path,
            ]);
        }
    }

    /**
     * Create report share link
     */
    private function createReportShare(string $reportId, string $shareType, array $recipients, array $permissions, $expiresAt): array
    {
        try {
            $shareToken = uniqid('share_', true);
            $shareData = [
                'report_id' => $reportId,
                'share_type' => $shareType,
                'share_token' => $shareToken,
                'permissions' => $permissions,
                'recipients' => $recipients,
                'expires_at' => $expiresAt,
                'created_at' => now(),
                'share_url' => route('shared.report', ['token' => $shareToken]),
            ];

            // Store share data (would need a report_shares table)
            Cache::put("report_share_{$shareToken}", $shareData, 86400 * 7); // 7 days

            return [
                'success' => true,
                'data' => $shareData,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to create report share: ' . $e->getMessage(),
            ];
        }
    }
}