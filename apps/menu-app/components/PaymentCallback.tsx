/**
 * Payment Callback Handler
 * Handles the return from Hesabe payment gateway and completes the order
 */

import { useEffect, useState } from 'react';
import { placeOrder } from '../services/firestoreService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const PaymentCallback = () => {
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Processing your payment...');

    useEffect(() => {
        const processPayment = async () => {
            try {
                // Get the pending order from localStorage
                const pendingOrderStr = localStorage.getItem('pending_order');
                
                if (!pendingOrderStr) {
                    setStatus('error');
                    setMessage('No pending order found. Please try again.');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                    return;
                }

                const pendingOrder = JSON.parse(pendingOrderStr);

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

                // Clear the pending order
                localStorage.removeItem('pending_order');

                // Set success status
                setStatus('success');
                setMessage('Payment successful! Your order has been placed.');

                // Redirect to home after 3 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);

            } catch (error) {
                console.error('Payment processing error:', error);
                setStatus('error');
                setMessage('Failed to complete your order. Please contact reception.');
                
                // Keep the pending order in localStorage for retry
                setTimeout(() => {
                    window.location.href = '/';
                }, 5000);
            }
        };

        // Small delay to ensure smooth UI transition
        setTimeout(processPayment, 500);
    }, []);

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
                            {message}
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
                            {message}
                        </p>
                        <p className="text-stone-500 text-xs sm:text-sm mt-4">
                            Redirecting you back...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                            Payment Error
                        </h1>
                        <p className="text-stone-600 text-sm sm:text-base">
                            {message}
                        </p>
                        <button
                            onClick={() => {
                                window.location.href = '/';
                            }}
                            className="mt-6 px-6 py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-gold transition-colors"
                        >
                            Return to Menu
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;
