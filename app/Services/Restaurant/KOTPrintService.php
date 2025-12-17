<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\KitchenOrderQueue;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;

class KOTPrintService
{
    /**
     * Print KOT to kitchen printer
     */
    public function printKOT(KitchenOrderQueue $kot): array
    {
        try {
            $printerName = $kot->station->printer_name;
            
            if (!$printerName) {
                return [
                    'success' => false,
                    'message' => 'No printer configured for station: ' . $kot->station->name
                ];
            }

            // Generate KOT content
            $kotContent = $this->generateKOTContent($kot);
            
            // Send to printer
            $printResult = $this->sendToPrinter($printerName, $kotContent);
            
            if ($printResult['success']) {
                // Mark KOT as printed
                $kot->printed_at = now();
                $kot->save();
                
                return [
                    'success' => true,
                    'message' => 'KOT printed successfully',
                    'printer' => $printerName
                ];
            }
            
            return $printResult;
        } catch (\Exception $e) {
            Log::error('KOT printing failed', [
                'kot_id' => $kot->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'KOT printing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate KOT content for printing
     */
    public function generateKOTContent(KitchenOrderQueue $kot): string
    {
        $orderItem = $kot->orderItem;
        $order = $orderItem->order;
        
        $content = [];
        
        // Header
        $content[] = str_repeat("=", 40);
        $content[] = "KITCHEN ORDER TICKET";
        $content[] = str_repeat("=", 40);
        $content[] = "";
        
        // Order Information
        $content[] = "Order #: " . $order->order_number;
        $content[] = "Table: " . ($order->table ? $order->table->table_number : 'N/A');
        $content[] = "Type: " . ucwords(str_replace('_', ' ', $order->order_type));
        $content[] = "Station: " . $kot->station->name;
        $content[] = "Priority: " . strtoupper($kot->priority);
        $content[] = "";
        
        // Time Information
        $content[] = "Order Time: " . $order->order_time->format('H:i');
        $content[] = "KOT Time: " . now()->format('H:i'));
        if ($kot->estimated_time) {
            $content[] = "Est. Time: " . $kot->estimated_time . " min";
        }
        $content[] = "";
        
        // Item Details
        $content[] = str_repeat("-", 40);
        $content[] = "ITEM DETAILS";
        $content[] = str_repeat("-", 40);
        $content[] = $orderItem->product->name;
        $content[] = "Quantity: " . number_format($orderItem->quantity, 2);
        
        if ($orderItem->special_instructions) {
            $content[] = "Special: " . $orderItem->special_instructions;
        }
        
        if ($orderItem->preparation_notes) {
            $content[] = "Prep Notes: " . $orderItem->preparation_notes;
        }
        
        // Modifiers
        if ($orderItem->modifiers->isNotEmpty()) {
            $content[] = "";
            $content[] = "Modifiers:";
            foreach ($orderItem->modifiers as $modifier) {
                $content[] = "  - " . $modifier->modifier->name . " x" . $modifier->quantity;
            }
        }
        
        // Course Information
        if ($orderItem->course_number > 1) {
            $content[] = "";
            $content[] = "Course: " . $orderItem->course_number;
        }
        
        // Order Level Notes
        if ($order->special_instructions) {
            $content[] = "";
            $content[] = str_repeat("-", 40);
            $content[] = "ORDER NOTES:";
            $content[] = $order->special_instructions;
        }
        
        // KOT Notes
        if ($kot->notes) {
            $content[] = "";
            $content[] = str_repeat("-", 40);
            $content[] = "KITCHEN NOTES:";
            $content[] = $kot->notes;
        }
        
        // Footer
        $content[] = "";
        $content[] = str_repeat("=", 40);
        $content[] = "KOT ID: " . $kot->id;
        $content[] = "Printed: " . now()->format('Y-m-d H:i:s');
        $content[] = str_repeat("=", 40);
        
        return implode("\n", $content) . "\n\n";
    }

    /**
     * Send content to printer
     */
    private function sendToPrinter(string $printerName, string $content): array
    {
        try {
            // Check if it's a network printer (IP:Port format)
            if (strpos($printerName, ':') !== false) {
                list($ip, $port) = explode(':', $printerName);
                $connector = new NetworkPrintConnector($ip, intval($port));
            } else {
                // Local printer - use file output for testing
                $connector = new FilePrintConnector("php://stdout");
            }
            
            $printer = new Printer($connector);
            
            // Configure printer settings
            $printer->setEmphasis(true);
            $printer->text("KOT SYSTEM\n");
            $printer->setEmphasis(false);
            
            // Print KOT content
            $printer->text($content);
            
            // Cut paper
            $printer->cut();
            
            // Close connection
            $printer->close();
            
            return [
                'success' => true,
                'message' => 'Print job sent successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Printer communication failed', [
                'printer' => $printerName,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Printer communication failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Export KOT as text file
     */
    public function exportKOTAsText(KitchenOrderQueue $kot): string
    {
        return $this->generateKOTContent($kot);
    }

    /**
     * Export KOT as JSON
     */
    public function exportKOTAsJSON(KitchenOrderQueue $kot): string
    {
        $orderItem = $kot->orderItem;
        $order = $orderItem->order;
        
        return json_encode([
            'kot' => [
                'id' => $kot->id,
                'status' => $kot->status,
                'priority' => $kot->priority,
                'estimated_time' => $kot->estimated_time,
                'notes' => $kot->notes,
                'created_at' => $kot->created_at,
                'printed_at' => $kot->printed_at,
                'station' => [
                    'id' => $kot->station->id,
                    'name' => $kot->station->name,
                    'printer_name' => $kot->station->printer_name
                ]
            ],
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'order_type' => $order->order_type,
                'table' => $order->table ? [
                    'id' => $order->table->id,
                    'table_number' => $order->table->table_number
                ] : null,
                'customer_count' => $order->customer_count,
                'special_instructions' => $order->special_instructions,
                'order_time' => $order->order_time
            ],
            'order_item' => [
                'id' => $orderItem->id,
                'product' => [
                    'id' => $orderItem->product->id,
                    'name' => $orderItem->product->name,
                    'description' => $orderItem->product->description
                ],
                'quantity' => $orderItem->quantity,
                'special_instructions' => $orderItem->special_instructions,
                'preparation_notes' => $orderItem->preparation_notes,
                'course_number' => $orderItem->course_number,
                'modifiers' => $orderItem->modifiers->map(function($modifier) {
                    return [
                        'id' => $modifier->id,
                        'modifier' => [
                            'id' => $modifier->modifier->id,
                            'name' => $modifier->modifier->name
                        ],
                        'quantity' => $modifier->quantity
                    ];
                })
            ]
        ], JSON_PRETTY_PRINT);
    }

    /**
     * Print multiple KOTs for an order (consolidated KOT)
     */
    public function printConsolidatedKOT(RestaurantOrder $order): array
    {
        try {
            $kots = KitchenOrderQueue::whereHas('orderItem', function($query) use ($order) {
                    $query->where('order_id', $order->id);
                })
                ->with(['orderItem.product', 'orderItem.modifiers.modifier', 'station'])
                ->where('status', 'queued')
                ->orderBy('station_id')
                ->get();

            if ($kots->isEmpty()) {
                return [
                    'success' => false,
                    'message' => 'No pending KOTs found for this order'
                ];
            }

            // Group KOTs by station
            $kotsByStation = $kots->groupBy('station_id');
            $printResults = [];

            foreach ($kotsByStation as $stationId => $stationKots) {
                $station = $stationKots->first()->station;
                $content = $this->generateConsolidatedKOTContent($order, $stationKots);
                
                $printResult = $this->sendToPrinter($station->printer_name, $content);
                $printResults[$station->name] = $printResult;
                
                if ($printResult['success']) {
                    // Mark all KOTs for this station as printed
                    foreach ($stationKots as $kot) {
                        $kot->printed_at = now();
                        $kot->save();
                    }
                }
            }

            $successCount = collect($printResults)->filter(function($result) {
                return $result['success'];
            })->count();

            return [
                'success' => $successCount === count($printResults),
                'message' => "Printed KOTs for {$successCount}/" . count($printResults) . " stations",
                'print_results' => $printResults
            ];
        } catch (\Exception $e) {
            Log::error('Consolidated KOT printing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Consolidated KOT printing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate consolidated KOT content for a station
     */
    private function generateConsolidatedKOTContent(RestaurantOrder $order, $kots): string
    {
        $station = $kots->first()->station;
        
        $content = [];
        
        // Header
        $content[] = str_repeat("=", 40);
        $content[] = "CONSOLIDATED KITCHEN ORDER";
        $content[] = str_repeat("=", 40);
        $content[] = "";
        
        // Order Information
        $content[] = "Order #: " . $order->order_number;
        $content[] = "Table: " . ($order->table ? $order->table->table_number : 'N/A');
        $content[] = "Type: " . ucwords(str_replace('_', ' ', $order->order_type));
        $content[] = "Station: " . $station->name;
        $content[] = "Customers: " . $order->customer_count;
        $content[] = "";
        
        // Time Information
        $content[] = "Order Time: " . $order->order_time->format('H:i'));
        $content[] = "Print Time: " . now()->format('H:i'));
        $content[] = "";
        
        // Items
        $content[] = str_repeat("-", 40);
        $content[] = "ORDER ITEMS";
        $content[] = str_repeat("-", 40);
        
        foreach ($kots as $index => $kot) {
            $orderItem = $kot->orderItem;
            
            $content[] = ($index + 1) . ". " . $orderItem->product->name;
            $content[] = "   Qty: " . number_format($orderItem->quantity, 2);
            
            if ($orderItem->special_instructions) {
                $content[] = "   Special: " . $orderItem->special_instructions;
            }
            
            if ($orderItem->preparation_notes) {
                $content[] = "   Prep: " . $orderItem->preparation_notes;
            }
            
            // Modifiers
            if ($orderItem->modifiers->isNotEmpty()) {
                foreach ($orderItem->modifiers as $modifier) {
                    $content[] = "   + " . $modifier->modifier->name . " x" . $modifier->quantity;
                }
            }
            
            if ($orderItem->course_number > 1) {
                $content[] = "   Course: " . $orderItem->course_number;
            }
            
            $content[] = "";
        }
        
        // Order Level Notes
        if ($order->special_instructions) {
            $content[] = str_repeat("-", 40);
            $content[] = "ORDER NOTES:";
            $content[] = $order->special_instructions;
            $content[] = "";
        }
        
        // Footer
        $content[] = str_repeat("=", 40);
        $content[] = "Total Items: " . $kots->count();
        $content[] = "Printed: " . now()->format('Y-m-d H:i:s');
        $content[] = str_repeat("=", 40);
        
        return implode("\n", $content) . "\n\n";
    }

    /**
     * Test printer connection
     */
    public function testPrinterConnection(string $printerName): array
    {
        try {
            if (strpos($printerName, ':') !== false) {
                list($ip, $port) = explode(':', $printerName);
                $connector = new NetworkPrintConnector($ip, intval($port));
            } else {
                $connector = new FilePrintConnector("php://stdout");
            }
            
            $printer = new Printer($connector);
            
            // Test print
            $printer->text("PRINTER TEST - " . now()->format('Y-m-d H:i:s') . "\n");
            $printer->cut();
            $printer->close();
            
            return [
                'success' => true,
                'message' => 'Printer connection successful'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Printer connection failed: ' . $e->getMessage()
            ];
        }
    }
}