/**
 * Payment Callback Handler
 * Handles the return from Hesabe payment gateway and completes the order
 * Supports both success and failure callbacks with user-friendly messages
 */

import { useEffect, useState } from 'react';
import { placeOrder } from '../services/firestoreService';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

// Error code to user-friendly message mapping
const getErrorMessage = (errorCode: string, fallbackMessage: string): { title: string; message: string; canRetry: boolean } => {
    const errorMessages: Record<string, { title: string; message: string; canRetry: boolean }> = {
        // Payment gateway errors
        'CANCELLED': {
            title: 'Payment Cancelled',
            message: 'You cancelled the payment. Your cart items are still saved.',
            canRetry: true
        },
        'DECLINED': {
            title: 'Card Declined',
            message: 'Your card was declined. Please try a different card or payment method.',
            canRetry: true
        },
        'INSUFFICIENT_FUNDS': {
            title: 'Insufficient Funds',
            message: 'Your card has insufficient funds. Please try a different card.',
            canRetry: true
        },
        'EXPIRED_CARD': {
            title: 'Card Expired',
            message: 'Your card has expired. Please use a valid card.',
            canRetry: true
        },
        'INVALID_CARD': {
            title: 'Invalid Card',
            message: 'The card details are invalid. Please check and try again.',
            canRetry: true
        },
        'TIMEOUT': {
            title: 'Payment Timeout',
            message: 'The payment session timed out. Please try again.',
            canRetry: true
        },
        'PAYMENT_FAILED': {
            title: 'Payment Failed',
            message: 'The payment could not be completed. Please try again.',
            canRetry: true
        },
        'DECRYPT_ERROR': {
            title: 'Processing Error',
            message: 'There was an error processing the payment response. Please contact reception.',
            canRetry: false
        },
        'SYSTEM_ERROR': {
            title: 'System Error',
            message: 'A system error occurred. Please contact reception for assistance.',
            canRetry: false
        },
        'FIREBASE_ERROR': {
            title: 'Order Error',
            message: 'Payment successful but order could not be saved. Please contact reception with your payment confirmation.',
            canRetry: false
        },
        'NO_PENDING_ORDER': {
            title: 'Session Expired',
            message: 'Your order session has expired. Please add items to your cart and try again.',
            canRetry: false
        }
    };

    return errorMessages[errorCode] || {
        title: 'Payment Error',
        message: fallbackMessage || 'An unexpected error occurred. Please try again or contact reception.',
        canRetry: true
    };
};

const PaymentCallback = () => {
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [errorInfo, setErrorInfo] = useState<{ title: string; message: string; canRetry: boolean } | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        const processPayment = async () => {
            try {
                // Parse URL parameters to check for failure callback
                const urlParams = new URLSearchParams(window.location.search);
                const success = urlParams.get('success');
                const error = urlParams.get('error');
                const errorCode = urlParams.get('errorCode');

                // Handle explicit failure from backend
                if (success === 'false') {
                    const errorDetails = getErrorMessage(errorCode || 'PAYMENT_FAILED', error || '');
                    setStatus('error');
                    setErrorInfo(errorDetails);
                    return;
                }

                // Get the pending order from localStorage
                const pendingOrderStr = localStorage.getItem('pending_order');
                
                if (!pendingOrderStr) {
                    const errorDetails = getErrorMessage('NO_PENDING_ORDER', '');
                    setStatus('error');
                    setErrorInfo(errorDetails);
                    return;
                }

                const pendingOrder = JSON.parse(pendingOrderStr);

                // Check if order is stale (more than 2 hours old)
                const orderAge = Date.now() - (pendingOrder.timestamp || 0);
                if (orderAge > 2 * 60 * 60 * 1000) { // 2 hours
                    localStorage.removeItem('pending_order');
                    const errorDetails = getErrorMessage('NO_PENDING_ORDER', '');
                    setStatus('error');
                    setErrorInfo(errorDetails);
                    return;
                }

                // Place the order in Firestore/Firebase
                await placeOrder({
                    roomNumber: pendingOrder.roomNumber,
                    phoneNumber: pendingOrder.phoneNumber,
                    guestName: pendingOrder.guestName,
                    totalAmount: pendingOrder.totalAmount,
                    paymentMethod: 'card',
                    items: pendingOrder.items,
                    menu: pendingOrder.menu,
                    ...(pendingOrder.chairNumber ? { chairNumber: pendingOrder.chairNumber } : {})
                });

                // Clear the pending order only on success
                localStorage.removeItem('pending_order');

                // Set success status
                setStatus('success');

            } catch (error) {
                console.error('Payment processing error:', error);
                const errorDetails = getErrorMessage('FIREBASE_ERROR', '');
                setStatus('error');
                setErrorInfo(errorDetails);
                // Keep the pending order in localStorage for retry
            }
        };

        // Small delay to ensure smooth UI transition
        setTimeout(processPayment, 500);
    }, []);

    const handleRetry = () => {
        setIsRetrying(true);
        // Navigate back to menu - cart will be restored from pending_order
        window.location.href = '/';
    };

    const handleContactReception = () => {
        // Could open a phone dialer or show reception contact info
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md w-full text-center">
                {status === 'processing' && (
                    <>
                        <Loader2 className="w-16 h-16 text-gold mx-auto mb-6 animate-spin" />
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                            Processing Payment
                        </h1>
                        <p className="text-stone-600 text-sm sm:text-base">
                            Please wait while we complete your order...
                        </p>
                        <div className="mt-6 flex justify-center gap-1">
                            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                            Payment Successful!
                        </h1>
                        <p className="text-stone-600 text-sm sm:text-base">
                            Your order has been placed and is being prepared.
                        </p>
                        <p className="text-stone-500 text-xs sm:text-sm mt-4">
                            Tap below to return to the menu
                        </p>
                        <button
                            onClick={() => {
                                window.location.href = '/';
                            }}
                            className="mt-6 px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-lg"
                        >
                            Return to Menu
                        </button>
                    </>
                )}

                {status === 'error' && errorInfo && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                            {errorInfo.canRetry ? (
                                <AlertCircle className="w-12 h-12 text-amber-600" />
                            ) : (
                                <XCircle className="w-12 h-12 text-red-600" />
                            )}
                        </div>
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                            {errorInfo.title}
                        </h1>
                        <p className="text-stone-600 text-sm sm:text-base">
                            {errorInfo.message}
                        </p>
                        
                        <div className="mt-6 flex flex-col gap-3">
                            {errorInfo.canRetry && (
                                <button
                                    onClick={handleRetry}
                                    disabled={isRetrying}
                                    className="w-full px-6 py-4 bg-gold text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isRetrying ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-5 h-5" />
                                    )}
                                    Try Again
                                </button>
                            )}
                            <button
                                onClick={handleContactReception}
                                className="w-full px-6 py-3 bg-stone-200 text-stone-800 rounded-xl font-semibold hover:bg-stone-300 transition-colors"
                            >
                                {errorInfo.canRetry ? 'Return to Menu' : 'Contact Reception'}
                            </button>
                        </div>

                        <p className="text-stone-400 text-xs mt-6">
                            Your cart items have been saved for your convenience.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;
