/**
 * Hesabe Payment Gateway Service
 * Handles encryption, API calls, and payment processing for Hesabe
 */

const axios = require('axios');
const { getEncryptedData, getDecryptedData, maskPII } = require('../lib/hesabeEncryption');

class HesabeService {
    constructor() {
        // Load configuration from environment variables
        this.merchantCode = process.env.HESABE_MERCHANT_ID;
        this.accessCode = process.env.HESABE_ACCESS_CODE;
        this.secretKey = process.env.HESABE_SECRET_KEY;
        this.ivKey = process.env.HESABE_IV_KEY;
        this.baseUrl = process.env.HESABE_BASE_URL?.trim() || 'https://sandbox.hesabe.com';
        this.checkoutUrl = process.env.HESABE_PAYMENT_INITIATED_CHECKOUT_URL?.trim() || `${this.baseUrl}/checkout`;
        this.paymentUrl = process.env.HESABE_PAYMENT_PAGE_REDIRECTION_URL?.trim() || `${this.baseUrl}/payment`;
        
        console.log('HesabeService initialized with:');
        console.log('  - Merchant Code:', this.merchantCode);
        console.log('  - Base URL:', this.baseUrl);
        console.log('  - Checkout URL:', this.checkoutUrl);
        console.log('  - Payment URL:', this.paymentUrl);
    }
    
    /**
     * Encrypt data for Hesabe API
     * Uses the getEncryptedData helper function as per Hesabe documentation
     * @param {object} data - The data object to encrypt
     * @returns {string} - The encrypted hex string
     */
    encrypt(data) {
        return getEncryptedData(data);
    }
    
    /**
     * Decrypt data from Hesabe API
     * Uses the getDecryptedData helper function as per Hesabe documentation
     * @param {string} encryptedHex - The encrypted hex string
     * @returns {object} - The decrypted data object
     */
    decrypt(encryptedHex) {
        return getDecryptedData(encryptedHex);
    }
    
    /**
     * Create a payment checkout request
     * @param {object} paymentData - The payment details
     * @returns {object} - The checkout response with payment URL
     */
    async createCheckout(paymentData) {
        // Validate required fields
        const requiredFields = ['amount', 'responseUrl', 'failureUrl'];
        for (const field of requiredFields) {
            if (!paymentData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Build payment request data
        const requestData = {
            merchantCode: this.merchantCode,
            amount: parseFloat(paymentData.amount).toFixed(3),
            paymentType: paymentData.paymentType || 0, // 0 = all payment methods
            responseUrl: paymentData.responseUrl,
            failureUrl: paymentData.failureUrl,
            version: '2.0',
            orderReferenceNumber: paymentData.orderReferenceNumber || '',
            variable1: paymentData.variable1 || '',
            variable2: paymentData.variable2 || '',
            variable3: paymentData.variable3 || '',
            variable4: paymentData.variable4 || '',
            variable5: paymentData.variable5 || '',
        };
        
        // Add optional webhook URL if provided
        if (paymentData.webhookUrl) {
            requestData.webhookUrl = paymentData.webhookUrl;
        }
        
        console.log('Creating checkout with data:', maskPII(requestData));
        
        // Encrypt the request data using getEncryptedData as per documentation
        const encryptedData = getEncryptedData(requestData);
        
        console.log('Encrypted data (first 100 chars):', encryptedData.substring(0, 100) + '...');
        
        try {
            // Make API request to checkout endpoint
            const response = await axios.post(
                this.checkoutUrl,
                { data: encryptedData },
                {
                    headers: {
                        'accessCode': this.accessCode,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Raw response status:', response.status);
            console.log('Raw response data type:', typeof response.data);
            
            let responseData;
            
            // Handle response - can be encrypted string or JSON
            if (typeof response.data === 'string') {
                // Decrypt the response using getDecryptedData as per documentation
                responseData = getDecryptedData(response.data);
            } else if (response.data && response.data.response && response.data.response.data) {
                responseData = response.data;
            } else {
                console.log('Response data:', response.data);
                responseData = response.data;
            }
            
            console.log('Checkout response:', JSON.stringify(maskPII(responseData), null, 2));
            
            // Build the payment redirect URL
            if (responseData.status === true && responseData.response && responseData.response.data) {
                const paymentToken = responseData.response.data;
                const redirectUrl = `${this.paymentUrl}?data=${paymentToken}`;
                
                return {
                    success: true,
                    redirectUrl: redirectUrl,
                    token: paymentToken,
                    response: responseData
                };
            }
            
            return {
                success: false,
                error: responseData.message || 'Checkout failed',
                response: responseData
            };
            
        } catch (error) {
            console.error('Checkout error:', error.message);
            
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', error.response.data);
                
                // Try to decrypt error response if it's a string
                if (typeof error.response.data === 'string' && error.response.data.length > 0) {
                    try {
                        const decryptedError = getDecryptedData(error.response.data);
                        console.error('Decrypted error:', decryptedError);
                        return {
                            success: false,
                            error: decryptedError.message || 'Checkout failed',
                            response: decryptedError
                        };
                    } catch (decryptError) {
                        console.error('Could not decrypt error response');
                    }
                }
            }
            
            throw error;
        }
    }
    
    /**
     * Handle payment callback/response
     * @param {string} encryptedData - The encrypted response from Hesabe
     * @returns {object} - The decrypted payment result
     */
    handlePaymentCallback(encryptedData) {
        try {
            // Decrypt using getDecryptedData as per documentation
            const decryptedData = getDecryptedData(encryptedData);
            
            console.log('Payment callback data:', JSON.stringify(maskPII(decryptedData), null, 2));
            
            // Extract the payment data - Hesabe returns data in response object directly (not response.data)
            // Structure: { status: true, code: 1, message: "...", response: { data: { resultCode, amount, ... } } }
            const responseData = (decryptedData.response && decryptedData.response.data) || decryptedData.response || decryptedData.data || decryptedData;
            
            // Check if payment was successful - multiple conditions to handle different response formats
            const isSuccess = (
                // Check for explicit CAPTURED status in response
                (responseData.resultCode === 'CAPTURED') ||
                // Check for status true with code 1 (success code)
                (decryptedData.status === true && decryptedData.code === 1) ||
                // Check for "Transaction Success" message
                (decryptedData.message && decryptedData.message.toLowerCase().includes('success'))
            );
            
            console.log('Success detection:', maskPII({
                resultCode: responseData.resultCode,
                amount: responseData.amount,
                paymentId: responseData.paymentId,
                status: decryptedData.status,
                code: decryptedData.code,
                message: decryptedData.message,
                isSuccess: isSuccess
            }));
            
            return {
                success: isSuccess,
                data: responseData,
                message: decryptedData.message || '',
                rawResponse: decryptedData
            };
            
        } catch (error) {
            console.error('Error handling payment callback:', error);
            throw error;
        }
    }
    
    /**
     * Verify payment status (for webhook handling)
     * @param {object} webhookData - The webhook payload
     * @returns {object} - The parsed webhook data
     */
    handleWebhook(webhookData) {
        try {
            // If webhook data is encrypted
            if (webhookData.data && typeof webhookData.data === 'string') {
                return getDecryptedData(webhookData.data);
            }
            return webhookData;
        } catch (error) {
            console.error('Error handling webhook:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new HesabeService();
