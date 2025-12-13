<?php

namespace App\Http\Controllers;

use App\Services\ReceiptDataService;
use App\Services\Receipt\Formatters\ReceiptFormatter;
use App\Services\Receipt\QRCodeService;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\OrderSplit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    /**
     * Display receipt for restaurant order
     *
     * @param int $orderId
     * @param string $template
     * @return \Inertia\Response
     */
    public function showRestaurantReceipt($orderId, $template = 'standard')
    {
        $receiptData = ReceiptDataService::getRestaurantReceiptData($orderId, ['template' => $template]);
        
        if (!$receiptData) {
            abort(404, 'Receipt not found');
        }

        return Inertia::render('Restaurant/Receipt', [
            'receiptData' => $receiptData,
            'template' => $template
        ]);
    }

    /**
     * Display split bill receipt
     *
     * @param int $splitId
     * @param string $template
     * @return \Inertia\Response
     */
    public function showSplitBillReceipt($splitId, $template = 'standard')
    {
        $receiptData = ReceiptDataService::getSplitBillReceiptData($splitId);
        
        if (!$receiptData) {
            abort(404, 'Split bill receipt not found');
        }

        return Inertia::render('Restaurant/SplitBillReceipt', [
            'receiptData' => $receiptData,
            'template' => $template
        ]);
    }

    /**
     * Generate and return receipt in specified format
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function generateReceipt(Request $request)
    {
        $request->validate([
            'type' => 'required|in:restaurant,split_bill',
            'id' => 'required|integer',
            'template' => 'required|in:standard,detailed,thermal',
            'format' => 'required|in:html,print,digital,pdf,image'
        ]);

        $type = $request->input('type');
        $id = $request->input('id');
        $template = $request->input('template');
        $format = $request->input('format');

        // Get receipt data
        if ($type === 'restaurant') {
            $receiptData = ReceiptDataService::getRestaurantReceiptData($id, ['template' => $template]);
        } else {
            $receiptData = ReceiptDataService::getSplitBillReceiptData($id);
        }

        if (!$receiptData) {
            return response()->json(['error' => 'Receipt not found'], 404);
        }

        // Format receipt
        $formattedReceipt = ReceiptFormatter::format($receiptData, $template, $format);

        // Return appropriate response
        switch ($format) {
            case 'pdf':
                return response()->json($formattedReceipt);
            case 'image':
                return response()->json($formattedReceipt);
            case 'print':
                return response()->json($formattedReceipt);
            case 'digital':
                return response()->json($formattedReceipt);
            case 'html':
            default:
                return response($formattedReceipt);
        }
    }

    /**
     * Print receipt directly
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function printReceipt(Request $request)
    {
        $request->validate([
            'type' => 'required|in:restaurant,split_bill',
            'id' => 'required|integer',
            'template' => 'required|in:standard,detailed,thermal',
            'printer_id' => 'sometimes|string'
        ]);

        $type = $request->input('type');
        $id = $request->input('id');
        $template = $request->input('template');
        $printerId = $request->input('printer_id');

        // Get receipt data
        if ($type === 'restaurant') {
            $receiptData = ReceiptDataService::getRestaurantReceiptData($id, ['template' => $template]);
        } else {
            $receiptData = ReceiptDataService::getSplitBillReceiptData($id);
        }

        if (!$receiptData) {
            return response()->json(['error' => 'Receipt not found'], 404);
        }

        // Format for printing
        $formattedReceipt = ReceiptFormatter::format($receiptData, $template, 'print');

        // Send to printer (this would integrate with actual printer service)
        $printResult = $this->sendToPrinter($formattedReceipt, $printerId);

        return response()->json([
            'success' => true,
            'message' => 'Receipt sent to printer',
            'print_result' => $printResult
        ]);
    }

    /**
     * Get digital receipt by token
     *
     * @param string $token
     * @return \Inertia\Response
     */
    public function getDigitalReceipt($token)
    {
        $tokenData = QRCodeService::validateToken($token);
        
        if (!$tokenData) {
            abort(404, 'Digital receipt not found or expired');
        }

        // Get receipt data
        if ($tokenData['split_id']) {
            $receiptData = ReceiptDataService::getSplitBillReceiptData($tokenData['split_id']);
        } else {
            $receiptData = ReceiptDataService::getRestaurantReceiptData($tokenData['order_id']);
        }

        if (!$receiptData) {
            abort(404, 'Receipt not found');
        }

        return Inertia::render('Restaurant/DigitalReceipt', [
            'receiptData' => $receiptData,
            'token' => $token
        ]);
    }

    /**
     * Get receipt history
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function getReceiptHistory(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'store_id' => 'sometimes|integer'
        ]);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $storeId = $request->input('store_id');

        $receipts = ReceiptDataService::getReceiptHistory($startDate, $endDate, $storeId);

        return Inertia::render('Restaurant/ReceiptHistory', [
            'receipts' => $receipts,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'store_id' => $storeId
            ]
        ]);
    }

    /**
     * Get receipt analytics
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getReceiptAnalytics(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'store_id' => 'sometimes|integer'
        ]);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $storeId = $request->input('store_id');

        $analytics = ReceiptDataService::getReceiptAnalytics($startDate, $endDate, $storeId);

        return response()->json($analytics);
    }

    /**
     * Reprint receipt
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reprintReceipt(Request $request)
    {
        $request->validate([
            'type' => 'required|in:restaurant,split_bill',
            'id' => 'required|integer',
            'template' => 'required|in:standard,detailed,thermal',
            'copies' => 'sometimes|integer|min:1|max:5'
        ]);

        $copies = $request->input('copies', 1);
        $type = $request->input('type');
        $id = $request->input('id');
        $template = $request->input('template');

        // Get receipt data
        if ($type === 'restaurant') {
            $receiptData = ReceiptDataService::getRestaurantReceiptData($id, ['template' => $template]);
        } else {
            $receiptData = ReceiptDataService::getSplitBillReceiptData($id);
        }

        if (!$receiptData) {
            return response()->json(['error' => 'Receipt not found'], 404);
        }

        // Format for printing
        $formattedReceipt = ReceiptFormatter::format($receiptData, $template, 'print');

        // Print multiple copies
        $printResults = [];
        for ($i = 0; $i < $copies; $i++) {
            $printResults[] = $this->sendToPrinter($formattedReceipt);
        }

        return response()->json([
            'success' => true,
            'message' => "Receipt reprinted {$copies} time(s)",
            'print_results' => $printResults
        ]);
    }

    /**
     * Share receipt via email
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function shareReceipt(Request $request)
    {
        $request->validate([
            'type' => 'required|in:restaurant,split_bill',
            'id' => 'required|integer',
            'email' => 'required|email',
            'template' => 'required|in:standard,detailed'
        ]);

        $type = $request->input('type');
        $id = $request->input('id');
        $email = $request->input('email');
        $template = $request->input('template');

        // Get receipt data
        if ($type === 'restaurant') {
            $receiptData = ReceiptDataService::getRestaurantReceiptData($id, ['template' => $template]);
        } else {
            $receiptData = ReceiptDataService::getSplitBillReceiptData($id);
        }

        if (!$receiptData) {
            return response()->json(['error' => 'Receipt not found'], 404);
        }

        // Generate PDF
        $pdfReceipt = ReceiptFormatter::format($receiptData, $template, 'pdf');

        // Send email (this would integrate with actual email service)
        $emailResult = $this->sendReceiptEmail($email, $pdfReceipt, $receiptData);

        return response()->json([
            'success' => true,
            'message' => 'Receipt sent to email',
            'email_result' => $emailResult
        ]);
    }

    /**
     * Generate QR code for receipt sharing
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateShareQR(Request $request)
    {
        $request->validate([
            'type' => 'required|in:restaurant,split_bill',
            'id' => 'required|integer'
        ]);

        $type = $request->input('type');
        $id = $request->input('id');

        // Get receipt data
        if ($type === 'restaurant') {
            $receiptData = ReceiptDataService::getRestaurantReceiptData($id);
        } else {
            $receiptData = ReceiptDataService::getSplitBillReceiptData($id);
        }

        if (!$receiptData) {
            return response()->json(['error' => 'Receipt not found'], 404);
        }

        // Generate QR codes for different sharing options
        $qrCodes = [
            'digital_receipt' => QRCodeService::generateQRDataUri($receiptData['qr_code_url']),
            'whatsapp' => QRCodeService::generateWhatsAppQR($receiptData['qr_code_url']),
            'feedback' => QRCodeService::generateFeedbackQR($id, config('app.url'))
        ];

        return response()->json($qrCodes);
    }

    /**
     * Get receipt templates
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getReceiptTemplates()
    {
        $templates = [
            'standard' => [
                'name' => 'Standard Receipt',
                'description' => 'Basic receipt with essential information',
                'features' => ['Order details', 'Items list', 'Payment summary', 'QR code']
            ],
            'detailed' => [
                'name' => 'Detailed Receipt',
                'description' => 'Comprehensive receipt with all information',
                'features' => ['Enhanced header', 'Detailed items', 'Nutritional info', 'Feedback options', 'Loyalty points']
            ],
            'thermal' => [
                'name' => 'Thermal Printer',
                'description' => 'Optimized for thermal receipt printers',
                'features' => ['Compact format', 'ASCII text', 'Printer optimized', 'Fast printing']
            ]
        ];

        return response()->json($templates);
    }

    /**
     * Send receipt to printer
     *
     * @param array $formattedReceipt
     * @param string|null $printerId
     * @return array
     */
    private function sendToPrinter($formattedReceipt, $printerId = null)
    {
        // This would integrate with actual printer service
        // For now, return a simulated result
        
        return [
            'printer_id' => $printerId ?? 'default',
            'status' => 'success',
            'message' => 'Receipt printed successfully',
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Send receipt via email
     *
     * @param string $email
     * @param array $pdfReceipt
     * @param array $receiptData
     * @return array
     */
    private function sendReceiptEmail($email, $pdfReceipt, $receiptData)
    {
        // This would integrate with actual email service
        // For now, return a simulated result
        
        return [
            'email' => $email,
            'status' => 'success',
            'message' => 'Receipt email sent successfully',
            'timestamp' => now()->toISOString()
        ];
    }
}