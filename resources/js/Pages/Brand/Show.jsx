import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const Show = ({ brand }) => {
    return (
        <AuthenticatedLayout>
            <Head title={`Brand: ${brand.app_name}`} />
            
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{brand.app_name}</h1>
                                <p className="mt-2 text-gray-600">{brand.tagline}</p>
                            </div>
                            <div className="flex space-x-4">
                                <Link
                                    href={`/brands/${brand.id}/edit`}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Edit Brand
                                </Link>
                                <Link
                                    href="/brands"
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Back to Brands
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Brand Information */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                                </div>
                                <div className="px-6 py-4">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Brand Name</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.app_name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Brand Key</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.brand_key || 'N/A'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Industry Type</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.industry_type}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="mt-1">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    brand.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {brand.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.description || 'N/A'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.contact_email || 'N/A'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Contact Phone</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.contact_phone || 'N/A'}</dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Website</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {brand.website_url ? (
                                                    <a href={brand.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                        {brand.website_url}
                                                    </a>
                                                ) : 'N/A'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Theme Colors */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Theme Colors</h2>
                                </div>
                                <div className="px-6 py-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { field: 'primary_color', label: 'Primary' },
                                            { field: 'secondary_color', label: 'Secondary' },
                                            { field: 'accent_color', label: 'Accent' },
                                            { field: 'success_color', label: 'Success' },
                                            { field: 'warning_color', label: 'Warning' },
                                            { field: 'error_color', label: 'Error' },
                                            { field: 'info_color', label: 'Info' },
                                        ].map(({ field, label }) => (
                                            <div key={field} className="text-center">
                                                <div 
                                                    className="w-full h-16 rounded-md border border-gray-200 mb-2"
                                                    style={{ backgroundColor: brand[field] || '#000000' }}
                                                />
                                                <p className="text-sm font-medium text-gray-900">{label}</p>
                                                <p className="text-xs text-gray-500">{brand[field] || 'N/A'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Typography */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Typography & Layout</h2>
                                </div>
                                <div className="px-6 py-4">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Font Family</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.font_family || 'Inter'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Font Size</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.font_size || 'medium'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Border Radius</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.border_radius || 'medium'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Theme Mode</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{brand.theme_mode || 'light'}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Brand Logo */}
                            {brand.logo_url && (
                                <div className="bg-white shadow rounded-lg">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-lg font-medium text-gray-900">Brand Logo</h2>
                                    </div>
                                    <div className="px-6 py-4">
                                        <img 
                                            src={brand.logo_url} 
                                            alt={`${brand.app_name} logo`}
                                            className="w-full h-auto rounded-md"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Actions</h2>
                                </div>
                                <div className="px-6 py-4 space-y-3">
                                    <Link
                                        href={`/brands/${brand.id}/theme-builder`}
                                        className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                                    >
                                        Theme Builder
                                    </Link>
                                    <Link
                                        href={`/brands/${brand.id}/edit`}
                                        className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Edit Brand
                                    </Link>
                                    <Link
                                        href={`/brands/${brand.id}/export`}
                                        className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Export Settings
                                    </Link>
                                </div>
                            </div>

                            {/* Additional Settings */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Additional Settings</h2>
                                </div>
                                <div className="px-6 py-4">
                                    <dl className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Brand Preview</dt>
                                            <dd>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    brand.enable_brand_preview 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {brand.enable_brand_preview ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Sort Order</dt>
                                            <dd className="text-sm text-gray-900">{brand.sort_order || 0}</dd>
                                        </div>
                                        {brand.custom_domain && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Custom Domain</dt>
                                                <dd className="text-sm text-gray-900">{brand.custom_domain}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;