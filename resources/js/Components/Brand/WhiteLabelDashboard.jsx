import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';

const WhiteLabelDashboard = ({ brands, currentBrand }) => {
    const [selectedBrand, setSelectedBrand] = useState(currentBrand);
    const [viewMode, setViewMode] = useState('grid'); // grid, list, preview
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

    const filteredBrands = brands.filter(brand => {
        const matchesSearch = brand.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (brand.brand_key && brand.brand_key.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'all' ||
                             (filterStatus === 'active' && brand.is_active) ||
                             (filterStatus === 'inactive' && !brand.is_active);
        return matchesSearch && matchesStatus;
    });

    const handleBrandSwitch = (brand) => {
        setSelectedBrand(brand);
        // This would make an API call to switch the brand
        fetch('/brands/switch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({ brand_key: brand.brand_key })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                // Show success message or redirect
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Error switching brand:', error);
        });
    };

    const getIndustryIcon = (industryType) => {
        const icons = {
            'restaurant': '🍽️',
            'retail': '🛍️',
            'service': '🔧',
            'healthcare': '🏥',
        };
        return icons[industryType] || '🏢';
    };

    const getIndustryLabel = (industryType) => {
        return industryType.charAt(0).toUpperCase() + industryType.slice(1);
    };

    const renderBrandCard = (brand) => (
        <div
            key={brand.id}
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 ${
                selectedBrand?.id === brand.id ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setSelectedBrand(brand)}
        >
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        {brand.logo_url ? (
                            <img
                                src={brand.logo_url}
                                alt={brand.app_name}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                        ) : (
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: brand.primary_color || '#3B82F6' }}
                            >
                                {brand.app_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{brand.app_name}</h3>
                            <p className="text-sm text-gray-500">{brand.brand_key || 'No key'}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            brand.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {brand.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {getIndustryIcon(brand.industry_type)}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: brand.primary_color || '#3B82F6' }}
                        />
                        <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: brand.secondary_color || '#64748B' }}
                        />
                        <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: brand.accent_color || '#EF4444' }}
                        />
                        <span className="text-xs text-gray-500">Theme Colors</span>
                    </div>

                    {brand.tagline && (
                        <p className="text-sm text-gray-600 line-clamp-2">{brand.tagline}</p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-gray-500">
                            {getIndustryLabel(brand.industry_type)}
                        </span>
                        <div className="flex space-x-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/brands/${brand.id}/edit`;
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleBrandSwitch(brand);
                                }}
                                className="text-green-600 hover:text-green-800 text-sm"
                                disabled={selectedBrand?.id === brand.id}
                            >
                                {selectedBrand?.id === brand.id ? 'Current' : 'Switch'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBrandListItem = (brand) => (
        <div
            key={brand.id}
            className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-2 ${
                selectedBrand?.id === brand.id ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setSelectedBrand(brand)}
        >
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {brand.logo_url ? (
                            <img
                                src={brand.logo_url}
                                alt={brand.app_name}
                                className="w-10 h-10 rounded-lg object-cover"
                            />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: brand.primary_color || '#3B82F6' }}
                            >
                                {brand.app_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{brand.app_name}</h3>
                            <p className="text-sm text-gray-500">{brand.brand_key || 'No key'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: brand.primary_color || '#3B82F6' }}
                            />
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: brand.secondary_color || '#64748B' }}
                            />
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: brand.accent_color || '#EF4444' }}
                            />
                        </div>

                        <span className={`px-2 py-1 text-xs rounded-full ${
                            brand.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {brand.is_active ? 'Active' : 'Inactive'}
                        </span>

                        <span className="text-sm text-gray-500">
                            {getIndustryIcon(brand.industry_type)} {getIndustryLabel(brand.industry_type)}
                        </span>

                        <div className="flex space-x-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/brands/${brand.id}/edit`;
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleBrandSwitch(brand);
                                }}
                                className="text-green-600 hover:text-green-800 text-sm"
                                disabled={selectedBrand?.id === brand.id}
                            >
                                {selectedBrand?.id === brand.id ? 'Current' : 'Switch'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPreviewMode = () => (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {selectedBrand ? (
                <div>
                    <div
                        className="p-6"
                        style={{
                            backgroundColor: selectedBrand.primary_color || '#3B82F6',
                            color: '#ffffff',
                            fontFamily: selectedBrand.font_family || 'Inter',
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {selectedBrand.logo_url && (
                                    <img
                                        src={selectedBrand.logo_url}
                                        alt="Logo"
                                        className="h-12 w-auto"
                                    />
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedBrand.app_name}</h2>
                                    {selectedBrand.tagline && (
                                        <p className="text-sm opacity-90">{selectedBrand.tagline}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm">
                                    {getIndustryIcon(selectedBrand.industry_type)} {getIndustryLabel(selectedBrand.industry_type)}
                                </span>
                                <span className={`px-3 py-1 text-xs rounded-full ${
                                    selectedBrand.is_active ? 'bg-white text-green-800' : 'bg-gray-200 text-gray-800'
                                }`}>
                                    {selectedBrand.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Brand Information</h3>
                                <dl className="space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500">Brand Key:</dt>
                                        <dd className="text-sm text-gray-900">{selectedBrand.brand_key || 'Not set'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500">Industry:</dt>
                                        <dd className="text-sm text-gray-900">{getIndustryLabel(selectedBrand.industry_type)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500">Theme:</dt>
                                        <dd className="text-sm text-gray-900">{selectedBrand.industry_template || 'Default'}</dd>
                                    </div>
                                    {selectedBrand.contact_email && (
                                        <div className="flex justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Email:</dt>
                                            <dd className="text-sm text-gray-900">{selectedBrand.contact_email}</dd>
                                        </div>
                                    )}
                                    {selectedBrand.contact_phone && (
                                        <div className="flex justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Phone:</dt>
                                            <dd className="text-sm text-gray-900">{selectedBrand.contact_phone}</dd>
                                        </div>
                                    )}
                                    {selectedBrand.website_url && (
                                        <div className="flex justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Website:</dt>
                                            <dd className="text-sm text-gray-900">
                                                <a href={selectedBrand.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                    {selectedBrand.website_url}
                                                </a>
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Theme Colors</h3>
                                <div className="space-y-3">
                                    {[
                                        { name: 'Primary', color: selectedBrand.primary_color },
                                        { name: 'Secondary', color: selectedBrand.secondary_color },
                                        { name: 'Accent', color: selectedBrand.accent_color },
                                        { name: 'Success', color: selectedBrand.success_color },
                                        { name: 'Warning', color: selectedBrand.warning_color },
                                        { name: 'Error', color: selectedBrand.error_color },
                                    ].map(({ name, color }) => (
                                        <div key={name} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">{name}:</span>
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-6 h-6 rounded border border-gray-300"
                                                    style={{ backgroundColor: color || '#000000' }}
                                                />
                                                <span className="text-sm text-gray-600">{color || '#000000'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {selectedBrand.description && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">Description</h3>
                                <p className="text-gray-600">{selectedBrand.description}</p>
                            </div>
                        )}

                        <div className="mt-6 flex space-x-4">
                            <button
                                onClick={() => window.location.href = `/brands/${selectedBrand.id}/edit`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Edit Brand
                            </button>
                            <button
                                onClick={() => window.location.href = `/brands/${selectedBrand.id}/theme-builder`}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Open Theme Builder
                            </button>
                            <button
                                onClick={() => {
                                    // Export functionality
                                    fetch(`/brands/${selectedBrand.id}/export`)
                                        .then(response => response.json())
                                        .then(data => {
                                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${selectedBrand.brand_key || 'brand'}-export.json`;
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        });
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                Export Settings
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Brand Selected</h3>
                    <p className="text-gray-500">Select a brand from the list to preview its settings</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="White Label Dashboard" />
            
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">White Label Dashboard</h1>
                                <p className="mt-2 text-gray-600">Manage your brands and customize their appearance</p>
                            </div>
                            <Link
                                href="/brands/create"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Create New Brand
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search brands..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Brands</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded ${
                                            viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded ${
                                            viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('preview')}
                                        className={`p-2 rounded ${
                                            viewMode === 'preview' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="text-sm text-gray-600">
                                Showing {filteredBrands.length} of {brands.length} brands
                            </div>
                        </div>
                    </div>

                    {viewMode === 'preview' ? (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-lg font-semibold mb-4">Select a Brand to Preview</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredBrands.map(brand => (
                                        <div
                                            key={brand.id}
                                            onClick={() => setSelectedBrand(brand)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                selectedBrand?.id === brand.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                {brand.logo_url ? (
                                                    <img
                                                        src={brand.logo_url}
                                                        alt={brand.app_name}
                                                        className="w-8 h-8 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
                                                        style={{ backgroundColor: brand.primary_color || '#3B82F6' }}
                                                    >
                                                        {brand.app_name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{brand.app_name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{brand.brand_key || 'No key'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {renderPreviewMode()}
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {filteredBrands.map(brand => 
                                viewMode === 'grid' ? renderBrandCard(brand) : renderBrandListItem(brand)
                            )}
                        </div>
                    )}

                    {filteredBrands.length === 0 && (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first brand'}
                            </p>
                            {(!searchTerm && filterStatus === 'all') && (
                                <Link
                                    href="/brands/create"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Create New Brand
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhiteLabelDashboard;