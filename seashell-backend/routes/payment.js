/**
 * Payment Routes for Hesabe Integration
 */

const express = require('express');
const router = express.Router();
const hesabeService = require('../services/hesabe');

/**
 * POST /payment/checkout
 * Initiate a payment checkout
 * 
 * Body:
 *   - amount: The payment amount (required)
 *   - orderReferenceNumber: Your order reference (optional)
 *   - variable1-5: Optional variables to track with payment
 */
router.post('/checkout', async (req, res) => {
    try {
        const { 
            amount, 
            orderReferenceNumber,
            variable1,
            variable2,
            variable3,
            variable4,
            variable5,
            paymentType
        } = req.body;
        
        // Validate amount
        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing amount'
            });
        }
        
        // Validate minimum amount (0.200 KWD as per Hesabe docs)
        if (parseFloat(amount) < 0.200) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be at least 0.200 KWD'
            });
        }
        
        // Build URLs - use host from request or env
        const protocol = req.protocol || 'http';
        const host = req.get('host') || 'localhost:3001';
        const baseUrl = `${protocol}://${host}`;
        
        // Create checkout
        const result = await hesabeService.createCheckout({
            amount: amount,
            responseUrl: `${baseUrl}/payment/success`,
            failureUrl: `${baseUrl}/payment/failure`,
            orderReferenceNumber: orderReferenceNumber || `ORDER-${Date.now()}`,
            variable1: variable1 || '',
            variable2: variable2 || '',
            variable3: variable3 || '',
            variable4: variable4 || '',
            variable5: variable5 || '',
            paymentType: paymentType || 0
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create checkout'
        });
    }
});

/**
 * GET /payment/success
 * Payment success callback
 */
router.get('/success', (req, res) => {
    try {
        const encryptedData = req.query.data;
        
        if (!encryptedData) {
            // Redirect to menu app with error
            return res.redirect(process.env.MENU_APP_URL || 'http://localhost:5173');
        }
        
        // Decrypt and parse response
        const result = hesabeService.handlePaymentCallback(encryptedData);
        
        // Log the payment result
        console.log('Payment result:', result.success ? 'SUCCESS' : 'FAILED');
        console.log('Payment data:', result.data);
        
        // Redirect to menu app payment callback page
        // The menu app will handle completing the order
        const menuAppUrl = process.env.MENU_APP_URL || 'http://localhost:5173';
        res.redirect(`${menuAppUrl}/payment-callback?success=${result.success}&data=${encodeURIComponent(JSON.stringify(result.data))}`);
        
    } catch (error) {
        console.error('Success callback error:', error);
        const menuAppUrl = process.env.MENU_APP_URL || 'http://localhost:5173';
        res.redirect(`${menuAppUrl}/payment-callback?success=false&error=${encodeURIComponent(error.message)}`);
    }
});

/**
 * GET /payment/failure
 * Payment failure callback
 */
router.get('/failure', (req, res) => {
    try {
        const encryptedData = req.query.data;
        let errorMessage = 'The payment was cancelled or failed.';
        let errorCode = 'PAYMENT_FAILED';
        let errorDetails = null;
        
        if (encryptedData) {
            try {
                const result = hesabeService.handlePaymentCallback(encryptedData);
                errorMessage = result.message || errorMessage;
                errorDetails = result.data;
                
                // Extract specific error codes if available
                if (result.data && result.data.resultCode) {
                    errorCode = result.data.resultCode;
                }
            } catch (e) {
                console.error('Could not decrypt failure data:', e);
                errorCode = 'DECRYPT_ERROR';
            }
        }
        
        // Log the failure for debugging
        console.log('Payment failure:', { errorCode, errorMessage, errorDetails });
        
        // Redirect to menu app with error info
        const menuAppUrl = process.env.MENU_APP_URL || 'http://localhost:5173';
        const params = new URLSearchParams({
            success: 'false',
            error: errorMessage,
            errorCode: errorCode
        });
        
        res.redirect(`${menuAppUrl}/payment-callback?${params.toString()}`);
        
    } catch (error) {
        console.error('Failure callback error:', error);
        const menuAppUrl = process.env.MENU_APP_URL || 'http://localhost:5173';
        res.redirect(`${menuAppUrl}/payment-callback?success=false&error=Payment+processing+error&errorCode=SYSTEM_ERROR`);
    }
});

/**
 * POST /payment/webhook
 * Webhook endpoint for async payment notifications from Hesabe
 */
router.post('/webhook', (req, res) => {
    try {
        console.log('Webhook received:', req.body);
        
        const webhookData = hesabeService.handleWebhook(req.body);
        
        console.log('Webhook data processed:', webhookData);
        
        // TODO: Update order status in database based on webhook data
        // This is where you would update Firebase or your database
        
        // Always respond with 200 OK to acknowledge receipt
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('Webhook error:', error);
        // Still respond with 200 to prevent retries
        res.status(200).json({ received: true, error: error.message });
    }
});

/**
 * GET /payment/test
 * Test endpoint to verify configuration
 */
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Payment routes are working',
        config: {
            merchantCode: process.env.HESABE_MERCHANT_ID ? '***' + process.env.HESABE_MERCHANT_ID.slice(-3) : 'NOT SET',
            accessCode: process.env.HESABE_ACCESS_CODE ? '***configured***' : 'NOT SET',
            baseUrl: process.env.HESABE_BASE_URL || 'NOT SET',
            checkoutUrl: process.env.HESABE_PAYMENT_INITIATED_CHECKOUT_URL || 'NOT SET',
            paymentUrl: process.env.HESABE_PAYMENT_PAGE_REDIRECTION_URL || 'NOT SET'
        }
    });
});

module.exports = router;
