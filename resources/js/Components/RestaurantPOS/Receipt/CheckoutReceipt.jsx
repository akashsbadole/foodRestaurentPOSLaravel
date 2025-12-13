import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Badge, Modal } from '@/Components/ui';
import { 
    Printer, 
    Download, 
    Mail, 
    Share2, 
    QrCode, 
    CheckCircle, 
    Clock,
    DollarSign,
    Users,
    Receipt,
    Settings
} from 'lucide-react';
import ReceiptViewer from './ReceiptViewer';
import ReceiptFeedback from './ReceiptFeedback';

const CheckoutReceipt = ({ 
    orderData, 
    paymentData, 
    onReceiptGenerated, 
    onPrintComplete,
    autoPrint = false 
}) => {
    const [loading, setLoading] = useState(false);
    const [receiptOptions, setReceiptOptions] = useState({
        template: 'standard',
        autoPrint: autoPrint,
        emailReceipt: false,
        customerEmail: '',
        enableFeedback: true,
        enableLoyalty: true,
        copies: 1
    });
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [generatedReceipt, setGeneratedReceipt] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const receiptTemplates = [
        { 
            value: 'standard', 
            label: 'Standard', 
            description: 'Basic receipt with essential information',
            icon: Receipt
        },
        { 
            value: 'detailed', 
            label: 'Detailed', 
            description: 'Comprehensive receipt with all details',
            icon: Receipt
        },
        { 
            value: 'thermal', 
            label: 'Thermal', 
            description: 'Optimized for thermal printers',
            icon: Printer
        }
    ];

    useEffect(() => {
        if (orderData && paymentData) {
            generateReceipt();
        }
    }, [orderData, paymentData]);

    const generateReceipt = async () => {
        if (!orderData || !paymentData) return;

        try {
            setLoading(true);

            const receiptData = {
                order: orderData,
                payment: paymentData,
                settings: {
                    shop_name: 'Restaurant Name',
                    shop_address: '123 Restaurant St',
                    shop_phone: '+1 234 567 8900',
                    shop_email: 'info@restaurant.com'
                },
                options: receiptOptions
            };

            const response = await fetch('/api/receipt/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'restaurant',
                    id: orderData.id,
                    template: receiptOptions.template,
                    format: 'html'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate receipt');
            }

            const result = await response.json();
            setGeneratedReceipt(result);

            // Auto-print if enabled
            if (receiptOptions.autoPrint) {
                await handlePrint();
            }

            // Send email if enabled
            if (receiptOptions.emailReceipt && receiptOptions.customerEmail) {
                await handleEmailReceipt();
            }

            if (onReceiptGenerated) {
                onReceiptGenerated(result);
            }
        } catch (error) {
            console.error('Error generating receipt:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!generatedReceipt) return;

        try {
            const response = await fetch('/api/receipt/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'restaurant',
                    id: orderData.id,
                    template: receiptOptions.template,
                    copies: receiptOptions.copies
                })
            });

            const result = await response.json();
            
            if (result.success) {
                if (onPrintComplete) {
                    onPrintComplete(result);
                }
            }
        } catch (error) {
            console.error('Error printing receipt:', error);
        }
    };

    const handleEmailReceipt = async () => {
        if (!generatedReceipt || !receiptOptions.customerEmail) return;

        try {
            const response = await fetch('/api/receipt/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'restaurant',
                    id: orderData.id,
                    email: receiptOptions.customerEmail,
                    template: receiptOptions.template
                })
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Receipt sent to email successfully!');
            }
        } catch (error) {
            console.error('Error sending email:', error);
        }
    };

    const handleShare = async () => {
        if (!generatedReceipt) return;

        try {
            const response = await fetch('/api/receipt/share-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'restaurant',
                    id: orderData.id
                })
            });

            const qrCodes = await response.json();
            
            // Show QR codes modal
            setShowReceiptModal(true);
        } catch (error) {
            console.error('Error generating share QR:', error);
        }
    };

    const handleDownload = async (format) => {
        if (!generatedReceipt) return;

        try {
            const response = await fetch('/api/receipt/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'restaurant',
                    id: orderData.id,
                    template: receiptOptions.template,
                    format: format
                })
            });

            const result = await response.json();
            
            if (format === 'pdf' && result.url) {
                const link = document.createElement('a');
                link.href = result.url;
                link.download = result.filename;
                link.click();
            } else if (format === 'image' && result.url) {
                const link = document.createElement('a');
                link.href = result.url;
                link.download = result.filename;
                link.click();
            }
        } catch (error) {
            console.error('Error downloading receipt:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <Card className="p-8 text-center">
                <Spinner size="lg" />
                <p className="mt-4">Generating receipt...</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Receipt Summary */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                        Payment Complete
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettings(true)}
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Receipt Settings
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(paymentData.total_amount)}
                        </div>
                        <p className="text-sm text-gray-500">Total Paid</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {orderData.order_number}
                        </div>
                        <p className="text-sm text-gray-500">Order #</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {orderData.table?.name || '-'}
                        </div>
                        <p className="text-sm text-gray-500">Table</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {orderData.customer_count}
                        </div>
                        <p className="text-sm text-gray-500">Guests</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button onClick={handlePrint} className="w-full">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={() => handleDownload('pdf')} variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                    </Button>
                    <Button onClick={handleShare} variant="outline" className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button onClick={() => setShowReceiptModal(true)} variant="outline" className="w-full">
                        <QrCode className="w-4 h-4 mr-2" />
                        View
                    </Button>
                </div>
            </Card>

            {/* Receipt Settings Modal */}
            <Modal
                open={showSettings}
                onOpenChange={setShowSettings}
                title="Receipt Settings"
                size="lg"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-3">Receipt Template</label>
                        <div className="space-y-3">
                            {receiptTemplates.map((template) => (
                                <div
                                    key={template.value}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        receiptOptions.template === template.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setReceiptOptions(prev => ({ ...prev, template: template.value }))}
                                >
                                    <div className="flex items-center">
                                        <template.icon className="w-5 h-5 mr-3" />
                                        <div>
                                            <p className="font-medium">{template.label}</p>
                                            <p className="text-sm text-gray-500">{template.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={receiptOptions.autoPrint}
                                    onChange={(e) => setReceiptOptions(prev => ({ 
                                        ...prev, 
                                        autoPrint: e.target.checked 
                                    }))}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium">Auto-print receipt</span>
                            </label>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={receiptOptions.enableFeedback}
                                    onChange={(e) => setReceiptOptions(prev => ({ 
                                        ...prev, 
                                        enableFeedback: e.target.checked 
                                    }))}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium">Enable feedback</span>
                            </label>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={receiptOptions.emailReceipt}
                                    onChange={(e) => setReceiptOptions(prev => ({ 
                                        ...prev, 
                                        emailReceipt: e.target.checked 
                                    }))}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium">Email receipt</span>
                            </label>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={receiptOptions.enableLoyalty}
                                    onChange={(e) => setReceiptOptions(prev => ({ 
                                        ...prev, 
                                        enableLoyalty: e.target.checked 
                                    }))}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium">Loyalty points</span>
                            </label>
                        </div>
                    </div>

                    {receiptOptions.emailReceipt && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Customer Email</label>
                            <input
                                type="email"
                                value={receiptOptions.customerEmail}
                                onChange={(e) => setReceiptOptions(prev => ({ 
                                    ...prev, 
                                    customerEmail: e.target.value 
                                }))}
                                placeholder="customer@example.com"
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">Print Copies</label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={receiptOptions.copies}
                            onChange={(e) => setReceiptOptions(prev => ({ 
                                ...prev, 
                                copies: Math.min(5, Math.max(1, parseInt(e.target.value) || 1))
                            }))}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setShowSettings(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            setShowSettings(false);
                            generateReceipt();
                        }}>
                            Apply Settings
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Receipt View Modal */}
            <Modal
                open={showReceiptModal}
                onOpenChange={setShowReceiptModal}
                title="Receipt Preview"
                size="xl"
            >
                {generatedReceipt && (
                    <div className="space-y-4">
                        <ReceiptViewer
                            orderId={orderData.id}
                            type="restaurant"
                            initialTemplate={receiptOptions.template}
                        />
                        
                        <div className="flex justify-end space-x-3">
                            {receiptOptions.enableFeedback && (
                                <Button onClick={() => setShowFeedback(true)} variant="outline">
                                    Give Feedback
                                </Button>
                            )}
                            <Button onClick={() => setShowReceiptModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Feedback Modal */}
            {showFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Receipt Feedback</h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowFeedback(false)}
                                >
                                    ×
                                </Button>
                            </div>
                            <ReceiptFeedback
                                orderId={orderData.id}
                                token={new URLSearchParams(window.location.search).get('token')}
                                onFeedbackSubmitted={() => setShowFeedback(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutReceipt;