import React, { useState, useEffect } from 'react';
import { Card, Button, Select, ButtonGroup, Spinner, Alert } from '@/Components/ui';
import { Printer, Download, Share2, Mail, QrCode, FileText, Image, FileImage } from 'lucide-react';

const ReceiptViewer = ({ orderId, type = 'restaurant', initialTemplate = 'standard' }) => {
    const [receiptData, setReceiptData] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [receiptContent, setReceiptContent] = useState(null);

    const templates = [
        { value: 'standard', label: 'Standard', icon: FileText },
        { value: 'detailed', label: 'Detailed', icon: FileText },
        { value: 'thermal', label: 'Thermal Printer', icon: Printer }
    ];

    const formats = [
        { value: 'html', label: 'HTML', icon: FileText },
        { value: 'print', label: 'Print', icon: Printer },
        { value: 'pdf', label: 'PDF', icon: FileText },
        { value: 'image', label: 'Image', icon: Image }
    ];

    useEffect(() => {
        fetchReceiptData();
    }, [orderId, type, selectedTemplate]);

    const fetchReceiptData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const endpoint = type === 'restaurant' 
                ? `/api/receipt/restaurant/${orderId}/${selectedTemplate}`
                : `/api/receipt/split-bill/${orderId}/${selectedTemplate}`;
            
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error('Failed to fetch receipt data');
            }
            
            const data = await response.json();
            setReceiptData(data);
            
            // Generate HTML content for display
            await generateReceiptContent('html');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateReceiptContent = async (format) => {
        try {
            const payload = {
                type: type,
                id: orderId,
                template: selectedTemplate,
                format: format
            };

            const response = await fetch('/api/receipt/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to generate receipt');
            }

            const result = await response.json();
            setReceiptContent(result);
            
            return result;
        } catch (err) {
            setError(err.message);
            return null;
        }
    };

    const handlePrint = async () => {
        const content = await generateReceiptContent('print');
        if (content) {
            // Send to printer
            try {
                const response = await fetch('/api/receipt/print', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: type,
                        id: orderId,
                        template: selectedTemplate
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Receipt sent to printer successfully!');
                } else {
                    alert('Failed to print receipt');
                }
            } catch (err) {
                alert('Error printing receipt: ' + err.message);
            }
        }
    };

    const handleDownload = async (format) => {
        const content = await generateReceiptContent(format);
        if (content) {
            if (format === 'pdf' && content.url) {
                // Download PDF
                const link = document.createElement('a');
                link.href = content.url;
                link.download = content.filename;
                link.click();
            } else if (format === 'image' && content.url) {
                // Download image
                const link = document.createElement('a');
                link.href = content.url;
                link.download = content.filename;
                link.click();
            } else if (format === 'html') {
                // Print HTML
                const printWindow = window.open('', '_blank');
                printWindow.document.write(receiptData.receipt_html || '');
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    const handleShare = async () => {
        try {
            const response = await fetch('/api/receipt/share-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: type,
                    id: orderId
                })
            });

            const qrCodes = await response.json();
            
            // Show QR codes modal
            setShowQRModal(true);
            setQRCodes(qrCodes);
        } catch (err) {
            alert('Error generating share QR codes: ' + err.message);
        }
    };

    const handleEmailShare = async () => {
        const email = prompt('Enter email address to share receipt:');
        if (email) {
            try {
                const response = await fetch('/api/receipt/share', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: type,
                        id: orderId,
                        email: email,
                        template: selectedTemplate
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Receipt sent to email successfully!');
                } else {
                    alert('Failed to send receipt to email');
                }
            } catch (err) {
                alert('Error sending email: ' + err.message);
            }
        }
    };

    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodes, setQRCodes] = useState(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner size="lg" />
                <span className="ml-2">Loading receipt...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="m-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Template:</label>
                        <Select
                            value={selectedTemplate}
                            onValueChange={setSelectedTemplate}
                            options={templates.map(t => ({
                                value: t.value,
                                label: t.label
                            }))}
                            className="w-40"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <ButtonGroup>
                            <Button onClick={handlePrint} variant="outline" size="sm">
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                            </Button>
                            <Button onClick={() => handleDownload('pdf')} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                            </Button>
                            <Button onClick={() => handleDownload('image')} variant="outline" size="sm">
                                <Image className="w-4 h-4 mr-1" />
                                Image
                            </Button>
                        </ButtonGroup>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button onClick={handleShare} variant="outline" size="sm">
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                        </Button>
                        <Button onClick={handleEmailShare} variant="outline" size="sm">
                            <Mail className="w-4 h-4 mr-1" />
                            Email
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Receipt Display */}
            <Card className="p-6">
                <div className="receipt-container">
                    {receiptData && (
                        <div dangerouslySetInnerHTML={{ 
                            __html: selectedTemplate === 'thermal' 
                                ? `<pre style="font-family: monospace; white-space: pre-wrap;">${receiptData.receipt_text || ''}</pre>`
                                : receiptData.receipt_html || '' 
                        }} />
                    )}
                </div>
            </Card>

            {/* QR Code Modal */}
            {showQRModal && qrCodes && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Share Receipt</h3>
                        
                        <div className="space-y-4">
                            {qrCodes.digital_receipt && (
                                <div className="text-center">
                                    <p className="text-sm font-medium mb-2">Digital Receipt</p>
                                    <img src={qrCodes.digital_receipt} alt="Digital Receipt QR" className="mx-auto" />
                                </div>
                            )}
                            
                            {qrCodes.whatsapp && qrCodes.whatsapp.url && (
                                <div className="text-center">
                                    <p className="text-sm font-medium mb-2">Share via WhatsApp</p>
                                    <img src={qrCodes.whatsapp.url} alt="WhatsApp QR" className="mx-auto" />
                                </div>
                            )}
                            
                            {qrCodes.feedback && qrCodes.feedback.url && (
                                <div className="text-center">
                                    <p className="text-sm font-medium mb-2">Give Feedback</p>
                                    <img src={qrCodes.feedback.url} alt="Feedback QR" className="mx-auto" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end mt-6">
                            <Button onClick={() => setShowQRModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiptViewer;