import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const Edit = ({ brand, industryTypes, industryTemplates }) => {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        app_name: brand.app_name || '',
        brand_key: brand.brand_key || '',
        tagline: brand.tagline || '',
        description: brand.description || '',
        contact_email: brand.contact_email || '',
        contact_phone: brand.contact_phone || '',
        website_url: brand.website_url || '',
        industry_type: brand.industry_type || 'restaurant',
        industry_template: brand.industry_template || 'modern',
        primary_color: brand.primary_color || '#3B82F6',
        secondary_color: brand.secondary_color || '#64748B',
        accent_color: brand.accent_color || '#EF4444',
        success_color: brand.success_color || '#10B981',
        warning_color: brand.warning_color || '#F59E0B',
        error_color: brand.error_color || '#EF4444',
        info_color: brand.info_color || '#3B82F6',
        theme_mode: brand.theme_mode || 'light',
        font_family: brand.font_family || 'Inter',
        font_size: brand.font_size || 'medium',
        border_radius: brand.border_radius || 'medium',
        sidebar_style: brand.sidebar_style || 'default',
        is_active: brand.is_active ?? true,
        enable_brand_preview: brand.enable_brand_preview ?? true,
        custom_css: brand.custom_css || '',
        custom_js: brand.custom_js || '',
        custom_head: brand.custom_head || '',
        receipt_header: brand.receipt_header || '',
        receipt_footer: brand.receipt_footer || '',
        custom_domain: brand.custom_domain || '',
    });

    const [selectedTemplate, setSelectedTemplate] = useState(brand.industry_template || null);
    const [activeTab, setActiveTab] = useState('basic');

    const tabs = [
        { id: 'basic', label: 'Basic Branding', icon: '🏢' },
        { id: 'theme', label: 'Theme Colors', icon: '🎨' },
        { id: 'typography', label: 'Typography', icon: '📝' },
        { id: 'industry', label: 'Industry Settings', icon: '🍽️' },
        { id: 'advanced', label: 'Advanced', icon: '⚙️' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/brands/${brand.id}`);
    };

    const handleTemplateSelect = (templateKey, template) => {
        setSelectedTemplate(templateKey);
        setData({
            ...data,
            ...template,
            industry_template: templateKey
        });
    };

    const handleFileUpload = (field, file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setData(field, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderBasicBranding = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand Name *
                    </label>
                    <input
                        type="text"
                        value={data.app_name}
                        onChange={(e) => setData('app_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="DineFlow"
                    />
                    {errors.app_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.app_name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand Key
                    </label>
                    <input
                        type="text"
                        value={data.brand_key}
                        onChange={(e) => setData('brand_key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="dineflow"
                    />
                    {errors.brand_key && (
                        <p className="mt-1 text-sm text-red-600">{errors.brand_key}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tagline
                    </label>
                    <input
                        type="text"
                        value={data.tagline}
                        onChange={(e) => setData('tagline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Restaurant POS System"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry Type *
                    </label>
                    <select
                        value={data.industry_type}
                        onChange={(e) => setData('industry_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {industryTypes.map(type => (
                            <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                        ))}
                    </select>
                    {errors.industry_type && (
                        <p className="mt-1 text-sm text-red-600">{errors.industry_type}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                    </label>
                    <input
                        type="email"
                        value={data.contact_email}
                        onChange={(e) => setData('contact_email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="contact@example.com"
                    />
                    {errors.contact_email && (
                        <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                    </label>
                    <input
                        type="tel"
                        value={data.contact_phone}
                        onChange={(e) => setData('contact_phone', e.target.value)}
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
                        value={data.website_url}
                        onChange={(e) => setData('website_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Domain
                    </label>
                    <input
                        type="text"
                        value={data.custom_domain}
                        onChange={(e) => setData('custom_domain', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="restaurant.example.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Complete restaurant management solution"
                />
            </div>

            <div className="flex items-center space-x-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="mr-2"
                    />
                    Active
                </label>

                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={data.enable_brand_preview}
                        onChange={(e) => setData('enable_brand_preview', e.target.checked)}
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
                                value={data[field] || defaultColor}
                                onChange={(e) => setData(field, e.target.value)}
                                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={data[field] || defaultColor}
                                onChange={(e) => setData(field, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                ))}
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
                        value={data.font_family}
                        onChange={(e) => setData('font_family', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="Oswald">Oswald</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size
                    </label>
                    <select
                        value={data.font_size}
                        onChange={(e) => setData('font_size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="small">Small (14px)</option>
                        <option value="medium">Medium (16px)</option>
                        <option value="large">Large (18px)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Border Radius
                    </label>
                    <select
                        value={data.border_radius}
                        onChange={(e) => setData('border_radius', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="none">None</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="full">Full</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme Mode
                    </label>
                    <select
                        value={data.theme_mode}
                        onChange={(e) => setData('theme_mode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sidebar Style
                    </label>
                    <select
                        value={data.sidebar_style}
                        onChange={(e) => setData('sidebar_style', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="default">Default</option>
                        <option value="condensed">Condensed</option>
                        <option value="expanded">Expanded</option>
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
                        Receipt Header
                    </label>
                    <input
                        type="text"
                        value={data.receipt_header}
                        onChange={(e) => setData('receipt_header', e.target.value)}
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
                        value={data.receipt_footer}
                        onChange={(e) => setData('receipt_footer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Please come again!"
                    />
                </div>
            </div>

            {industryTemplates && Object.keys(industryTemplates).length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Industry Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(industryTemplates).map(([key, template]) => (
                            <div
                                key={key}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedTemplate === key
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleTemplateSelect(key, template)}
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
            )}
        </div>
    );

    const renderAdvanced = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom CSS
                </label>
                <textarea
                    value={data.custom_css}
                    onChange={(e) => setData('custom_css', e.target.value)}
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
                    value={data.custom_js}
                    onChange={(e) => setData('custom_js', e.target.value)}
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
                    value={data.custom_head}
                    onChange={(e) => setData('custom_head', e.target.value)}
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
        <AuthenticatedLayout>
            <Head title={`Edit Brand: ${brand.app_name}`} />
            
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Brand</h1>
                        <p className="mt-2 text-gray-600">Update brand settings and customization options</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-white rounded-lg shadow">
                            <div className="border-b border-gray-200">
                                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
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
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Link
                                href="/brands"
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                Update Brand
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Edit;