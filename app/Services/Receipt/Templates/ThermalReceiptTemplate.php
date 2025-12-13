<?php

namespace App\Services\Receipt\Templates;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\OrderSplit;

class ThermalReceiptTemplate
{
    /**
     * Generate thermal printer receipt text
     *
     * @param array $data
     * @return string
     */
    public static function generate($data)
    {
        $isRestaurant = $data['receipt_type'] === 'restaurant';
        $isSplitBill = $data['receipt_type'] === 'split_bill';
        
        if ($isSplitBill) {
            $split = $data['split'];
            $order = $split->order;
            $items = $split->items;
            $title = "SPLIT BILL";
        } else {
            $order = $data['order'];
            $items = $order->items;
            $title = "RESTAURANT RECEIPT";
        }

        $settings = $data['settings'];
        $qrCodeUrl = $data['qr_code_url'] ?? null;
        $loyaltyPoints = $data['loyalty_points'] ?? null;

        // Thermal printer settings
        $lineWidth = 48; // Standard thermal printer width
        $lineSep = str_repeat("-", $lineWidth) . "\r\n";
        $doubleLineSep = str_repeat("=", $lineWidth) . "\r\n";
        
        $text = "";
        
        // Header
        $text .= self::generateThermalHeader($settings, $title, $lineWidth, $lineSep, $doubleLineSep);
        
        // Order Information
        $text .= self::generateThermalOrderInfo($order, $isSplitBill ? $split : null, $lineWidth, $lineSep);
        
        // Items
        $text .= self::generateThermalItems($items, $isRestaurant, $lineWidth, $lineSep);
        
        // Totals
        $text .= self::generateThermalTotals($isSplitBill ? $split : $order, $lineWidth, $lineSep);
        
        // Footer
        $text .= self::generateThermalFooter($settings, $qrCodeUrl, $loyaltyPoints, $lineWidth, $lineSep);
        
        return $text;
    }

