<?php

namespace App\Services\Receipt\Templates;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\OrderSplit;

class DetailedReceiptTemplate
{
    /**
     * Generate detailed receipt HTML
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
            $title = "DETAILED SPLIT BILL RECEIPT";
        } else {
            $order = $data['order'];
            $items = $order->items;
            $title = "DETAILED RESTAURANT RECEIPT";
        }

        $settings = $data['settings'];
        $qrCodeUrl = $data['qr_code_url'] ?? null;
        $loyaltyPoints = $data['loyalty_points'] ?? null;

        $html = '<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">';
        
        // Enhanced Header
        $html .= self::generateDetailedHeader($settings, $title);
        
        // Comprehensive Order Information
        $html .= self::generateDetailedOrderInfo($order, $isSplitBill ? $split : null);
        
        // Detailed Items with nutritional info
        $html .= self::generateDetailedItems($items, $isRestaurant);
        
        // Detailed Totals with breakdown
        $html .= self::generateDetailedTotals($isSplitBill ? $split : $order);
        
        // Enhanced Footer with feedback option
        $html .= self::generateDetailedFooter($settings, $qrCodeUrl, $loyaltyPoints, $order);
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate detailed receipt header
     */
    private static function generateDetailedHeader($settings, $title)
    {
        $html = '<div style="text-align: center; margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">';
        
        if (!empty($settings['shop_logo'])) {
            $html .= '<img src="' . asset($settings['shop_logo']) . '" alt="Logo" style="max-width: 180px; margin-bottom: 10px; border-radius: 5px;">';
        }
        
        $html .= '<h1 style="margin: 5px 0; color: #2c3e50;">' . ($settings['shop_name'] ?? 'Restaurant') . '</h1>';
        $html .= '<p style="margin: 5px 0; font-size: 14px; color: #666;">' . ($settings['shop_address'] ?? '') . '</p>';
        $html .= '<p style="margin: 5px 0; font-size: 14px; color: #666;">Tel: ' . ($settings['shop_phone'] ?? '') . '</p>';
        $html .= '<p style="margin: 5px 0; font-size: 12px; color: #888;">Email: ' . ($settings['shop_email'] ?? '') . '</p>';
        $html .= '<p style="margin: 5px 0; font-size: 12px; color: #888;">Website: ' . ($settings['shop_website'] ?? '') . '</p>';
        
        $html .= '<div style="margin-top: 15px; padding: 10px; background-color: #e9ecef; border-radius: 3px;">';
        $html .= '<h2 style="margin: 0; color: #495057; font-size: 16px;">' . $title . '</h2>';
        $html .= '</div>';
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate detailed order information
     */
    private static function generateDetailedOrderInfo($order, $split = null)
    {
        $html = '<div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">';
        $html .= '<h3 style="margin: 0 0 10px 0; color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">Order Information</h3>';
        
        $html .= '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
        $html .= '<div>';
        $html .= '<p style="margin: 5px 0;"><strong>Order #:</strong> ' . $order->order_number . '</p>';
        $html .= '<p style="margin: 5px 0;"><strong>Date:</strong> ' . $order->order_date->format('d M Y') . '</p>';
        $html .= '<p style="margin: 5px 0;"><strong>Time:</strong> ' . $order->order_time->format('h:i A') . '</p>';
        $html .= '<p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">' . ucfirst($order->status) . '</span></p>';
        $html .= '</div>';
        
        $html .= '<div>';
        if ($split) {
            $html .= '<p style="margin: 5px 0;"><strong>Split:</strong> #' . $split->split_number . '</p>';
            if ($split->contact) {
                $html .= '<p style="margin: 5px 0;"><strong>Guest:</strong> ' . $split->contact->name . '</p>';
            }
        }
        
        if ($order->table) {
            $html .= '<p style="margin: 5px 0;"><strong>Table:</strong> ' . $order->table->name;
            if ($order->table->section) {
                $html .= ' (' . $order->table->section->name . ')';
            }
            $html .= '</p>';
        }
        
        $html .= '<p style="margin: 5px 0;"><strong>Type:</strong> ' . ucfirst(str_replace('_', ' ', $order->order_type)) . '</p>';
        $html .= '<p style="margin: 5px 0;"><strong>Guests:</strong> ' . $order->customer_count . '</p>';
        $html .= '</div>';
        $html .= '</div>';
        
        if ($order->waiter) {
            $html .= '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #dee2e6;">';
            $html .= '<p style="margin: 5px 0;"><strong>Server:</strong> ' . $order->waiter->name . '</p>';
            $html .= '<p style="margin: 5px 0;"><strong>Staff ID:</strong> #' . $order->waiter->id . '</p>';
            $html .= '</div>';
        }
        
        if (!empty($order->special_instructions)) {
            $html .= '<div style="margin-top: 10px; padding: 10px; background-color: #fff3cd; border-radius: 3px;">';
            $html .= '<p style="margin: 0; font-size: 13px;"><strong>Special Instructions:</strong> ' . $order->special_instructions . '</p>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate detailed items list with nutritional information
     */
    private static function generateDetailedItems($items, $isRestaurant)
    {
        $html = '<div style="margin-bottom: 20px;">';
        $html .= '<h3 style="margin: 0 0 10px 0; color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">Order Details</h3>';
        
        $itemNumber = 1;
        foreach ($items as $item) {
            $orderItem = $isRestaurant ? $item->orderItem : $item;
            $quantity = $item->quantity;
            $price = $isRestaurant ? $orderItem->unit_price : $orderItem->unit_price;
            $name = $orderItem->product->name;
            
            $html .= '<div style="margin-bottom: 15px; padding: 10px; border: 1px solid #e9ecef; border-radius: 5px;">';
            $html .= '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">';
            $html .= '<div>';
            $html .= '<span style="font-weight: bold;">#' . $itemNumber . '</span> ';
            $html .= '<span style="font-weight: bold;">' . $name . '</span>';
            $html .= '</div>';
            $html .= '<div style="text-align: right;">';
            $html .= '<div>' . $quantity . ' x ' . number_format($price, 2) . '</div>';
            $html .= '<div style="font-weight: bold; color: #28a745;">' . number_format($price * $quantity, 2) . '</div>';
            $html .= '</div>';
            $html .= '</div>';
            
            // Product details
            if ($orderItem->product) {
                $html .= '<div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">';
                if (!empty($orderItem->product->description)) {
                    $html .= '<p style="margin: 2px 0;">' . $orderItem->product->description . '</p>';
                }
                $html .= '</div>';
            }
            
            // Show modifiers with detailed pricing
            if ($isRestaurant && $orderItem->modifiers && $orderItem->modifiers->count() > 0) {
                $html .= '<div style="margin-top: 8px; padding-left: 15px; border-left: 3px solid #007bff;">';
                $html .= '<p style="margin: 0 0 5px 0; font-weight: bold; font-size: 12px; color: #007bff;">Customizations:</p>';
                
                foreach ($orderItem->modifiers as $modifier) {
                    $html .= '<div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">';
                    $html .= '<span>+ ' . $modifier->modifier->name . '</span>';
                    $html .= '<span>';
                    if ($modifier->price_adjustment > 0) {
                        $html .= '+' . number_format($modifier->price_adjustment, 2);
                    } else {
                        $html .= 'No charge';
                    }
                    $html .= '</span>';
                    $html .= '</div>';
                }
                $html .= '</div>';
            }
            
            // Show special instructions for item
            if ($isRestaurant && !empty($orderItem->special_instructions)) {
                $html .= '<div style="margin-top: 5px; padding: 5px; background-color: #f8f9fa; border-radius: 3px;">';
                $html .= '<p style="margin: 0; font-size: 11px; font-style: italic; color: #6c757d;">';
                $html .= '<strong>Note:</strong> ' . $orderItem->special_instructions;
                $html .= '</p>';
                $html .= '</div>';
            }
            
            // Dietary information (if available)
            if ($orderItem->product && isset($orderItem->product->dietary_info)) {
                $html .= '<div style="margin-top: 5px;">';
                $dietaryInfo = json_decode($orderItem->product->dietary_info, true) ?? [];
                if (!empty($dietaryInfo)) {
                    $html .= '<div style="display: flex; gap: 5px; flex-wrap: wrap;">';
                    foreach ($dietaryInfo as $info) {
                        $html .= '<span style="font-size: 10px; padding: 2px 5px; background-color: #e9ecef; border-radius: 10px;">' . $info . '</span>';
                    }
                    $html .= '</div>';
                }
                $html .= '</div>';
            }
            
            $html .= '</div>';
            $itemNumber++;
        }
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate detailed totals with breakdown
     */
    private static function generateDetailedTotals($orderOrSplit)
    {
        $html = '<div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">';
        $html .= '<h3 style="margin: 0 0 10px 0; color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">Payment Breakdown</h3>';
        
        $html .= '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';
        
        // Left column - item breakdown
        $html .= '<div>';
        $html .= '<h4 style="margin: 0 0 5px 0; font-size: 14px; color: #6c757d;">Item Details</h4>';
        $html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 13px;">';
        $html .= '<span>Subtotal:</span>';
        $html .= '<span>' . number_format($orderOrSplit->subtotal, 2) . '</span>';
        $html .= '</div>';
        
        if ($orderOrSplit->discount_amount > 0) {
            $html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 13px;">';
            $html .= '<span>Discount:</span>';
            $html .= '<span style="color: #dc3545;">-' . number_format($orderOrSplit->discount_amount, 2) . '</span>';
            $html .= '</div>';
        }
        $html .= '</div>';
        
        // Right column - charges
        $html .= '<div>';
        $html .= '<h4 style="margin: 0 0 5px 0; font-size: 14px; color: #6c757d;">Charges</h4>';
        
        if ($orderOrSplit->tax_amount > 0) {
            $taxRate = $orderOrSplit->subtotal > 0 ? ($orderOrSplit->tax_amount / $orderOrSplit->subtotal) * 100 : 0;
            $html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 13px;">';
            $html .= '<span>Tax (' . number_format($taxRate, 1) . '%):</span>';
            $html .= '<span>' . number_format($orderOrSplit->tax_amount, 2) . '</span>';
            $html .= '</div>';
        }
        
        if ($orderOrSplit->service_charge > 0) {
            $serviceRate = $orderOrSplit->subtotal > 0 ? ($orderOrSplit->service_charge / $orderOrSplit->subtotal) * 100 : 0;
            $html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 13px;">';
            $html .= '<span>Service (' . number_format($serviceRate, 1) . '%):</span>';
            $html .= '<span>' . number_format($orderOrSplit->service_charge, 2) . '</span>';
            $html .= '</div>';
        }
        $html .= '</div>';
        $html .= '</div>';
        
        // Total
        $html .= '<div style="margin-top: 15px; padding-top: 10px; border-top: 2px solid #495057;">';
        $html .= '<div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">';
        $html .= '<span>TOTAL AMOUNT:</span>';
        $html .= '<span style="color: #28a745;">' . number_format($orderOrSplit->total_amount, 2) . '</span>';
        $html .= '</div>';
        $html .= '</div>';
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Generate detailed footer with feedback option
     */
    private static function generateDetailedFooter($settings, $qrCodeUrl, $loyaltyPoints, $order)
    {
        $html = '<div style="text-align: center; margin-top: 20px;">';
        
        // QR Code for digital receipt
        if ($qrCodeUrl) {
            $html .= '<div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">';
            $html .= '<p style="margin: 0 0 10px 0; font-weight: bold; color: #495057;">Digital Receipt</p>';
            $html .= '<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' . urlencode($qrCodeUrl) . '" alt="QR Code" style="width: 120px; height: 120px; border: 1px solid #dee2e6; border-radius: 5px;">';
            $html .= '<p style="margin: 10px 0 0 0; font-size: 12px; color: #6c757d;">Scan to view & save your receipt</p>';
            $html .= '</div>';
        }
        
        // Loyalty points with more details
        if ($loyaltyPoints) {
            $html .= '<div style="margin-bottom: 15px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 5px;">';
            $html .= '<h4 style="margin: 0 0 10px 0;">Loyalty Rewards</h4>';
            $html .= '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">';
            $html .= '<div>';
            $html .= '<p style="margin: 3px 0;">Customer: ' . $loyaltyPoints['customer_name'] . '</p>';
            $html .= '<p style="margin: 3px 0;">Points Earned: <strong>+' . $loyaltyPoints['points_earned'] . '</strong></p>';
            $html .= '</div>';
            $html .= '<div>';
            $html .= '<p style="margin: 3px 0;">Previous Balance: ' . $loyaltyPoints['current_points'] . '</p>';
            $html .= '<p style="margin: 3px 0;">New Balance: <strong>' . $loyaltyPoints['total_points_after'] . '</strong></p>';
            $html .= '</div>';
            $html .= '</div>';
            $html .= '</div>';
        }
        
        // Feedback section
        $html .= '<div style="margin-bottom: 15px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">';
        $html .= '<h4 style="margin: 0 0 10px 0; color: #856404;">We Value Your Feedback!</h4>';
        $html .= '<p style="margin: 5px 0; font-size: 13px;">Rate your experience and help us serve you better</p>';
        $html .= '<div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">';
        $html .= '<a href="' . url('/feedback/' . $order->id) . '" style="padding: 5px 15px; background-color: #ffc107; color: #212529; text-decoration: none; border-radius: 3px; font-size: 12px;">Give Feedback</a>';
        $html .= '<a href="' . url('/survey/' . $order->id) . '" style="padding: 5px 15px; background-color: #28a745; color: white; text-decoration: none; border-radius: 3px; font-size: 12px;">Take Survey</a>';
        $html .= '</div>';
        $html .= '</div>';
        
        // Thank you message and social links
        $html .= '<div style="margin-bottom: 15px;">';
        $html .= '<h3 style="margin: 0 0 10px 0;">Thank you for dining with us!</h3>';
        $html .= '<p style="margin: 5px 0; font-size: 13px; color: #6c757d;">Follow us on social media for updates and special offers</p>';
        
        // Social media links (if available in settings)
        if (!empty($settings['social_media_links'])) {
            $socialLinks = json_decode($settings['social_media_links'], true) ?? [];
            if (!empty($socialLinks)) {
                $html .= '<div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">';
                foreach ($socialLinks as $platform => $url) {
                    $html .= '<a href="' . $url . '" style="color: #007bff; text-decoration: none; font-size: 20px;" title="' . ucfirst($platform) . '">';
                    $html .= strtoupper(substr($platform, 0, 1));
                    $html .= '</a>';
                }
                $html .= '</div>';
            }
        }
        $html .= '</div>';
        
        // Receipt note and legal information
        $html .= '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">';
        if (!empty($settings['sale_receipt_note'])) {
            $html .= '<p style="margin: 5px 0; font-size: 11px; color: #6c757d;">' . $settings['sale_receipt_note'] . '</p>';
        }
        $html .= '<p style="margin: 5px 0; font-size: 10px; color: #868e96;">';
        $html .= 'This is a computer-generated receipt. No signature required.<br>';
        $html .= 'For questions about this receipt, please contact our management.<br>';
        $html .= 'GST Registration: ' . ($settings['gst_number'] ?? 'N/A') . ' | ';
        $html .= 'FSSAI License: ' . ($settings['fssai_license'] ?? 'N/A');
        $html .= '</p>';
        $html .= '</div>';
        
        $html .= '</div>';
        
        return $html;
    }
}