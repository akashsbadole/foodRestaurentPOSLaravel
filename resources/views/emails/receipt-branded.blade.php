<div class="receipt-container" style="font-family: {{ $brand_font_family ?? 'Inter' }}; max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
    <!-- Receipt Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid {{ $brand_primary_color ?? '#3B82F6' }}; padding-bottom: 20px;">
        @if($brand_logo)
            <img src="{{ $brand_logo }}" alt="{{ $brand_name }}" style="max-height: 60px; margin-bottom: 10px;">
        @endif
        
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: {{ $brand_primary_color ?? '#3B82F6' }};">
            {{ $brand_name ?? 'Restaurant' }}
        </h1>
        
        @if($brand_tagline)
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">{{ $brand_tagline }}</p>
        @endif
        
        @if($receipt_header ?? null)
            <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: 500; color: {{ $brand_secondary_color ?? '#64748B' }};">
                {{ $receipt_header }}
            </p>
        @endif
    </div>
    
    <!-- Order Information -->
    <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-weight: 500;">Order #:</span>
            <span>{{ $order_number ?? 'ORD-001' }}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-weight: 500;">Date:</span>
            <span>{{ $order_date ?? now()->format('M d, Y H:i') }}</span>
        </div>
        
        @if($table_number ?? null)
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-weight: 500;">Table:</span>
            <span>{{ $table_number }}</span>
        </div>
        @endif
        
        @if($server_name ?? null)
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-weight: 500;">Server:</span>
            <span>{{ $server_name }}</span>
        </div>
        @endif
    </div>
    
    <!-- Order Items -->
    <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: {{ $brand_primary_color ?? '#3B82F6' }}; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            Order Items
        </h3>
        
        @if(isset($items) && count($items) > 0)
            @foreach($items as $item)
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <div>
                        <span style="font-weight: 500;">{{ $item['name'] }}</span>
                        @if($item['quantity'] > 1)
                            <span style="color: #666; font-size: 14px;"> x{{ $item['quantity'] }}</span>
                        @endif
                    </div>
                    <span style="font-weight: 500;">${{ number_format($item['price'], 2) }}</span>
                </div>
                
                @if(isset($item['modifiers']) && count($item['modifiers']) > 0)
                <div style="margin-left: 20px; font-size: 14px; color: #666;">
                    @foreach($item['modifiers'] as $modifier)
                    <div style="margin-bottom: 3px;">
                        + {{ $modifier['name'] }} @if($modifier['price'] > 0) (+${{ number_format($modifier['price'], 2) }}) @endif
                    </div>
                    @endforeach
                </div>
                @endif
            </div>
            @endforeach
        @else
            <p style="text-align: center; color: #666; padding: 20px 0;">No items found</p>
        @endif
    </div>
    
    <!-- Order Totals -->
    <div style="margin-bottom: 20px; border-top: 2px solid {{ $brand_primary_color ?? '#3B82F6' }}; padding-top: 15px;">
        @if(isset($subtotal))
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal:</span>
            <span>${{ number_format($subtotal, 2) }}</span>
        </div>
        @endif
        
        @if(isset($tax) && $tax > 0)
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Tax:</span>
            <span>${{ number_format($tax, 2) }}</span>
        </div>
        @endif
        
        @if(isset($discount) && $discount > 0)
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: {{ $brand_accent_color ?? '#EF4444' }};">
            <span>Discount:</span>
            <span>-${{ number_format($discount, 2) }}</span>
        </div>
        @endif
        
        @if(isset($tip) && $tip > 0)
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Tip:</span>
            <span>${{ number_format($tip, 2) }}</span>
        </div>
        @endif
        
        @if(isset($total))
        <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 600; color: {{ $brand_primary_color ?? '#3B82F6' }};">
            <span>Total:</span>
            <span>${{ number_format($total, 2) }}</span>
        </div>
        @endif
    </div>
    
    <!-- Payment Information -->
    @if(isset($payment_method))
    <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: {{ $brand_secondary_color ?? '#64748B' }};">
            Payment Method
        </h3>
        <p style="margin: 0; font-size: 14px;">{{ $payment_method }}</p>
    </div>
    @endif
    
    <!-- Receipt Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        @if($receipt_footer ?? null)
            <p style="margin: 0 0 10px 0; font-size: 14px; color: {{ $brand_secondary_color ?? '#64748B' }};">
                {{ $receipt_footer }}
            </p>
        @endif
        
        @if($brand_contact_email || $brand_contact_phone || $brand_website)
        <div style="font-size: 12px; color: #666;">
            @if($brand_contact_email)
            <p style="margin: 5px 0;">{{ $brand_contact_email }}</p>
            @endif
            
            @if($brand_contact_phone)
            <p style="margin: 5px 0;">{{ $brand_contact_phone }}</p>
            @endif
            
            @if($brand_website)
            <p style="margin: 5px 0;">{{ $brand_website }}</p>
            @endif
        </div>
        @endif
        
        <p style="margin: 15px 0 0 0; font-size: 11px; color: #999;">
            Thank you for your business!
        </p>
    </div>
</div>

<style>
    @media print {
        .receipt-container {
            box-shadow: none;
            border: none;
            padding: 0;
        }
    }
</style>