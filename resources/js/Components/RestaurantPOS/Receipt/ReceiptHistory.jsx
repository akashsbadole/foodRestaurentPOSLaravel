import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Table, Badge, Modal, Spinner, Alert } from '@/Components/ui';
import { Search, Filter, Calendar, Printer, Download, Eye, RefreshCw, BarChart3 } from 'lucide-react';

const ReceiptHistory = () => {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState('today');
    const [selectedStore, setSelectedStore] = useState('all');
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showReprintModal, setShowReprintModal] = useState(false);
    const [reprintOptions, setReprintOptions] = useState({
        template: 'standard',
        copies: 1
    });
    const [analytics, setAnalytics] = useState(null);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

    const dateRanges = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'custom', label: 'Custom Range' }
    ];

    const stores = [
        { value: 'all', label: 'All Stores' },
        { value: '1', label: 'Main Store' },
        { value: '2', label: 'Branch 1' },
        { value: '3', label: 'Branch 2' }
    ];

    const templates = [
        { value: 'standard', label: 'Standard' },
        { value: 'detailed', label: 'Detailed' },
        { value: 'thermal', label: 'Thermal' }
    ];

    useEffect(() => {
        fetchReceiptHistory();
    }, [selectedDateRange, selectedStore]);

    const fetchReceiptHistory = async () => {
        try {
            setLoading(true);
            
            // Calculate date range
            const { startDate, endDate } = getDateRange(selectedDateRange);
            
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate
            });
            
            if (selectedStore !== 'all') {
                params.append('store_id', selectedStore);
            }
            
            const response = await fetch(`/api/receipt/history?${params}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch receipt history');
            }
            
            const data = await response.json();
            setReceipts(data);
        } catch (error) {
            console.error('Error fetching receipt history:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const { startDate, endDate } = getDateRange(selectedDateRange);
            
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate
            });
            
            if (selectedStore !== 'all') {
                params.append('store_id', selectedStore);
            }
            
            const response = await fetch(`/api/receipt/analytics?${params}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }
            
            const data = await response.json();
            setAnalytics(data);
            setShowAnalyticsModal(true);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const getDateRange = (range) => {
        const today = new Date();
        let startDate, endDate;
        
        switch (range) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = endDate = yesterday.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                startDate = weekStart.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate = monthStart.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            default:
                startDate = endDate = today.toISOString().split('T')[0];
        }
        
        return { startDate, endDate };
    };

    const handleViewReceipt = (receipt) => {
        setSelectedReceipt(receipt);
        setShowReceiptModal(true);
    };

    const handleReprintReceipt = (receipt) => {
        setSelectedReceipt(receipt);
        setShowReprintModal(true);
    };

    const confirmReprint = async () => {
        if (!selectedReceipt) return;
        
        try {
            const response = await fetch('/api/receipt/reprint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'restaurant',
                    id: selectedReceipt.id,
                    template: reprintOptions.template,
                    copies: reprintOptions.copies
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`Receipt reprinted ${reprintOptions.copies} time(s) successfully!`);
                setShowReprintModal(false);
            } else {
                alert('Failed to reprint receipt');
            }
        } catch (error) {
            alert('Error reprinting receipt: ' + error.message);
        }
    };

    const filteredReceipts = receipts.filter(receipt =>
        receipt.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.table?.name && receipt.table.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (receipt.waiter?.name && receipt.waiter.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusBadge = (status) => {
        const variants = {
            'completed': 'success',
            'paid': 'success',
            'pending': 'warning',
            'cancelled': 'destructive'
        };
        
        return (
            <Badge variant={variants[status] || 'default'}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </Badge>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner size="lg" />
                <span className="ml-2">Loading receipt history...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Receipt History</h1>
                <div className="flex space-x-2">
                    <Button onClick={fetchAnalytics} variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                    </Button>
                    <Button onClick={fetchReceiptHistory} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by order number, table, or server..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    
                    <Select
                        value={selectedDateRange}
                        onValueChange={setSelectedDateRange}
                        options={dateRanges}
                        className="w-40"
                    />
                    
                    <Select
                        value={selectedStore}
                        onValueChange={setSelectedStore}
                        options={stores}
                        className="w-40"
                    />
                </div>
            </Card>

            {/* Receipts Table */}
            <Card className="p-0">
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Order #</Table.Head>
                            <Table.Head>Date & Time</Table.Head>
                            <Table.Head>Table</Table.Head>
                            <Table.Head>Server</Table.Head>
                            <Table.Head>Type</Table.Head>
                            <Table.Head>Amount</Table.Head>
                            <Table.Head>Status</Table.Head>
                            <Table.Head>Actions</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {filteredReceipts.map((receipt) => (
                            <Table.Row key={receipt.id}>
                                <Table.Cell className="font-medium">
                                    {receipt.order_number}
                                </Table.Cell>
                                <Table.Cell>
                                    <div>
                                        <div>{new Date(receipt.order_date).toLocaleDateString()}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(receipt.order_time).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    {receipt.table?.name || '-'}
                                </Table.Cell>
                                <Table.Cell>
                                    {receipt.waiter?.name || '-'}
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge variant="outline">
                                        {receipt.order_type?.replace('_', ' ')}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell className="font-medium">
                                    {formatCurrency(receipt.total_amount)}
                                </Table.Cell>
                                <Table.Cell>
                                    {getStatusBadge(receipt.status)}
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleViewReceipt(receipt)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReprintReceipt(receipt)}
                                        >
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
                
                {filteredReceipts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No receipts found matching your criteria.
                    </div>
                )}
            </Card>

            {/* Receipt View Modal */}
            <Modal
                open={showReceiptModal}
                onOpenChange={setShowReceiptModal}
                title="Receipt Details"
                size="lg"
            >
                {selectedReceipt && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Order Number</p>
                                <p className="font-semibold">{selectedReceipt.order_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date</p>
                                <p className="font-semibold">
                                    {new Date(selectedReceipt.order_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Table</p>
                                <p className="font-semibold">{selectedReceipt.table?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Server</p>
                                <p className="font-semibold">{selectedReceipt.waiter?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Type</p>
                                <p className="font-semibold">
                                    {selectedReceipt.order_type?.replace('_', ' ')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                <p className="font-semibold text-lg">
                                    {formatCurrency(selectedReceipt.total_amount)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
                                Close
                            </Button>
                            <Button>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reprint Modal */}
            <Modal
                open={showReprintModal}
                onOpenChange={setShowReprintModal}
                title="Reprint Receipt"
            >
                {selectedReceipt && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Order Number</p>
                            <p className="font-semibold">{selectedReceipt.order_number}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">Template</label>
                            <Select
                                value={reprintOptions.template}
                                onValueChange={(value) => setReprintOptions(prev => ({ ...prev, template: value }))}
                                options={templates}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">Copies</label>
                            <Input
                                type="number"
                                min="1"
                                max="5"
                                value={reprintOptions.copies}
                                onChange={(e) => setReprintOptions(prev => ({ 
                                    ...prev, 
                                    copies: Math.min(5, Math.max(1, parseInt(e.target.value) || 1))
                                }))}
                            />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowReprintModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={confirmReprint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Reprint
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Analytics Modal */}
            <Modal
                open={showAnalyticsModal}
                onOpenChange={setShowAnalyticsModal}
                title="Receipt Analytics"
                size="lg"
            >
                {analytics && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <Card className="p-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                                <p className="text-2xl font-bold">{analytics.total_orders}</p>
                            </Card>
                            <Card className="p-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(analytics.total_revenue)}
                                </p>
                            </Card>
                            <Card className="p-4">
                                <h3 className="text-sm font-medium text-gray-500">Avg Order Value</h3>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(analytics.average_order_value)}
                                </p>
                            </Card>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4">
                                <h3 className="text-lg font-semibold mb-3">Order Type Breakdown</h3>
                                <div className="space-y-2">
                                    {analytics.order_type_breakdown?.map((type, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span className="capitalize">{type.order_type?.replace('_', ' ')}</span>
                                            <span>{type.count} orders</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            
                            <Card className="p-4">
                                <h3 className="text-lg font-semibold mb-3">Payment Methods</h3>
                                <div className="space-y-2">
                                    {analytics.payment_breakdown?.map((payment, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span className="capitalize">{payment.payment_method}</span>
                                            <span>{formatCurrency(payment.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                        
                        <div className="flex justify-end">
                            <Button onClick={() => setShowAnalyticsModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ReceiptHistory;