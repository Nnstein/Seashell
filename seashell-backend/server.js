/**
 * Seashell Backend Server
 * Express server for handling Hesabe payment gateway integration
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Mount payment routes
app.use('/payment', paymentRoutes);

// Test page for payment integration
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Seashell Payment - Hesabe Integration Test</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
                    width: 100%;
                    max-width: 500px;
                }
                
                .logo {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .logo h1 {
                    font-size: 2.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .logo p {
                    color: #666;
                    margin-top: 8px;
                }
                
                .badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-top: 10px;
                }
                
                .form-group {
                    margin-bottom: 24px;
                }
                
                label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }
                
                input {
                    width: 100%;
                    padding: 14px 18px;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }
                
                input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
                }
                
                .btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                }
                
                .btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    display: none;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .info-box {
                    background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
                    border: 1px solid #e0e6ff;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                }
                
                .info-box h3 {
                    color: #333;
                    font-size: 14px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .info-box ul {
                    list-style: none;
                    font-size: 13px;
                    color: #555;
                }
                
                .info-box li {
                    padding: 4px 0;
                }
                
                .info-box code {
                    background: #e8eeff;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: monospace;
                }
                
                .error-message {
                    background: #fff5f5;
                    border: 1px solid #fed7d7;
                    color: #c53030;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: none;
                }
                
                .success-message {
                    background: #f0fff4;
                    border: 1px solid #9ae6b4;
                    color: #276749;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: none;
                }
                
                .divider {
                    height: 1px;
                    background: linear-gradient(to right, transparent, #e0e0e0, transparent);
                    margin: 30px 0;
                }
                
                .api-info {
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
                
                .api-info a {
                    color: #667eea;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <h1>🐚 Seashell</h1>
                    <p>Payment Gateway Integration</p>
                    <span class="badge">SANDBOX MODE</span>
                </div>
                
                <div class="info-box">
                    <h3>🧪 Test Card Details (KNET)</h3>
                    <ul>
                        <li><strong>Expiry:</strong> <code>09/30</code> (success) or any other date (failure)</li>
                        <li><strong>PIN:</strong> <code>1234</code></li>
                    </ul>
                </div>
                
                <div id="errorMessage" class="error-message"></div>
                <div id="successMessage" class="success-message"></div>
                
                <form id="paymentForm">
                    <div class="form-group">
                        <label for="amount">Payment Amount (KWD)</label>
                        <input type="number" id="amount" name="amount" placeholder="e.g., 0.500" step="0.001" min="0.200" value="0.500" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="orderRef">Order Reference (Optional)</label>
                        <input type="text" id="orderRef" name="orderRef" placeholder="e.g., ORDER-12345">
                    </div>
                    
                    <button type="submit" class="btn" id="payButton">
                        <span class="spinner" id="spinner"></span>
                        <span id="btnText">💳 Pay with Hesabe</span>
                    </button>
                </form>
                
                <div class="divider"></div>
                
                <div class="api-info">
                    <p>API Endpoint: <a href="/payment/test">/payment/test</a></p>
                    <p>Server running on ${baseUrl}</p>
                </div>
            </div>
            
            <script>
                const form = document.getElementById('paymentForm');
                const spinner = document.getElementById('spinner');
                const btnText = document.getElementById('btnText');
                const payButton = document.getElementById('payButton');
                const errorMessage = document.getElementById('errorMessage');
                const successMessage = document.getElementById('successMessage');
                
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    // Reset messages
                    errorMessage.style.display = 'none';
                    successMessage.style.display = 'none';
                    
                    // Show loading
                    spinner.style.display = 'block';
                    btnText.textContent = 'Processing...';
                    payButton.disabled = true;
                    
                    try {
                        const amount = document.getElementById('amount').value;
                        const orderRef = document.getElementById('orderRef').value;
                        
                        const response = await fetch('/payment/checkout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                amount: amount,
                                orderReferenceNumber: orderRef || undefined
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success && data.redirectUrl) {
                            successMessage.textContent = 'Redirecting to Hesabe payment page...';
                            successMessage.style.display = 'block';
                            
                            // Redirect to payment page
                            setTimeout(() => {
                                window.location.href = data.redirectUrl;
                            }, 500);
                        } else {
                            throw new Error(data.error || 'Failed to create checkout');
                        }
                        
                    } catch (error) {
                        console.error('Payment error:', error);
                        errorMessage.textContent = error.message || 'An error occurred. Please try again.';
                        errorMessage.style.display = 'block';
                        
                        // Reset button
                        spinner.style.display = 'none';
                        btnText.textContent = '💳 Pay with Hesabe';
                        payButton.disabled = false;
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🐚 Seashell Backend Server');
    console.log('='.repeat(50));
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  /              - Test payment page`);
    console.log(`  GET  /health        - Health check`);
    console.log(`  GET  /payment/test  - Config verification`);
    console.log(`  POST /payment/checkout - Create checkout`);
    console.log(`  GET  /payment/success  - Payment success callback`);
    console.log(`  GET  /payment/failure  - Payment failure callback`);
    console.log(`  POST /payment/webhook  - Webhook endpoint`);
    console.log('='.repeat(50));
});
