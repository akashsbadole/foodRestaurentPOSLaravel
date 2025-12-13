import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const Create = ({ industryTypes, industryTemplates }) => {
    const { data, setData, post, processing, errors } = useForm({
        app_name: '',
        brand_key: '',
        tagline: '',
        description: '',
        contact_email: '',
        contact_phone: '',
        website_url: '',
        industry_type: 'restaurant',
        industry_template: 'modern',
        primary_color: '#3B82F6',
        secondary_color: '#64748B',
        accent_color: '#EF4444',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        info_color: '#3B82F6',
        theme_mode: 'light',
        font_family: 'Inter',
        font_size: 'medium',
        border_radius: 'medium',
        sidebar_style: 'default',
        is_active: true,
        enable_brand_preview: true,
    });

    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/brands');
    };

    const handleTemplateSelect = (templateKey, template) => {
        setSelectedTemplate(templateKey);
        setData({
            ...data,
            ...template,
            industry_template: templateKey
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Brand" />
            
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Create New Brand</h1>
                        <p className="mt-2 text-gray-600">Set up a new brand with custom styling and configuration</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                            </div>
                            <div className="px-6 py-4">
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
                                </div>

                                <div className="mt-6">
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

                                <div className="mt-6 flex items-center space-x-4">
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
                        </div>

                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Theme Colors</h2>
                            </div>
                            <div className="px-6 py-4">
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
                        </div>

                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Typography & Layout</h2>
                            </div>
                            <div className="px-6 py-4">
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
                        </div>

                        {industryTemplates && Object.keys(industryTemplates).length > 0 && (
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Industry Templates</h2>
                                    <p className="text-sm text-gray-600 mt-1">Choose a pre-configured template for your industry</p>
                                </div>
                                <div className="px-6 py-4">
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
                            </div>
                        )}

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
                                Create Brand
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Create;