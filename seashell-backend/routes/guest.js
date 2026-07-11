/**
 * Guest Routes
 * Handles guest-facing endpoints that don't require authentication.
 * Currently serves: Order History lookup by roomNumber + phoneNumber.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { db, admin } = require('../services/firebase');

// Rate limiter for guest order history to prevent enumeration: 10 attempts per 5 minutes
const historyLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { error: 'Too many order history requests. Please wait before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Derive a human-readable payment status from raw order fields.
 */
function derivePaymentStatus(orderData) {
    if (orderData.paymentDetails || orderData.paidAt || orderData.webhookVerified || orderData.paymentMethod === 'room') {
        return 'success';
    }
    if (orderData.paymentFailure) {
        return 'failed';
    }
    if (orderData.status === 'awaiting_payment') {
        return 'pending';
    }
    if (orderData.status === 'cancelled') {
        return 'cancelled';
    }
    // Fallback for any other state without payment traces
    return 'unknown';
}

/**
 * Normalize a Firestore document into a plain JS object safe for JSON serialization.
 * Converts Timestamps to Unix millis and derives paymentStatus.
 */
function normalizeOrder(docSnap) {
    const data = docSnap.data();

    // Convert Firestore Timestamp to number (millis) if needed
    let createdAt = data.createdAt;
    if (createdAt && typeof createdAt.toMillis === 'function') {
        createdAt = createdAt.toMillis();
    } else if (createdAt && typeof createdAt === 'object' && createdAt.seconds) {
        createdAt = createdAt.seconds * 1000;
    }

    let paidAt = data.paidAt;
    if (paidAt && typeof paidAt.toMillis === 'function') {
        paidAt = paidAt.toMillis();
    } else if (paidAt && typeof paidAt === 'object' && paidAt.seconds) {
        paidAt = paidAt.seconds * 1000;
    }

    let updatedAt = data.updatedAt;
    if (updatedAt && typeof updatedAt.toMillis === 'function') {
        updatedAt = updatedAt.toMillis();
    } else if (updatedAt && typeof updatedAt === 'object' && updatedAt.seconds) {
        updatedAt = updatedAt.seconds * 1000;
    }

    return {
        id: docSnap.id,
        roomNumber: data.roomNumber || '',
        phoneNumber: data.phoneNumber || '',
        guestName: data.guestName || 'Guest',
        chairNumber: data.chairNumber || '',
        menu: data.menu || 'room-service',
        status: data.status || 'pending',
        totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
        paymentMethod: data.paymentMethod || 'card',
        createdAt,
        paidAt,
        updatedAt,
        items: Array.isArray(data.items) ? data.items : [],
        expectedPreparationTime: data.expectedPreparationTime || 0,
        paymentStatus: derivePaymentStatus(data),
        // Include raw payment details (masked/safe) so the guest can see transaction info
        paymentDetails: data.paymentDetails || null,
        paymentFailure: data.paymentFailure || null,
    };
}

/**
 * GET /guest/orders
 * Query Parameters:
 *   - roomNumber (required)
 *   - phoneNumber (required)
 *
 * Returns the guest's order history from both 'orders' and 'order_history'
 * collections, limited to the last 6 months, sorted newest first.
 */
router.get('/orders', historyLimiter, async (req, res) => {
    try {
        const { roomNumber, phoneNumber } = req.query;

        if (!roomNumber || typeof roomNumber !== 'string' || roomNumber.trim() === '') {
            return res.status(400).json({ error: 'roomNumber is required' });
        }
        if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
            return res.status(400).json({ error: 'phoneNumber is required' });
        }

        const trimmedRoom = roomNumber.trim();
        const trimmedPhone = phoneNumber.trim();

        // 6 months ago cutoff
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const cutoffTimestamp = admin.firestore.Timestamp.fromDate(sixMonthsAgo);

        // Query both collections in parallel using only the phone number to avoid composite index requirements
        const [activeOrdersSnap, historyOrdersSnap] = await Promise.all([
            db.collection('orders')
                .where('phoneNumber', '==', trimmedPhone)
                .get(),
            db.collection('order_history')
                .where('phoneNumber', '==', trimmedPhone)
                .get()
        ]);

        const filterOrder = (docSnap) => {
            const data = docSnap.data();
            // Removed roomNumber filter: Order history is now tied globally to the phone number,
            // so a guest sees all their past orders regardless of which sunbed or room they used.
            
            // Filter by cutoff date
            let createdAt = data.createdAt;
            if (!createdAt) return false;

            if (typeof createdAt.toMillis === 'function') {
                if (createdAt.toMillis() < sixMonthsAgo.getTime()) return false;
            } else if (typeof createdAt === 'object' && createdAt.seconds) {
                if (createdAt.seconds * 1000 < sixMonthsAgo.getTime()) return false;
            } else if (typeof createdAt === 'number') {
                if (createdAt < sixMonthsAgo.getTime()) return false;
            } else {
                return false; // Invalid or missing timestamp format
            }
            return true;
        };

        const activeOrders = activeOrdersSnap.docs.filter(filterOrder).map(normalizeOrder);
        const historyOrders = historyOrdersSnap.docs.filter(filterOrder).map(normalizeOrder);

        // Merge and sort by createdAt desc
        const allOrders = [...activeOrders, ...historyOrders];
        allOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Hard limit to 100 combined results
        const limitedOrders = allOrders.slice(0, 100);

        return res.json({
            success: true,
            count: limitedOrders.length,
            orders: limitedOrders
        });
    } catch (error) {
        console.error('Guest order history error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch order history'
        });
    }
});

module.exports = router;
