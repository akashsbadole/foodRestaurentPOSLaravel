import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner } from '@/Components/ui';
import { 
    Share2, 
    Download, 
    Mail, 
    QrCode, 
    Star, 
    MessageSquare, 
    Wallet,
    ArrowLeft,
    Printer,
    Camera
} from 'lucide-react';

const MobileReceiptView = ({ receiptData, onBack, onShare, onDownload, onEmail }) => {
    const [loading, setLoading] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [showQRCode, setShowQRCode] = useState(false);

    const order = receiptData.order;
    const settings = receiptData.settings;
    const loyaltyPoints = receiptData.loyalty_points;
    const qrCodeUrl = receiptData.qr_code_url;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const handleFeedbackSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        try {
            setLoading(true);
            
            const response = await fetch(`/api/feedback/${order.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    feedback,
                    receipt_token: new URLSearchParams(window.location.search).get('token')
                })
            });

            if (response.ok) {
                alert('Thank you for your feedback!');
                setShowFeedback(false);
                setRating(0);
                setFeedback('');
            } else {
                throw new Error('Failed to submit feedback');
            }
        } catch (error) {
            alert('Error submitting feedback: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToWallet = async () => {
        try {
            setLoading(true);
            
            const response = await fetch(`/api/wallet/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receipt_data: receiptData,
                    wallet_type: 'apple' // Detect device type
                })
            });

            if (response.ok) {
                alert('Receipt added to your digital wallet!');
            } else {
                throw new Error('Failed to add to wallet');
            }
        } catch (error) {
            alert('Error adding to wallet: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleShareReceipt = (method) => {
        const shareData = {
            title: `Receipt from ${settings.shop_name || 'Restaurant'}`,
            text: `Order #${order.order_number} - ${formatCurrency(order.total_amount)}`,
            url: window.location.href
        };

        if (navigator.share && method === 'native') {
            navigator.share(shareData);
        } else if (method === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
        } else if (method === 'copy') {
            navigator.clipboard.writeText(shareData.url);
            alert('Receipt link copied to clipboard!');
        }
        
        setShowShareOptions(false);
    };

    const renderStars = () => {
        return (
            <div className="flex space-x-2 justify-center my-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                    >
                        <Star
                            className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    if (!order) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner size="lg" />
                <span className="ml-2">Loading receipt...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onBack}
                        className="flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    
                    <h1 className="text-lg font-semibold">Receipt</h1>
                    
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowShareOptions(true)}
                    >
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Restaurant Header */}
                <Card className="p-4 text-center">
                    {settings.shop_logo && (
                        <img 
                            src={settings.shop_logo} 
                            alt="Restaurant Logo" 
                            className="w-24 h-24 mx-auto mb-3 rounded-lg"
                        />
                    )}
                    <h2 className="text-xl font-bold">{settings.shop_name || 'Restaurant'}</h2>
                    <p className="text-sm text-gray-600">{settings.shop_address}</p>
                    <p className="text-sm text-gray-600">{settings.shop_phone}</p>
                </Card>

                {/* Order Information */}
                <Card className="p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-gray-500">Order #</p>
                            <p className="font-semibold">{order.order_number}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-semibold">
                                {new Date(order.order_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">Time</p>
                            <p className="font-semibold">
                                {new Date(order.order_time).toLocaleTimeString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">Table</p>
                            <p className="font-semibold">{order.table?.name || '-'}</p>
                        </div>
                        {order.waiter && (
                            <div className="col-span-2">
                                <p className="text-gray-500">Server</p>
                                <p className="font-semibold">{order.waiter.name}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Order Items */}
                <Card className="p-4">
                    <h3 className="font-semibold mb-3">Order Items</h3>
                    <div className="space-y-3">
                        {order.items?.map((item, index) => (
                            <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.product?.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {item.quantity} x {formatCurrency(item.unit_price)}
                                        </p>
                                        
                                        {/* Modifiers */}
                                        {item.modifiers?.length > 0 && (
                                            <div className="mt-1 space-y-1">
                                                {item.modifiers.map((modifier, modIndex) => (
                                                    <p key={modIndex} className="text-xs text-gray-500">
                                                        + {modifier.modifier?.name}
                                                        {modifier.price_adjustment > 0 && 
                                                            ` (+${formatCurrency(modifier.price_adjustment)})`
                                                        }
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Special Instructions */}
                                        {item.special_instructions && (
                                            <p className="text-xs text-gray-500 italic mt-1">
                                                Note: {item.special_instructions}
                                            </p>
                                        )}
                                    </div>
                                    <p className="font-semibold">
                                        {formatCurrency(item.quantity * item.unit_price)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Order Summary */}
                <Card className="p-4">
                    <h3 className="font-semibold mb-3">Order Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.discount_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>Discount</span>
                                <span className="text-red-600">
                                    -{formatCurrency(order.discount_amount)}
                                </span>
                            </div>
                        )}
                        {order.tax_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>Tax</span>
                                <span>{formatCurrency(order.tax_amount)}</span>
                            </div>
                        )}
                        {order.service_charge > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>Service Charge</span>
                                <span>{formatCurrency(order.service_charge)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                    </div>
                </Card>

                {/* Loyalty Points */}
                {loyaltyPoints && (
                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-purple-900">Loyalty Points</h3>
                                <p className="text-sm text-purple-700">
                                    You earned {loyaltyPoints.points_earned} points!
                                </p>
                                <p className="text-xs text-purple-600">
                                    Total: {loyaltyPoints.total_points_after} points
                                </p>
                            </div>
                            <div className="text-3xl">🏆</div>
                        </div>
                    </Card>
                )}

                {/* QR Code Section */}
                {qrCodeUrl && (
                    <Card className="p-4">
                        <div className="text-center">
                            <Button
                                variant="outline"
                                onClick={() => setShowQRCode(!showQRCode)}
                                className="w-full mb-3"
                            >
                                <QrCode className="w-4 h-4 mr-2" />
                                {showQRCode ? 'Hide' : 'Show'} Digital Receipt QR
                            </Button>
                            
                            {showQRCode && (
                                <div className="space-y-3">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                                        alt="Digital Receipt QR Code"
                                        className="mx-auto"
                                    />
                                    <p className="text-sm text-gray-600">
                                        Scan to save this receipt digitally
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => setShowFeedback(true)} variant="outline">
                        <Star className="w-4 h-4 mr-2" />
                        Rate
                    </Button>
                    <Button onClick={handleAddToWallet} variant="outline">
                        <Wallet className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                    <Button onClick={onDownload} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                    <Button onClick={onEmail} variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                    </Button>
                </div>

                {/* Footer */}
                <div className="text-center py-4 text-sm text-gray-500">
                    <p>Thank you for dining with us!</p>
                    <p>Please come again soon</p>
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-4">Rate Your Experience</h3>
                        
                        {renderStars()}
                        
                        <textarea
                            placeholder="Tell us more about your experience (optional)"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full p-3 border rounded-lg resize-none h-24 mb-4"
                        />
                        
                        <div className="flex space-x-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowFeedback(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleFeedbackSubmit}
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? <Spinner size="sm" /> : 'Submit'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Options Modal */}
            {showShareOptions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-4">Share Receipt</h3>
                        
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                onClick={() => handleShareReceipt('native')}
                                className="w-full justify-start"
                            >
                                <Share2 className="w-4 h-4 mr-3" />
                                Share via...
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => handleShareReceipt('whatsapp')}
                                className="w-full justify-start"
                            >
                                <MessageSquare className="w-4 h-4 mr-3" />
                                WhatsApp
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => handleShareReceipt('copy')}
                                className="w-full justify-start"
                            >
                                <Camera className="w-4 h-4 mr-3" />
                                Copy Link
                            </Button>
                        </div>
                        
                        <Button
                            variant="ghost"
                            onClick={() => setShowShareOptions(false)}
                            className="w-full mt-4"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileReceiptView;