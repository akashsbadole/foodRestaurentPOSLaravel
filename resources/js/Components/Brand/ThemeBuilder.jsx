import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';

const ThemeBuilder = ({ brand, industryTemplates, industryTypes }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [previewMode, setPreviewMode] = useState('desktop');
    const [brandSettings, setBrandSettings] = useState(brand || {});
    const [showPreview, setShowPreview] = useState(false);

    const tabs = [
        { id: 'basic', label: 'Basic Branding', icon: '🏢' },
        { id: 'theme', label: 'Theme Colors', icon: '🎨' },
        { id: 'logos', label: 'Logos & Media', icon: '🖼️' },
        { id: 'typography', label: 'Typography', icon: '📝' },
        { id: 'industry', label: 'Industry Settings', icon: '🍽️' },
        { id: 'advanced', label: 'Advanced', icon: '⚙️' },
    ];

    const fontFamilies = [
        'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 
        'Playfair Display', 'Merriweather', 'Oswald', 'Raleway', 'Nunito', 'Ubuntu'
    ];

    const fontSizes = [
        { value: 'small', label: 'Small (14px)' },
        { value: 'medium', label: 'Medium (16px)' },
        { value: 'large', label: 'Large (18px)' },
    ];

    const borderRadii = [
        { value: 'none', label: 'None' },
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'full', label: 'Full' },
    ];

    const themeModes = [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto' },
    ];

    const sidebarStyles = [
        { value: 'default', label: 'Default' },
        { value: 'condensed', label: 'Condensed' },
        { value: 'expanded', label: 'Expanded' },
    ];

    const gradientDirections = [
        { value: 'to right', label: 'Left to Right' },
        { value: 'to left', label: 'Right to Left' },
        { value: 'to bottom', label: 'Top to Bottom' },
        { value: 'to top', label: 'Bottom to Top' },
        { value: 'to bottom right', label: 'Diagonal ↘' },
        { value: 'to bottom left', label: 'Diagonal ↙' },
    ];

    const handleInputChange = (field, value) => {
        setBrandSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleColorChange = (field, color) => {
        setBrandSettings(prev => ({
            ...prev,
            [field]: color
        }));
    };

    const handleTemplateSelect = (template) => {
        setBrandSettings(prev => ({
            ...prev,
            ...template,
            industry_template: template.key
        }));
    };

    const handleFileUpload = (field, file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBrandSettings(prev => ({
                    ...prev,
                    [field]: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const renderBasicBranding = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Name
                    </label>
                    <input
                        type="text"
                        value={brandSettings.app_name || ''}
                        onChange={(e) => handleInputChange('app_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="DineFlow"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand Key
                    </label>
                    <input
                        type="text"
                        value={brandSettings.brand_key || ''}
                        onChange={(e) => handleInputChange('brand_key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="dineflow"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tagline
                    </label>
                    <input
                        type="text"
                        value={brandSettings.tagline || ''}
                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Restaurant POS System"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                    </label>
                    <input
                        type="email"
                        value={brandSettings.contact_email || ''}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="contact@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                    </label>
                    <input
                        type="tel"
                        value={brandSettings.contact_phone || ''}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 234 567 8900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website URL
                    </label>
                    <input
                        type="url"
                        value={brandSettings.website_url || ''}
                        onChange={(e) => handleInputChange('website_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    value={brandSettings.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Complete restaurant management solution"
                />
            </div>

            <div className="flex items-center space-x-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={brandSettings.is_active || false}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        className="mr-2"
                    />
                    Active
                </label>

                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={brandSettings.enable_brand_preview || false}
                        onChange={(e) => handleInputChange('enable_brand_preview', e.target.checked)}
                        className="mr-2"
                    />
                    Enable Brand Preview
                </label>
            </div>
        </div>
    );

    const renderThemeColors = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { field: 'primary_color', label: 'Primary Color', default: '#3B82F6' },
                    { field: 'secondary_color', label: 'Secondary Color', default: '#64748B' },
                    { field: 'accent_color', label: 'Accent Color', default: '#EF4444' },
                    { field: 'success_color', label: 'Success Color', default: '#10B981' },
                    { field: 'warning_color', label: 'Warning Color', default: '#F59E0B' },
                    { field: 'error_color', label: 'Error Color', default: '#EF4444' },
                    { field: 'info_color', label: 'Info Color', default: '#3B82F6' },
                ].map(({ field, label, default: defaultColor }) => (
                    <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {label}
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={brandSettings[field] || defaultColor}
                                onChange={(e) => handleColorChange(field, e.target.value)}
                                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={brandSettings[field] || defaultColor}
                                onChange={(e) => handleColorChange(field, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gradient Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gradient Start Color
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={brandSettings.gradient_start || ''}
                                onChange={(e) => handleColorChange('gradient_start', e.target.value)}
                                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={brandSettings.gradient_start || ''}
                                onChange={(e) => handleColorChange('gradient_start', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gradient End Color
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={brandSettings.gradient_end || ''}
                                onChange={(e) => handleColorChange('gradient_end', e.target.value)}
                                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={brandSettings.gradient_end || ''}
                                onChange={(e) => handleColorChange('gradient_end', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gradient Direction
                        </label>
                        <select
                            value={brandSettings.gradient_direction || 'to right'}
                            onChange={(e) => handleInputChange('gradient_direction', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {gradientDirections.map(direction => (
                                <option key={direction.value} value={direction.value}>
                                    {direction.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLogosMedia = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { field: 'logo_url', label: 'Main Logo', description: 'Used in header and general branding' },
                    { field: 'login_logo_url', label: 'Login Logo', description: 'Used on login page' },
                    { field: 'header_logo_url', label: 'Header Logo', description: 'Used in application header' },
                    { field: 'receipt_logo_url', label: 'Receipt Logo', description: 'Used on receipts and invoices' },
                    { field: 'favicon_url', label: 'Favicon', description: 'Browser tab icon (32x32px)' },
                ].map(({ field, label, description }) => (
                    <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {label}
                        </label>
                        <p className="text-sm text-gray-500 mb-2">{description}</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {brandSettings[field] ? (
                                <div className="space-y-2">
                                    <img
                                        src={brandSettings[field]}
                                        alt={label}
                                        className="mx-auto max-h-32 rounded"
                                    />
                                    <button
                                        onClick={() => handleInputChange(field, null)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="file"
                                        id={field}
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(field, e.target.files[0])}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor={field}
                                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Choose Image
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {brandSettings.background_image_url ? (
                            <div className="space-y-2">
                                <img
                                    src={brandSettings.background_image_url}
                                    alt="Background"
                                    className="mx-auto max-h-32 rounded"
                                />
                                <button
                                    onClick={() => handleInputChange('background_image_url', null)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove Image
                                </button>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="file"
                                    id="background_image_url"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload('background_image_url', e.target.files[0])}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="background_image_url"
                                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Choose Background Image
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Pattern
                    </label>
                    <select
                        value={brandSettings.background_pattern || ''}
                        onChange={(e) => handleInputChange('background_pattern', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">None</option>
                        <option value="dots">Dots</option>
                        <option value="lines">Lines</option>
                        <option value="grid">Grid</option>
                        <option value="waves">Waves</option>
                        <option value="geometric">Geometric</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderTypography = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Family
                    </label>
                    <select
                        value={brandSettings.font_family || 'Inter'}
                        onChange={(e) => handleInputChange('font_family', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {fontFamilies.map(font => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size
                    </label>
                    <select
                        value={brandSettings.font_size || 'medium'}
                        onChange={(e) => handleInputChange('font_size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {fontSizes.map(size => (
                            <option key={size.value} value={size.value}>{size.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Border Radius
                    </label>
                    <select
                        value={brandSettings.border_radius || 'medium'}
                        onChange={(e) => handleInputChange('border_radius', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {borderRadii.map(radius => (
                            <option key={radius.value} value={radius.value}>{radius.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme Mode
                    </label>
                    <select
                        value={brandSettings.theme_mode || 'light'}
                        onChange={(e) => handleInputChange('theme_mode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {themeModes.map(mode => (
                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sidebar Style
                    </label>
                    <select
                        value={brandSettings.sidebar_style || 'default'}
                        onChange={(e) => handleInputChange('sidebar_style', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {sidebarStyles.map(style => (
                            <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );

    const renderIndustrySettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry Type
                    </label>
                    <select
                        value={brandSettings.industry_type || 'restaurant'}
                        onChange={(e) => handleInputChange('industry_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {industryTypes.map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Domain
                    </label>
                    <input
                        type="text"
                        value={brandSettings.custom_domain || ''}
                        onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="restaurant.example.com"
                    />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Industry Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(industryTemplates).map(([key, template]) => (
                        <div
                            key={key}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                brandSettings.industry_template === key
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleTemplateSelect({ ...template, key })}
                        >
                            <div className="flex items-center space-x-2 mb-2">
                                <div
                                    className="w-8 h-8 rounded"
                                    style={{ backgroundColor: template.primary_color }}
                                />
                                <h4 className="font-medium">{template.name}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receipt Header
                    </label>
                    <input
                        type="text"
                        value={brandSettings.receipt_header || ''}
                        onChange={(e) => handleInputChange('receipt_header', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Thank you for dining with us!"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receipt Footer
                    </label>
                    <input
                        type="text"
                        value={brandSettings.receipt_footer || ''}
                        onChange={(e) => handleInputChange('receipt_footer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Please come again!"
                    />
                </div>
            </div>
        </div>
    );

    const renderAdvanced = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom CSS
                </label>
                <textarea
                    value={brandSettings.custom_css || ''}
                    onChange={(e) => handleInputChange('custom_css', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="/* Add your custom CSS here */"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom JavaScript
                </label>
                <textarea
                    value={brandSettings.custom_js || ''}
                    onChange={(e) => handleInputChange('custom_js', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="/* Add your custom JavaScript here */"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Head HTML
                </label>
                <textarea
                    value={brandSettings.custom_head || ''}
                    onChange={(e) => handleInputChange('custom_head', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="<!-- Add custom meta tags, scripts, etc. -->"
                />
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return renderBasicBranding();
            case 'theme':
                return renderThemeColors();
            case 'logos':
                return renderLogosMedia();
            case 'typography':
                return renderTypography();
            case 'industry':
                return renderIndustrySettings();
            case 'advanced':
                return renderAdvanced();
            default:
                return renderBasicBranding();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Theme Builder" />
            
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Theme Builder</h1>
                        <p className="mt-2 text-gray-600">Customize your brand appearance and settings</p>
                    </div>

                    <div className="bg-white rounded-lg shadow">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8 px-6" aria-label="Tabs">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="mr-2">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6">
                            {renderTabContent()}
                        </div>

                        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    {showPreview ? 'Hide' : 'Show'} Preview
                                </button>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // Save functionality would go here
                                        console.log('Saving brand settings:', brandSettings);
                                    }}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>

                    {showPreview && (
                        <div className="mt-8 bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Live Preview</h2>
                            <div className="border rounded-lg overflow-hidden">
                                <div
                                    className="p-6"
                                    style={{
                                        backgroundColor: brandSettings.primary_color || '#3B82F6',
                                        color: '#ffffff',
                                        fontFamily: brandSettings.font_family || 'Inter',
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {brandSettings.logo_url && (
                                                <img
                                                    src={brandSettings.logo_url}
                                                    alt="Logo"
                                                    className="h-10 w-auto"
                                                />
                                            )}
                                            <div>
                                                <h3 className="text-2xl font-bold">
                                                    {brandSettings.app_name || 'DineFlow'}
                                                </h3>
                                                {brandSettings.tagline && (
                                                    <p className="text-sm opacity-90">{brandSettings.tagline}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div
                                            className="p-4 rounded-lg border"
                                            style={{
                                                backgroundColor: brandSettings.secondary_color || '#64748B',
                                                color: '#ffffff',
                                                borderRadius: brandSettings.border_radius === 'none' ? '0' : 
                                                           brandSettings.border_radius === 'small' ? '0.25rem' :
                                                           brandSettings.border_radius === 'medium' ? '0.5rem' :
                                                           brandSettings.border_radius === 'large' ? '1rem' : '9999px',
                                            }}
                                        >
                                            <h4 className="font-semibold mb-2">Feature 1</h4>
                                            <p className="text-sm">Sample content with your theme colors</p>
                                        </div>
                                        
                                        <div
                                            className="p-4 rounded-lg border"
                                            style={{
                                                backgroundColor: brandSettings.accent_color || '#EF4444',
                                                color: '#ffffff',
                                                borderRadius: brandSettings.border_radius === 'none' ? '0' : 
                                                           brandSettings.border_radius === 'small' ? '0.25rem' :
                                                           brandSettings.border_radius === 'medium' ? '0.5rem' :
                                                           brandSettings.border_radius === 'large' ? '1rem' : '9999px',
                                            }}
                                        >
                                            <h4 className="font-semibold mb-2">Feature 2</h4>
                                            <p className="text-sm">Sample content with your theme colors</p>
                                        </div>
                                        
                                        <div
                                            className="p-4 rounded-lg border"
                                            style={{
                                                backgroundColor: brandSettings.success_color || '#10B981',
                                                color: '#ffffff',
                                                borderRadius: brandSettings.border_radius === 'none' ? '0' : 
                                                           brandSettings.border_radius === 'small' ? '0.25rem' :
                                                           brandSettings.border_radius === 'medium' ? '0.5rem' :
                                                           brandSettings.border_radius === 'large' ? '1rem' : '9999px',
                                            }}
                                        >
                                            <h4 className="font-semibold mb-2">Feature 3</h4>
                                            <p className="text-sm">Sample content with your theme colors</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThemeBuilder;