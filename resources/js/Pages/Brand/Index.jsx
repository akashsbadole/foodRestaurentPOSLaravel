import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import WhiteLabelDashboard from '@/Components/Brand/WhiteLabelDashboard';

const Index = ({ brands, currentBrand }) => {
    return (
        <AuthenticatedLayout>
            <Head title="Brand Management" />
            <WhiteLabelDashboard brands={brands} currentBrand={currentBrand} />
        </AuthenticatedLayout>
    );
};

export default Index;