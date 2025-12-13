import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const Preview = ({ brand }) => {
    return (
        <AuthenticatedLayout>
            <Head title={`Brand Preview: ${brand.app_name}`} />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header with Brand Styling */}
                <header 
                    className="shadow-md"
                    style={{ backgroundColor: brand.primary_color || '#3B82F6' }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                {brand.logo_url && (
                                    <img 
                                        src={brand.logo_url} 
                                        alt={`${brand.app_name} logo`}
                                        className="h-8 w-auto mr-4"
                                    />
                                )}
                                <h1 
                                    className="text-xl font-bold"
                                    style={{ color: '#FFFFFF' }}
                                >
                                    {brand.app_name}
                                </h1>
                            </div>
                            <nav className="flex space-x-4">
                                <a 
                                    href="#" 
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white hover:bg-opacity-20"
                                    style={{ color: '#FFFFFF' }}
                                >
                                    Home
                                </a>
                                <a 
                                    href="#" 
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white hover:bg-opacity-20"
                                    style={{ color: '#FFFFFF' }}
                                >
                                    About
                                </a>
                                <a 
                                    href="#" 
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white hover:bg-opacity-20"
                                    style={{ color: '#FFFFFF' }}
                                >
                                    Services
                                </a>
                                <a 
                                    href="#" 
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white hover:bg-opacity-20"
                                    style={{ color: '#FFFFFF' }}
                                >
                                    Contact
                                </a>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <h2 
                            className="text-4xl font-bold mb-4"
                            style={{ color: brand.primary_color || '#3B82F6' }}
                        >
                            {brand.tagline || 'Welcome to ' + brand.app_name}
                        </h2>
                        <p 
                            className="text-xl max-w-3xl mx-auto mb-8"
                            style={{ color: brand.secondary_color || '#64748B' }}
                        >
                            {brand.description || 'Experience the best in class service and quality.'}
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                className="px-6 py-3 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: brand.accent_color || '#EF4444' }}
                            >
                                Get Started
                            </button>
                            <button
                                className="px-6 py-3 rounded-md font-medium border-2 hover:opacity-90 transition-opacity"
                                style={{ 
                                    borderColor: brand.primary_color || '#3B82F6',
                                    color: brand.primary_color || '#3B82F6'
                                }}
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <h2 
                            className="text-3xl font-bold text-center mb-12"
                            style={{ color: brand.primary_color || '#3B82F6' }}
                        >
                            Our Features
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    title: 'Easy to Use',
                                    description: 'Intuitive interface designed for maximum efficiency',
                                    color: brand.success_color || '#10B981'
                                },
                                {
                                    title: 'Reliable',
                                    description: 'Built with stability and performance in mind',
                                    color: brand.info_color || '#3B82F6'
                                },
                                {
                                    title: 'Secure',
                                    description: 'Enterprise-grade security for your peace of mind',
                                    color: brand.warning_color || '#F59E0B'
                                }
                            ].map((feature, index) => (
                                <div key={index} className="text-center">
                                    <div 
                                        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                                        style={{ backgroundColor: feature.color }}
                                    >
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 
                                        className="text-xl font-semibold mb-2"
                                        style={{ color: brand.primary_color || '#3B82F6' }}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p 
                                        className="text-gray-600"
                                        style={{ color: brand.secondary_color || '#64748B' }}
                                    >
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section 
                    className="py-16 px-4 sm:px-6 lg:px-8"
                    style={{ backgroundColor: brand.primary_color || '#3B82F6' }}
                >
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to get started?
                        </h2>
                        <p className="text-xl text-white mb-8 opacity-90">
                            Join thousands of satisfied customers using {brand.app_name}
                        </p>
                        <button
                            className="px-8 py-4 rounded-md text-lg font-medium text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: brand.accent_color || '#EF4444' }}
                        >
                            Start Free Trial
                        </button>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <div className="flex items-center mb-4">
                                    {brand.logo_url && (
                                        <img 
                                            src={brand.logo_url} 
                                            alt={`${brand.app_name} logo`}
                                            className="h-8 w-auto mr-2"
                                        />
                                    )}
                                    <h3 className="text-lg font-semibold">{brand.app_name}</h3>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    {brand.tagline || 'Quality service, every time.'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold mb-4">Product</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-white">Features</a></li>
                                    <li><a href="#" className="hover:text-white">Pricing</a></li>
                                    <li><a href="#" className="hover:text-white">Documentation</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold mb-4">Company</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-white">About</a></li>
                                    <li><a href="#" className="hover:text-white">Blog</a></li>
                                    <li><a href="#" className="hover:text-white">Careers</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold mb-4">Connect</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-white">Contact</a></li>
                                    <li><a href="#" className="hover:text-white">Support</a></li>
                                    <li><a href="#" className="hover:text-white">Community</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
                            <p>&copy; 2024 {brand.app_name}. All rights reserved.</p>
                        </div>
                    </div>
                </footer>

                {/* Preview Controls */}
                <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50">
                    <h3 className="text-sm font-semibold mb-2">Preview Controls</h3>
                    <div className="space-y-2">
                        <Link
                            href={`/brands/${brand.id}/edit`}
                            className="block w-full text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                            Edit Brand
                        </Link>
                        <Link
                            href="/brands"
                            className="block w-full text-center px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                            Back to Brands
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Preview;