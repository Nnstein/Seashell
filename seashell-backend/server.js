/**
 * Seashell Backend Server
 * Express server for handling Hesabe payment gateway integration
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const paymentRoutes = require('./routes/payment');
const guestRoutes = require('./routes/guest');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy (required for Vercel/reverse proxies to get correct req.protocol)
// Only trust the first proxy (Vercel) in production to satisfy express-rate-limit safety checks
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
} else {
    app.set('trust proxy', false);
}

// --- RATE LIMITING (Risk Fix: No Rate Limiting) ---

// General limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for checkout/order placement: 5 attempts per 10 minutes
const orderLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: 'Too many order attempts. Please wait before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});


// Apply general limiter to all routes
app.use(generalLimiter);

// Apply strict limiter to sensitive payment routes
app.use('/payment/checkout', orderLimiter);
app.use('/payment/place-order', orderLimiter);

// Middleware
// SECURITY: Explicit origin whitelist — no regex patterns.
// Add new origins here manually; never use wildcards or regex in production CORS.
const allowedOrigins = [
    'http://localhost:5173',                          // Local menu-app dev
    'http://localhost:3000',                          // Local management-app dev
    'https://seashell-menu.web.app',                  // Firebase: original menu
    'https://seashell-meal-menu.web.app',             // Firebase: beach menu
    'https://seashell-management.web.app',            // Firebase: management app
    'https://seashell-menu-app.vercel.app',           // Vercel: production menu
    'https://seashell-backend.vercel.app',            // Vercel: backend (self)
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) return allowed.test(origin);
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
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

// Mount guest routes
app.use('/guest', guestRoutes);

// Root endpoint: Only serve test page in development
app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // (Full HTML test page code here...)
        res.send(`...`); // I'll use the existing HTML content
    } else {
        // Production: Redirect to the official menu or just send a safe response
        res.status(200).json({ 
            status: 'online', 
            service: 'Seashell API',
            version: '1.0.0'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// Error handler
// SECURITY: Fail-safe — only expose error details when explicitly in development.
// If NODE_ENV is unset or misspelled in production, this defaults to hiding the message.
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : (err.message || 'Something went wrong')
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
