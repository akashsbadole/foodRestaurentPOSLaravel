<?php

namespace App\Services\Receipt\Templates;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\OrderSplit;

class StandardReceiptTemplate
{
    /**
     * Generate standard receipt HTML
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
            $title = "SPLIT BILL RECEIPT";
        } else {
            $order = $data['order'];
            $items = $order->items;
            $title = "RESTAURANT RECEIPT";
        }

        $settings = $data['settings'];
        $qrCodeUrl = $data['qr_code_url'] ?? null;
        $loyaltyPoints = $data['loyalty_points'] ?? null;

        $html = '<div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">';
        
        // Header
        $html .= self::generateHeader($settings, $title);
        
        // Order Information
        $html .= self::generateOrderInfo($order, $isSplitBill ? $split : null);
        
        // Items
        $html .= self::generateItems($items, $isRestaurant);
        
        // Totals
        $html .= self::generateTotals($isSplitBill ? $split : $order);
        
        // Footer
        $html .= self::generateFooter($settings, $qrCodeUrl, $loyaltyPoints);
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate receipt header
     */
    private static function generateHeader($settings, $title)
    {
        $html = '<div style="text-align: center; margin-bottom: 20px;">';
        
        if (!empty($settings['shop_logo'])) {
            $html .= '<img src="' . asset($settings['shop_logo']) . '" alt="Logo" style="max-width: 150px; margin-bottom: 10px;">';
        }
        
        $html .= '<h2 style="margin: 5px 0;">' . ($settings['shop_name'] ?? 'Restaurant') . '</h2>';
        $html .= '<p style="margin: 5px 0; font-size: 14px;">' . ($settings['shop_address'] ?? '') . '</p>';
        $html .= '<p style="margin: 5px 0; font-size: 14px;">Tel: ' . ($settings['shop_phone'] ?? '') . '</p>';
        $html .= '<h3 style="margin: 15px 0 10px 0; border-top: 1px dashed #ccc; padding-top: 10px;">' . $title . '</h3>';
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate order information
     */
    private static function generateOrderInfo($order, $split = null)
    {
        $html = '<div style="margin-bottom: 15px;">';
        $html .= '<p style="margin: 3px 0;"><strong>Order #:</strong> ' . $order->order_number . '</p>';
        $html .= '<p style="margin: 3px 0;"><strong>Date:</strong> ' . $order->order_date->format('d M Y') . '</p>';
        $html .= '<p style="margin: 3px 0;"><strong>Time:</strong> ' . $order->order_time->format('h:i A') . '</p>';
        
        if ($split) {
            $html .= '<p style="margin: 3px 0;"><strong>Split:</strong> #' . $split->split_number . '</p>';
            if ($split->contact) {
                $html .= '<p style="margin: 3px 0;"><strong>Guest:</strong> ' . $split->contact->name . '</p>';
            }
        }
        
        if ($order->table) {
            $html .= '<p style="margin: 3px 0;"><strong>Table:</strong> ' . $order->table->name;
            if ($order->table->section) {
                $html .= ' (' . $order->table->section->name . ')';
            }
            $html .= '</p>';
        }
        
        $html .= '<p style="margin: 3px 0;"><strong>Type:</strong> ' . ucfirst(str_replace('_', ' ', $order->order_type)) . '</p>';
        $html .= '<p style="margin: 3px 0;"><strong>Guests:</strong> ' . $order->customer_count . '</p>';
        
        if ($order->waiter) {
            $html .= '<p style="margin: 3px 0;"><strong>Server:</strong> ' . $order->waiter->name . '</p>';
        }
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate items list
     */
    private static function generateItems($items, $isRestaurant)
    {
        $html = '<div style="margin-bottom: 15px;">';
        $html .= '<h4 style="margin: 10px 0 5px 0; border-top: 1px dashed #ccc; padding-top: 10px;">Order Details</h4>';
        
        foreach ($items as $item) {
            $orderItem = $isRestaurant ? $item->orderItem : $item;
            $quantity = $item->quantity;
            $price = $isRestaurant ? $orderItem->unit_price : $orderItem->unit_price;
            $name = $orderItem->product->name;
            
            $html .= '<div style="margin-bottom: 8px;">';
            $html .= '<div style="display: flex; justify-content: space-between;">';
            $html .= '<span style="flex: 1;">' . $quantity . 'x ' . $name . '</span>';
            $html .= '<span style="text-align: right;">' . number_format($price * $quantity, 2) . '</span>';
            $html .= '</div>';
            
            // Show modifiers if available
            if ($isRestaurant && $orderItem->modifiers && $orderItem->modifiers->count() > 0) {
                foreach ($orderItem->modifiers as $modifier) {
                    $html .= '<div style="font-size: 12px; margin-left: 20px; color: #666;">';
                    $html .= '+ ' . $modifier->modifier->name;
                    if ($modifier->price_adjustment > 0) {
                        $html .= ' (+' . number_format($modifier->price_adjustment, 2) . ')';
                    }
                    $html .= '</div>';
                }
            }
            
            // Show special instructions if available
            if ($isRestaurant && !empty($orderItem->special_instructions)) {
                $html .= '<div style="font-size: 11px; margin-left: 20px; color: #888; font-style: italic;">';
                $html .= 'Note: ' . $orderItem->special_instructions;
                $html .= '</div>';
            }
            
            $html .= '</div>';
        }
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate totals section
     */
    private static function generateTotals($orderOrSplit)
    {
        $html = '<div style="margin-bottom: 15px;">';
        $html .= '<h4 style="margin: 10px 0 5px 0; border-top: 1px dashed #ccc; padding-top: 10px;">Payment Summary</h4>';
        
        $html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;">';
        $html .= '<span>Subtotal:</span>';
        $html .= '<span>' . number_format($orderOrSplit->subtotal, 2) . '</span>';
        $html .= '</div>';
        
        if ($orderOrSplit->discount_amount > 0) {
            $html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;">';
            $html .= '<span>Discount:</span>';
            $html .= '<span>-' . number_format($orderOrSplit->discount_amount, 2) . '</span>';
            $html .= '</div>';
        }
        
        if ($orderOrSplit->tax_amount > 0) {
            $html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;">';
            $html .= '<span>Tax:</span>';
            $html .= '<span>' . number_format($orderOrSplit->tax_amount, 2) . '</span>';
            $html .= '</div>';
        }
        
        if ($orderOrSplit->service_charge > 0) {
            $html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;">';
            $html .= '<span>Service Charge:</span>';
            $html .= '<span>' . number_format($orderOrSplit->service_charge, 2) . '</span>';
            $html .= '</div>';
        }
        
        $html .= '<div style="display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px;">';
        $html .= '<span>TOTAL:</span>';
        $html .= '<span>' . number_format($orderOrSplit->total_amount, 2) . '</span>';
        $html .= '</div>';
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate receipt footer
     */
    private static function generateFooter($settings, $qrCodeUrl, $loyaltyPoints)
    {
        $html = '<div style="text-align: center; margin-top: 20px;">';
        
        // QR Code for digital receipt
        if ($qrCodeUrl) {
            $html .= '<div style="margin-bottom: 15px;">';
            $html .= '<p style="margin: 5px 0; font-size: 12px;">Scan for digital receipt</p>';
            $html .= '<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' . urlencode($qrCodeUrl) . '" alt="QR Code" style="width: 100px; height: 100px;">';
            $html .= '</div>';
        }
        
        // Loyalty points
        if ($loyaltyPoints) {
            $html .= '<div style="margin-bottom: 10px; padding: 10px; background-color: #f0f8ff; border-radius: 5px;">';
            $html .= '<p style="margin: 3px 0; font-size: 12px;"><strong>Loyalty Points Earned:</strong> ' . $loyaltyPoints['points_earned'] . '</p>';
            $html .= '<p style="margin: 3px 0; font-size: 12px;"><strong>Total Points:</strong> ' . $loyaltyPoints['total_points_after'] . '</p>';
            $html .= '</div>';
        }
        
        // Thank you message
        $html .= '<p style="margin: 10px 0; font-weight: bold;">Thank you for dining with us!</p>';
        
        // Receipt note
        if (!empty($settings['sale_receipt_note'])) {
            $html .= '<p style="margin: 5px 0; font-size: 11px; color: #666;">' . $settings['sale_receipt_note'] . '</p>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
}