import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Badge } from '@/Components/ui';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send, CheckCircle } from 'lucide-react';

const ReceiptFeedback = ({ orderId, token, onFeedbackSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const feedbackCategories = [
        { id: 'food_quality', label: 'Food Quality', icon: '🍽️' },
        { id: 'service', label: 'Service', icon: '👤' },
        { id: 'ambiance', label: 'Ambiance', icon: '🏠' },
        { id: 'cleanliness', label: 'Cleanliness', icon: '✨' },
        { id: 'value', label: 'Value for Money', icon: '💰' },
        { id: 'speed', label: 'Service Speed', icon: '⚡' }
    ];

    const quickFeedbackOptions = [
        { id: 'excellent', label: 'Excellent', emoji: '😊' },
        { id: 'good', label: 'Good', emoji: '🙂' },
        { id: 'average', label: 'Average', emoji: '😐' },
        { id: 'poor', label: 'Poor', emoji: '😕' },
        { id: 'terrible', label: 'Terrible', emoji: '😞' }
    ];

    useEffect(() => {
        // Initialize categories with neutral ratings
        const initialCategories = {};
        feedbackCategories.forEach(cat => {
            initialCategories[cat.id] = 3;
        });
        setCategories(initialCategories);
    }, []);

    const handleStarClick = (value) => {
        setRating(value);
    };

    const handleCategoryRating = (categoryId, value) => {
        setCategories(prev => ({
            ...prev,
            [categoryId]: value
        }));
    };

    const handleQuickFeedback = (optionId) => {
        const ratingMap = {
            'excellent': 5,
            'good': 4,
            'average': 3,
            'poor': 2,
            'terrible': 1
        };
        setRating(ratingMap[optionId]);
        
        // Auto-fill feedback based on selection
        const feedbackTexts = {
            'excellent': 'Amazing experience! Everything was perfect.',
            'good': 'Really enjoyed my meal. Great service!',
            'average': 'It was okay, nothing special.',
            'poor': 'Some things could be improved.',
            'terrible': 'Very disappointed with the experience.'
        };
        setFeedback(feedbackTexts[optionId]);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please provide a rating');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const feedbackData = {
                order_id: orderId,
                rating,
                feedback,
                category_ratings: categories,
                receipt_token: token,
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };

            const response = await fetch(`/api/receipt/feedback/${orderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            const result = await response.json();
            
            if (result.success) {
                setSubmitted(true);
                if (onFeedbackSubmitted) {
                    onFeedbackSubmitted(result);
                }
            } else {
                throw new Error(result.message || 'Failed to submit feedback');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (interactive = true) => {
        return (
            <div className="flex justify-center space-x-2 my-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => interactive && handleStarClick(star)}
                        onMouseEnter={() => interactive && setHoveredRating(star)}
                        onMouseLeave={() => interactive && setHoveredRating(0)}
                        disabled={!interactive}
                        className={`${interactive ? 'cursor-pointer' : 'cursor-default'} focus:outline-none transition-transform hover:scale-110`}
                    >
                        <Star
                            className={`w-8 h-8 ${
                                star <= (interactive ? rating : hoveredRating || rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                            }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    const renderCategoryStars = (categoryId, currentRating) => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => handleCategoryRating(categoryId, star)}
                        className="focus:outline-none"
                    >
                        <Star
                            className={`w-5 h-5 ${
                                star <= currentRating
                                    ? 'fill-blue-400 text-blue-400'
                                    : 'text-gray-300'
                            }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    if (submitted) {
        return (
            <div className="max-w-md mx-auto p-6">
                <Card className="p-8 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                    <p className="text-gray-600 mb-6">
                        Your feedback has been submitted successfully. We appreciate your input and will use it to improve our service.
                    </p>
                    
                    {rating >= 4 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Love our service?</strong> Consider sharing your experience on social media!
                            </p>
                        </div>
                    )}
                    
                    <div className="flex justify-center space-x-3">
                        <Button variant="outline" onClick={() => window.print()}>
                            Print Receipt
                        </Button>
                        <Button onClick={() => window.close()}>
                            Close
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold text-center mb-6">
                    How was your experience?
                </h2>

                {/* Quick Feedback Options */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                    {quickFeedbackOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleQuickFeedback(option.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                                rating === (option.id === 'excellent' ? 5 : 
                                          option.id === 'good' ? 4 :
                                          option.id === 'average' ? 3 :
                                          option.id === 'poor' ? 2 : 1)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="text-2xl mb-1">{option.emoji}</div>
                            <div className="text-xs">{option.label}</div>
                        </button>
                    ))}
                </div>

                {/* Star Rating */}
                <div className="text-center mb-6">
                    <p className="text-gray-600 mb-2">Rate your overall experience</p>
                    {renderStars()}
                    <p className="text-sm text-gray-500 mt-2">
                        {rating === 5 && 'Excellent! We\'re thrilled you loved it!'}
                        {rating === 4 && 'Great! We\'re happy you enjoyed it.'}
                        {rating === 3 && 'Good! We\'ll work to make it even better.'}
                        {rating === 2 && 'Thanks! We\'ll improve based on your feedback.'}
                        {rating === 1 && 'We\'re sorry. We\'ll do better next time.'}
                    </p>
                </div>

                {/* Category Ratings */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-4">Rate specific aspects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {feedbackCategories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{category.icon}</span>
                                    <span className="font-medium">{category.label}</span>
                                </div>
                                {renderCategoryStars(category.id, categories[category.id])}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detailed Feedback */}
                <div className="mb-6">
                    <label className="block font-semibold mb-2">
                        Tell us more (optional)
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Share specific details about your experience..."
                        className="w-full p-3 border rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                        {feedback.length}/500 characters
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Submit Button */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || rating === 0}
                        className="px-8 py-3"
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Feedback
                            </>
                        )}
                    </Button>
                </div>

                {/* Additional Options */}
                <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-sm text-gray-600 mb-4">
                        Want to stay connected with us?
                    </p>
                    <div className="flex justify-center space-x-3">
                        <Button variant="outline" size="sm">
                            Join Newsletter
                        </Button>
                        <Button variant="outline" size="sm">
                            Follow on Social
                        </Button>
                        <Button variant="outline" size="sm">
                            Join Loyalty Program
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ReceiptFeedback;