    /**
     * Generate thermal receipt header
     */
    private static function generateThermalHeader($settings, $title, $lineWidth, $lineSep, $doubleLineSep)
    {
        $text = "";
        
        // Center restaurant name
        $restaurantName = $settings['shop_name'] ?? 'RESTAURANT';
        $text .= str_pad($restaurantName, $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        
        // Address
        if (!empty($settings['shop_address'])) {
            $address = wordwrap($settings['shop_address'], $lineWidth - 4, "\r\n", true);
            $addressLines = explode("\r\n", $address);
            foreach ($addressLines as $line) {
                $text .= str_pad($line, $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
            }
        }
        
        // Phone
        if (!empty($settings['shop_phone'])) {
            $text .= str_pad("Tel: " . $settings['shop_phone'], $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        }
        
        $text .= $doubleLineSep;
        $text .= str_pad($title, $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        $text .= $doubleLineSep;
        
        return $text;
    }

    /**
     * Generate thermal order information
     */
    private static function generateThermalOrderInfo($order, $split = null, $lineWidth, $lineSep)
    {
        $text = "";
        
        // Order details in two columns
        $leftColWidth = 20;
        $rightColWidth = $lineWidth - $leftColWidth - 2;
        
        $text .= str_pad("Order #:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                 str_pad($order->order_number, $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
        
        $text .= str_pad("Date:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                 str_pad($order->order_date->format('d M Y'), $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
        
        $text .= str_pad("Time:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                 str_pad($order->order_time->format('h:i A'), $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
        
        if ($split) {
            $text .= str_pad("Split:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                     str_pad("#" . $split->split_number, $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
            if ($split->contact) {
                $text .= str_pad("Guest:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                         str_pad($split->contact->name, $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
            }
        }
        
        if ($order->table) {
            $tableName = $order->table->name;
            if ($order->table->section) {
                $tableName .= " (" . $order->table->section->name . ")";
            }
            $text .= str_pad("Table:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                     str_pad($tableName, $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
        }
        
        $text .= str_pad("Type:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                 str_pad(ucfirst(str_replace('_', ' ', $order->order_type)), $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
        
        $text .= str_pad("Guests:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                 str_pad($order->customer_count, $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
        
        if ($order->waiter) {
            $text .= str_pad("Server:", $leftColWidth, " ", STR_PAD_RIGHT) . " " . 
                     str_pad($order->waiter->name, $rightColWidth, " ", STR_PAD_LEFT) . "\r\n";
        }
        
        $text .= $lineSep;
        
        return $text;
    }

    /**
     * Generate thermal items list
     */
    private static function generateThermalItems($items, $isRestaurant, $lineWidth, $lineSep)
    {
        $text = "";
        
        // Column widths
        $qtyWidth = 6;
        $itemWidth = $lineWidth - $qtyWidth - 12; // Leave space for price
        $priceWidth = 12;
        
        $itemNumber = 1;
        foreach ($items as $item) {
            $orderItem = $isRestaurant ? $item->orderItem : $item;
            $quantity = $item->quantity;
            $price = $isRestaurant ? $orderItem->unit_price : $orderItem->unit_price;
            $name = $orderItem->product->name;
            $total = $price * $quantity;
            
            // Item number and name
            $itemName = "#" . $itemNumber . " " . $name;
            if (strlen($itemName) > $itemWidth) {
                $itemName = substr($itemName, 0, $itemWidth - 3) . "...";
            }
            
            $text .= str_pad($itemName, $lineWidth, " ", STR_PAD_RIGHT) . "\r\n";
            
            // Quantity and price line
            $qtyText = $quantity . "x";
            $priceText = number_format($price, 2);
            $totalText = number_format($total, 2);
            
            $text .= str_pad($qtyText, $qtyWidth, " ", STR_PAD_BOTH) . " " .
                     str_pad("", $itemWidth, " ", STR_PAD_LEFT) . " " .
                     str_pad($totalText, $priceWidth, " ", STR_PAD_LEFT) . "\r\n";
            
            // Show modifiers if available
            if ($isRestaurant && $orderItem->modifiers && $orderItem->modifiers->count() > 0) {
                foreach ($orderItem->modifiers as $modifier) {
                    $modifierName = "+ " . $modifier->modifier->name;
                    if ($modifier->price_adjustment > 0) {
                        $modifierName .= " (+" . number_format($modifier->price_adjustment, 2) . ")";
                    }
                    
                    if (strlen($modifierName) > $lineWidth - 8) {
                        $modifierName = substr($modifierName, 0, $lineWidth - 11) . "...";
                    }
                    
                    $text .= str_pad("  " . $modifierName, $lineWidth - 8, " ", STR_PAD_RIGHT) . "\r\n";
                }
            }
            
            // Show special instructions if available
            if ($isRestaurant && !empty($orderItem->special_instructions)) {
                $noteText = "  Note: " . $orderItem->special_instructions;
                if (strlen($noteText) > $lineWidth) {
                    $noteText = wordwrap($noteText, $lineWidth - 3, "\r\n", true);
                    $noteLines = explode("\r\n", $noteText);
                    foreach ($noteLines as $line) {
                        $text .= $line . "\r\n";
                    }
                } else {
                    $text .= $noteText . "\r\n";
                }
            }
            
            if ($itemNumber < count($items)) {
                $text .= "\r\n";
            }
            
            $itemNumber++;
        }
        
        $text .= $lineSep;
        
        return $text;
    }

    /**
     * Generate thermal totals section
     */
    private static function generateThermalTotals($orderOrSplit, $lineWidth, $lineSep)
    {
        $text = "";
        
        $labelWidth = 30;
        $valueWidth = $lineWidth - $labelWidth - 2;
        
        $text .= str_pad("Subtotal:", $labelWidth, " ", STR_PAD_RIGHT) . " " .
                 str_pad(number_format($orderOrSplit->subtotal, 2), $valueWidth, " ", STR_PAD_LEFT) . "\r\n";
        
        if ($orderOrSplit->discount_amount > 0) {
            $text .= str_pad("Discount:", $labelWidth, " ", STR_PAD_RIGHT) . " " .
                     str_pad("-" . number_format($orderOrSplit->discount_amount, 2), $valueWidth, " ", STR_PAD_LEFT) . "\r\n";
        }
        
        if ($orderOrSplit->tax_amount > 0) {
            $text .= str_pad("Tax:", $labelWidth, " ", STR_PAD_RIGHT) . " " .
                     str_pad(number_format($orderOrSplit->tax_amount, 2), $valueWidth, " ", STR_PAD_LEFT) . "\r\n";
        }
        
        if ($orderOrSplit->service_charge > 0) {
            $text .= str_pad("Service Charge:", $labelWidth, " ", STR_PAD_RIGHT) . " " .
                     str_pad(number_format($orderOrSplit->service_charge, 2), $valueWidth, " ", STR_PAD_LEFT) . "\r\n";
        }
        
        $text .= $lineSep;
        $text .= str_pad("TOTAL:", $labelWidth, " ", STR_PAD_RIGHT) . " " .
                 str_pad(number_format($orderOrSplit->total_amount, 2), $valueWidth, " ", STR_PAD_LEFT) . "\r\n";
        
        $text .= $lineSep;
        
        return $text;
    }

    /**
     * Generate thermal receipt footer
     */
    private static function generateThermalFooter($settings, $qrCodeUrl, $loyaltyPoints, $lineWidth, $lineSep)
    {
        $text = "";
        
        // QR Code for digital receipt (simplified representation)
        if ($qrCodeUrl) {
            $text .= str_pad("Scan for digital receipt", $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
            $text .= str_pad("[ QR CODE ]", $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
            $text .= str_pad($qrCodeUrl, $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
            $text .= $lineSep;
        }
        
        // Loyalty points
        if ($loyaltyPoints) {
            $text .= str_pad("LOYALTY POINTS EARNED: " . $loyaltyPoints['points_earned'], $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
            $text .= str_pad("TOTAL POINTS: " . $loyaltyPoints['total_points_after'], $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
            $text .= $lineSep;
        }
        
        // Thank you message
        $text .= str_pad("Thank you for dining with us!", $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        $text .= str_pad("Please come again!", $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        
        $text .= "\r\n";
        
        // Receipt note
        if (!empty($settings['sale_receipt_note'])) {
            $note = wordwrap($settings['sale_receipt_note'], $lineWidth - 4, "\r\n", true);
            $noteLines = explode("\r\n", $note);
            foreach ($noteLines as $line) {
                $text .= str_pad($line, $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
            }
            $text .= "\r\n";
        }
        
        // Legal information
        $text .= str_pad("This is a computer-generated receipt", $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        $text .= str_pad("No signature required", $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        
        if (!empty($settings['gst_number'])) {
            $text .= str_pad("GST: " . $settings['gst_number'], $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        }
        
        if (!empty($settings['fssai_license'])) {
            $text .= str_pad("FSSAI: " . $settings['fssai_license'], $lineWidth, " ", STR_PAD_BOTH) . "\r\n";
        }
        
        // Add cutting marks
        $text .= "\r\n\r\n" . str_repeat("-", $lineWidth) . "\r\n";
        $text .= str_repeat("-", $lineWidth) . "\r\n\r\n";
        
        return $text;
    }
}