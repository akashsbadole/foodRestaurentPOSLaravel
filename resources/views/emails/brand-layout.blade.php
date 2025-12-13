<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Email from ' . ($brand_name ?? config('app.name')) }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: {{ $brand_font_family ?? 'Inter' }}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .email-header {
            background: linear-gradient(135deg, {{ $brand_primary_color ?? '#3B82F6' }}, {{ $brand_secondary_color ?? '#64748B' }});
            padding: 30px 40px;
            text-align: center;
        }
        
        .email-logo {
            max-height: 60px;
            margin-bottom: 15px;
        }
        
        .email-brand-name {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        
        .email-tagline {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 5px;
        }
        
        .email-body {
            padding: 40px;
        }
        
        .email-content {
            color: #333;
            font-size: 16px;
            line-height: 1.6;
        }
        
        .email-content h1 {
            color: {{ $brand_primary_color ?? '#3B82F6' }};
            font-size: 24px;
            margin-bottom: 20px;
        }
        
        .email-content h2 {
            color: {{ $brand_primary_color ?? '#3B82F6' }};
            font-size: 20px;
            margin-bottom: 15px;
        }
        
        .email-content h3 {
            color: {{ $brand_primary_color ?? '#3B82F6' }};
            font-size: 18px;
            margin-bottom: 10px;
        }
        
        .email-content p {
            margin-bottom: 16px;
        }
        
        .email-content a {
            color: {{ $brand_primary_color ?? '#3B82F6' }};
            text-decoration: none;
            font-weight: 500;
        }
        
        .email-content a:hover {
            text-decoration: underline;
        }
        
        .email-button {
            display: inline-block;
            background-color: {{ $brand_primary_color ?? '#3B82F6' }};
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            margin: 20px 0;
        }
        
        .email-button:hover {
            opacity: 0.9;
        }
        
        .email-footer {
            background-color: #f8f9fa;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .email-footer-content {
            color: #6c757d;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .email-footer a {
            color: {{ $brand_primary_color ?? '#3B82F6' }};
            text-decoration: none;
        }
        
        .email-footer a:hover {
            text-decoration: underline;
        }
        
        .brand-contact {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
        }
        
        .brand-contact p {
            margin: 5px 0;
            font-size: 13px;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 0;
            }
            
            .email-header,
            .email-body,
            .email-footer {
                padding: 20px;
            }
            
            .email-brand-name {
                font-size: 20px;
            }
            
            .email-content {
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Email Header -->
        <div class="email-header">
            @if($brand_logo)
                <img src="{{ $brand_logo }}" alt="{{ $brand_name }}" class="email-logo">
            @endif
            <h1 class="email-brand-name">{{ $brand_name ?? config('app.name') }}</h1>
            @if($brand_tagline)
                <p class="email-tagline">{{ $brand_tagline }}</p>
            @endif
        </div>
        
        <!-- Email Body -->
        <div class="email-body">
            <div class="email-content">
                {{{ $content }}}
            </div>
        </div>
        
        <!-- Email Footer -->
        <div class="email-footer">
            <div class="email-footer-content">
                <p>Thank you for choosing {{ $brand_name ?? config('app.name') }}!</p>
                
                @if($brand_website || $brand_contact_email || $brand_contact_phone)
                <div class="brand-contact">
                    @if($brand_website)
                        <p><strong>Website:</strong> <a href="{{ $brand_website }}">{{ $brand_website }}</a></p>
                    @endif
                    
                    @if($brand_contact_email)
                        <p><strong>Contact:</strong> <a href="mailto:{{ $brand_contact_email }}">{{ $brand_contact_email }}</a></p>
                    @endif
                    
                    @if($brand_contact_phone)
                        <p><strong>Phone:</strong> {{ $brand_contact_phone }}</p>
                    @endif
                </div>
                @endif
                
                <p style="margin-top: 20px; font-size: 12px; color: #999;">
                    This email was sent by {{ $brand_name ?? config('app.name') }}. 
                    If you didn't expect this email, you can safely ignore it.
                </p>
            </div>
        </div>
    </div>
</body>
</html>