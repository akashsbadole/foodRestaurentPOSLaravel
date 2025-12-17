<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;

class ReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()->can('view_reports');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'store_id' => [
                'required',
                'integer',
                Rule::exists('stores', 'id'),
                function ($attribute, $value, $fail) {
                    if (!auth()->user()->canAccessStore($value)) {
                        $fail('You do not have permission to access this store.');
                    }
                },
            ],
            'report_type' => 'required|in:daily,weekly,monthly,yearly,custom,menu_performance,staff_performance,customer_analytics,business_intelligence,profit_loss,seasonal_trends,predictive_analytics',
            'format' => 'sometimes|required|in:pdf,excel,csv,json',
            'start_date' => [
                'required_unless:report_type,daily,yearly',
                'date_format:Y-m-d',
                'before_or_equal:today',
                function ($attribute, $value, $fail) {
                    if ($value && $this->input('end_date') && $value > $this->input('end_date')) {
                        $fail('Start date must be before or equal to end date.');
                    }
                    
                    // Limit date range to prevent excessive data requests
                    $maxDate = now()->subMonths(12);
                    if ($value < $maxDate) {
                        $fail('Date range cannot exceed 12 months.');
                    }
                },
            ],
            'end_date' => [
                'required_unless:report_type,daily',
                'date_format:Y-m-d',
                'before_or_equal:today',
                function ($attribute, $value, $fail) {
                    if ($value && $this->input('start_date') && $value < $this->input('start_date')) {
                        $fail('End date must be after or equal to start date.');
                    }
                },
            ],
            'date' => [
                'required_if:report_type,daily',
                'date_format:Y-m-d',
                'before_or_equal:today',
                function ($attribute, $value, $fail) {
                    // Prevent future dates for daily reports
                    if ($value > now()->toDateString()) {
                        $fail('Daily reports cannot be generated for future dates.');
                    }
                },
            ],
            'year' => [
                'required_if:report_type,monthly,yearly,seasonal_trends',
                'integer',
                'min:2020',
                'max:' . (now()->year + 1),
                function ($attribute, $value, $fail) {
                    if ($value > now()->year) {
                        $fail('Year cannot be in the future.');
                    }
                },
            ],
            'month' => [
                'required_if:report_type,monthly',
                'integer',
                'min:1',
                'max:12',
                function ($attribute, $value, $fail) {
                    $year = $this->input('year');
                    if ($year == now()->year && $value > now()->month) {
                        $fail('Month cannot be in the future for current year.');
                    }
                },
            ],
            'staff_type' => 'sometimes|in:waiters,kitchen_staff,all',
            'analysis_type' => 'sometimes|in:behavior,loyalty,lifetime_value,all',
            'schedule_report' => 'boolean',
            'email_recipients' => 'sometimes|array|max:50',
            'email_recipients.*' => 'email|max:255',
            'share_type' => 'required|in:link,email,embed',
            'recipients' => 'required_if:share_type,email|array|max:50',
            'recipients.*' => 'email|max:255',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'in:view,edit,download',
            'expires_at' => 'sometimes|date|after:now',
        ];

        // Add conditional validation based on report type
        $reportType = $this->input('report_type');
        
        if (in_array($reportType, ['daily', 'weekly', 'monthly', 'yearly', 'custom'])) {
            $rules['include_charts'] = 'sometimes|boolean';
            $rules['include_detailed_breakdown'] = 'sometimes|boolean';
            $rules['include_comparisons'] = 'sometimes|boolean';
            $rules['benchmark_against'] = 'sometimes|in:previous_period,same_period_last_year,industry_average';
        }

        if ($reportType === 'menu_performance') {
            $rules['category_filter'] = 'sometimes|array';
            $rules['category_filter.*'] = 'string|max:100';
            $rules['include_zero_sales'] = 'sometimes|boolean';
            $rules['sort_by'] = 'sometimes|in:quantity,revenue,profit,margin';
            $rules['sort_order'] = 'sometimes|in:asc,desc';
        }

        if ($reportType === 'staff_performance') {
            $rules['include_tips'] = 'sometimes|boolean';
            $rules['include_efficiency_metrics'] = 'sometimes|boolean';
            $rules['department_filter'] = 'sometimes|string|max:100';
        }

        if ($reportType === 'customer_analytics') {
            $rules['segment_filter'] = 'sometimes|array';
            $rules['segment_filter.*'] = 'string|max:50';
            $rules['include_demographics'] = 'sometimes|boolean';
            $rules['include_preferences'] = 'sometimes|boolean';
        }

        if ($reportType === 'business_intelligence') {
            $rules['include_forecasting'] = 'sometimes|boolean';
            $rules['include_recommendations'] = 'sometimes|boolean';
            $rules['detail_level'] = 'sometimes|in:summary,detailed,comprehensive';
        }

        if ($reportType === 'predictive_analytics') {
            $rules['forecast_period'] = 'sometimes|integer|min:1|max:365';
            $rules['confidence_level'] = 'sometimes|in:low,medium,high';
            $rules['include_risk_analysis'] = 'sometimes|boolean';
        }

        return $rules;
    }

    /**
     * Get custom error messages for validation rules
     */
    public function messages(): array
    {
        return [
            'store_id.required' => 'Store selection is required.',
            'store_id.exists' => 'Selected store does not exist.',
            'store_id.integer' => 'Store ID must be a valid number.',
            'report_type.required' => 'Report type is required.',
            'report_type.in' => 'Selected report type is not valid.',
            'format.required' => 'Export format is required when exporting.',
            'format.in' => 'Selected export format is not supported.',
            'start_date.required' => 'Start date is required for this report type.',
            'start_date.date_format' => 'Start date must be in YYYY-MM-DD format.',
            'start_date.before_or_equal' => 'Start date cannot be in the future.',
            'end_date.required' => 'End date is required for this report type.',
            'end_date.date_format' => 'End date must be in YYYY-MM-DD format.',
            'end_date.before_or_equal' => 'End date cannot be in the future.',
            'date.required_if' => 'Date is required for daily reports.',
            'date.date_format' => 'Date must be in YYYY-MM-DD format.',
            'date.before_or_equal' => 'Daily reports cannot be generated for future dates.',
            'year.required_if' => 'Year is required for this report type.',
            'year.integer' => 'Year must be a valid number.',
            'year.min' => 'Year must be 2020 or later.',
            'year.max' => 'Year cannot be more than one year in the future.',
            'year.before' => 'Year cannot be in the future.',
            'month.required_if' => 'Month is required for monthly reports.',
            'month.integer' => 'Month must be a valid number.',
            'month.min' => 'Month must be between 1 and 12.',
            'month.max' => 'Month must be between 1 and 12.',
            'staff_type.in' => 'Selected staff type is not valid.',
            'analysis_type.in' => 'Selected analysis type is not valid.',
            'schedule_report.boolean' => 'Schedule report must be true or false.',
            'email_recipients.max' => 'Cannot send to more than 50 recipients at once.',
            'email_recipients.*.email' => 'Each recipient must be a valid email address.',
            'email_recipients.*.max' => 'Each recipient email cannot exceed 255 characters.',
            'share_type.required' => 'Share type is required.',
            'share_type.in' => 'Selected share type is not valid.',
            'recipients.required_if' => 'Recipients are required when sharing via email.',
            'recipients.max' => 'Cannot share with more than 50 recipients at once.',
            'permissions.*.in' => 'Each permission must be one of: view, edit, download.',
            'expires_at.date' => 'Expiration date must be a valid date.',
            'expires_at.after' => 'Expiration date must be in the future.',
        ];
    }

    /**
     * Configure the validator instance
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Custom validation logic
            
            // Validate date range doesn't exceed system limits
            if ($this->input('start_date') && $this->input('end_date')) {
                $startDate = \Carbon\Carbon::parse($this->input('start_date'));
                $endDate = \Carbon\Carbon::parse($this->input('end_date'));
                $daysDiff = $startDate->diffInDays($endDate);
                
                if ($daysDiff > 365) {
                    $validator->errors()->add('end_date', 'Date range cannot exceed 365 days.');
                }
            }

            // Validate user has permission for requested report type
            $reportType = $this->input('report_type');
            $user = auth()->user();
            
            if (!$user->canGenerateReport($reportType)) {
                $validator->errors()->add('report_type', 'You do not have permission to generate this type of report.');
            }

            // Validate export format compatibility with report type
            if ($this->input('format') && $this->input('report_type')) {
                $format = $this->input('format');
                $reportType = $this->input('report_type');
                
                // PDF format requires specific report types
                if ($format === 'pdf' && !in_array($reportType, ['daily', 'weekly', 'monthly', 'yearly', 'business_intelligence'])) {
                    $validator->errors()->add('format', 'PDF format is only available for summary and intelligence reports.');
                }
            }

            // Validate email recipients for scheduling
            if ($this->input('schedule_report') && $this->input('email_recipients')) {
                $recipients = $this->input('email_recipients');
                if (count($recipients) > 10) {
                    $validator->errors()->add('email_recipients', 'Scheduled reports can only be sent to maximum 10 recipients.');
                }
            }

            // Validate sharing permissions
            if ($this->input('share_type') === 'link' && $this->input('permissions')) {
                $permissions = $this->input('permissions');
                if (in_array('edit', $permissions) && !auth()->user()->can('edit_reports')) {
                    $validator->errors()->add('permissions', 'You do not have permission to allow editing on shared reports.');
                }
            }
        });
    }

    /**
     * Get sanitized input for processing
     */
    public function sanitizeInput(): array
    {
        $input = $this->all();
        
        // Sanitize string inputs
        $stringFields = [
            'category_filter', 'department_filter', 'segment_filter',
            'analysis_type', 'detail_level', 'benchmark_against'
        ];
        
        foreach ($stringFields as $field) {
            if (isset($input[$field])) {
                if (is_array($input[$field])) {
                    $input[$field] = array_map('strip_tags', $input[$field]);
                } else {
                    $input[$field] = strip_tags($input[$field]);
                }
            }
        }
        
        // Sanitize array inputs
        $arrayFields = ['email_recipients', 'recipients', 'permissions'];
        
        foreach ($arrayFields as $field) {
            if (isset($input[$field]) && is_array($input[$field])) {
                $input[$field] = array_map(function ($item) {
                    return is_string($item) ? strip_tags($item) : $item;
                }, $input[$field]);
            }
        }
        
        return $input;
    }

    /**
     * Validate data integrity for report generation
     */
    public function validateDataIntegrity(): array
    {
        $errors = [];
        
        // Check if store has sufficient data for requested period
        $storeId = $this->input('store_id');
        $startDate = $this->input('start_date');
        $endDate = $this->input('end_date');
        
        if ($storeId && $startDate && $endDate) {
            $orderCount = \App\Models\Restaurant\RestaurantOrder::forStore($storeId)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->count();
                
            if ($orderCount === 0) {
                $errors[] = 'No data available for the selected period and store.';
            }
            
            // Check minimum data requirements
            $reportType = $this->input('report_type');
            $minDaysRequired = $this->getMinimumDataDays($reportType);
            $daysDiff = \Carbon\Carbon::parse($startDate)->diffInDays(\Carbon\Carbon::parse($endDate));
            
            if ($daysDiff < $minDaysRequired) {
                $errors[] = "This report type requires at least {$minDaysRequired} days of data.";
            }
        }
        
        return $errors;
    }

    /**
     * Get minimum data days required for report type
     */
    private function getMinimumDataDays(string $reportType): int
    {
        $requirements = [
            'daily' => 1,
            'weekly' => 7,
            'monthly' => 30,
            'yearly' => 365,
            'custom' => 7,
            'menu_performance' => 7,
            'staff_performance' => 7,
            'customer_analytics' => 30,
            'business_intelligence' => 30,
            'profit_loss' => 30,
            'seasonal_trends' => 365,
            'predictive_analytics' => 90,
        ];
        
        return $requirements[$reportType] ?? 7;
    }
}