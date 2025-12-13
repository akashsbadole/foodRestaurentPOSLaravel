import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import ThemeBuilderComponent from '@/Components/Brand/ThemeBuilder';

const ThemeBuilder = ({ brand, industryTemplates, industryTypes }) => {
    return (
        <AuthenticatedLayout>
            <Head title="Theme Builder" />
            <ThemeBuilderComponent 
                brand={brand} 
                industryTemplates={industryTemplates} 
                industryTypes={industryTypes} 
            />
        </AuthenticatedLayout>
    );
};

export default ThemeBuilder;