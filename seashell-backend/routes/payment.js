/**
 * Payment Routes for Hesabe Integration
 * Updated with Secure Handshake (Server-side order creation)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const hesabeService = require('../services/hesabe');
const { maskPII } = require('../lib/hesabeEncryption');
const { db, COLLECTIONS, admin } = require('../services/firebase');

// Sanitize MENU_APP_URL to prevent double slashes in callbacks
const MENU_APP_URL = (process.env.MENU_APP_URL || 'http://localhost:5173').replace(/\/+$/, '');

/**
 * AES-256-GCM field-level encryption for sensitive payment tokens.
 * PAYMENT_ENCRYPTION_KEY must be a 64-char hex string (32 bytes) set in .env.local
 */
function encryptField(plaintext) {
    if (!plaintext) return null;
    const keyHex = process.env.PAYMENT_ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
        // Log a critical warning but don't hard-crash — store a masked value instead
        console.error('CRITICAL: PAYMENT_ENCRYPTION_KEY is missing or invalid. Sensitive token NOT stored.');
        return '[ENCRYPTION_KEY_MISSING]';
    }
    const key = Buffer.from(keyHex, 'hex');
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        data: encrypted.toString('hex')
    };
}

/**
 * Helper: Calculate Order Total Server-Side
 * Fetches current menu prices from Firestore to prevent client-side manipulation.
 */
async function calculateTotal(items, menuOutlet) {
    if (!items || !Array.isArray(items) || items.length === 0) return { amount: 0, secureItems: [] };
    
    let total = 0;
    
    // Fetch all unique menu item IDs to minimize DB reads
    const itemIds = [...new Set(items.map(item => item.itemId))];
    
    // Fetch prices from Firestore (batch fetch)
    const menuRefs = itemIds.map(id => db.collection('menu_items').doc(id));
    const menuSnaps = await db.getAll(...menuRefs);
    
    const secureItems = [];

    // Calculate total and rebuild items securely
    for (const item of items) {
        const dbItemSnap = menuSnaps.find(s => s.id === item.itemId);
        if (!dbItemSnap || !dbItemSnap.exists) {
            // SECURITY: Hard fail if any item is missing — never silently drop items and charge wrong totals
            throw Object.assign(
                new Error(`ITEM_NOT_FOUND: Menu item "${item.name || item.itemId}" is no longer available.`),
                { statusCode: 400, code: 'ITEM_UNAVAILABLE', itemId: item.itemId }
            );
        }
        
        const dbData = dbItemSnap.data();

        // TIME CONSTRAINTS VALIDATION
        if (menuOutlet === 'room-service' || dbData.menu === 'room-service') {
            const category = (dbData.category || "").toLowerCase();
            const now = new Date();
            // Server runs in UTC? Wait, Kuwait time is UTC+3. Let's convert to Kuwait time or use local time.
            // Better to use Kuwait time: UTC+3.
            const kuwaitTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
            const hours = kuwaitTime.getUTCHours();
            const minutes = kuwaitTime.getUTCMinutes();
            const currentMinutes = hours * 60 + minutes;

            if (category === 'breakfast') {
                const startTime = 6 * 60 + 30; // 6:30 AM
                const endTime = 11 * 60;       // 11:00 AM
                if (currentMinutes < startTime || currentMinutes >= endTime) {
                    throw Object.assign(
                        new Error(`TIME_CONSTRAINT: Breakfast items are only available from 6:30 AM to 11:00 AM.`),
                        { statusCode: 400, code: 'ITEM_UNAVAILABLE', itemId: item.itemId }
                    );
                }
            }

            if (category === 'pizza') {
                const startTime = 12 * 60;
                const endTime = 22 * 60; // 10:00 PM
                if (currentMinutes < startTime || currentMinutes > endTime) {
                    throw Object.assign(
                        new Error(`TIME_CONSTRAINT: Pizza is only available from 12:00 PM to 10:00 PM.`),
                        { statusCode: 400, code: 'ITEM_UNAVAILABLE', itemId: item.itemId }
                    );
                }
            }
        }
        
        let baseUnitPrice = dbData.price;
        
        // 1. Size pricing overrides base price
        if (item.selectedSize && dbData.sizes && Array.isArray(dbData.sizes)) {
            const sizeObj = dbData.sizes.find(s => s.name === item.selectedSize);
            if (sizeObj) {
                baseUnitPrice = sizeObj.price;
            }
        } 
        // 2. Or apply item-level discount (only if no size is selected, and discount is valid > 0)
        else if (dbData.discountPrice !== undefined && dbData.discountPrice > 0 && dbData.discountPrice < dbData.price) {
            baseUnitPrice = dbData.discountPrice;
        }

        // 3. Calculate Addons Price
        let addonsPrice = 0;
        let secureSelectedAddons = item.selectedAddons || [];
        const itemCategory = (dbData.category || "").toLowerCase();
        const itemNameEn = (dbData.name?.en || dbData.name || "").toLowerCase();

        if (item.selectedAddons && Array.isArray(item.selectedAddons) && dbData.addons && Array.isArray(dbData.addons)) {
            // BUSINESS RULE: Syrup as an addon is FREE for Cocktails, Mocktails, and Smoothies (flavor definition)
            // It is CHARGEABLE for Soft Drinks and other Beverages.
            const isFreeSyrupCategory = itemCategory.includes('cocktail') || 
                                       itemCategory.includes('mocktail') || 
                                       itemCategory.includes('smoothie');

            item.selectedAddons.forEach(addonName => {
                const addonObj = dbData.addons.find(a => a.name === addonName);
                if (addonObj) {
                    let addonPrice = addonObj.price || 0;
                    
                    // Apply conditional free syrup rule
                    if (isFreeSyrupCategory && addonName.toLowerCase().includes('syrup')) {
                        addonPrice = 0;
                    }
                    
                    addonsPrice += addonPrice;
                } else {
                    console.warn(`Addon ${addonName} not found for item ${item.itemId}`);
                }
            });
        }

        // 4. Calculate Final Total considering Bundles
        let itemEffectiveTotal = 0;
        const totalUnitPrice = baseUnitPrice + addonsPrice; // Price for 1 item including addons
        let appliedBundleInfo = undefined;

        if (dbData.bundlePricing && Array.isArray(dbData.bundlePricing) && dbData.bundlePricing.length > 0) {
            const sortedBundles = [...dbData.bundlePricing].sort((a, b) => b.quantity - a.quantity);
            const appliedBundle = sortedBundles.find(b => item.quantity >= b.quantity);
            
            if (appliedBundle) {
                appliedBundleInfo = appliedBundle;
                const bundleCount = Math.floor(item.quantity / appliedBundle.quantity);
                const remainingQty = item.quantity % appliedBundle.quantity;
                
                // Bundled items: (Bundle base price) + (Addons for those bundled items)
                const bundledCost = (bundleCount * appliedBundle.price) + (bundleCount * appliedBundle.quantity * addonsPrice);
                // Remaining items: Normal total unit price
                const remainingCost = remainingQty * totalUnitPrice;
                
                itemEffectiveTotal = bundledCost + remainingCost;
            } else {
                itemEffectiveTotal = totalUnitPrice * item.quantity;
            }
        } else {
            itemEffectiveTotal = totalUnitPrice * item.quantity;
        }

        // SECURITY & DEBUG: Log items that result in 0 price to catch misconfigurations
        if (itemEffectiveTotal <= 0 && item.quantity > 0 && !itemNameEn.includes('free')) {
            console.error(`🛑 CRITICAL PRICE ERROR: Item "${dbData.name?.en || dbData.name}" (${item.itemId}) calculated as 0.000 KD.`);
            console.error(`   Details: Cat=${dbData.category}, Qty=${item.quantity}, Base=${baseUnitPrice} (DB Price=${dbData.price}, Discount=${dbData.discountPrice})`);
            console.error(`   Addons Total=${addonsPrice}, Size Selected=${item.selectedSize || 'None'}`);
        }

        total += itemEffectiveTotal;
        
        secureItems.push({
            ...item,
            name: dbData.name || item.name || 'Unknown Item',
            price: dbData.price, // the original catalog price
            unitPrice: totalUnitPrice, // the effective unit price including addons
            effectiveTotal: itemEffectiveTotal,
            ...(appliedBundleInfo ? { appliedBundle: appliedBundleInfo } : {})
        });
    }
    
    return { 
        amount: parseFloat(total.toFixed(3)),
        secureItems 
    };
}

/**
 * POST /payment/checkout
 * Initiate a payment checkout and create order record
 * SECURE: Calculates amount server-side based on items
 */
router.post('/checkout', async (req, res) => {
    try {
        console.log('=== SECURE CHECKOUT REQUEST ===');
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        const { 
            orderReferenceNumber,
            variable1, // roomNumber
            variable2, // phoneNumber
            variable3, // guestName
            variable4, // chairNumber
            variable5, // activeMenu
            items,     // Full cart items list
            paymentType
        } = req.body;

        const menuOutlet = variable5 || 'room-service';

        // --- 0. SECURE MENU STATUS CHECK (RACE CONDITION GUARD) ---
        // Prevent payments if the staff closed the menu exactly when the guest clicked pay
        try {
            const settingsDoc = await db.collection(COLLECTIONS.SETTINGS).doc('global_settings').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                const menuStatus = settings.menuStatus || {};
                const outletStatus = menuStatus[menuOutlet] || { isOpen: true };
                
                if (!outletStatus.isOpen) {
                    return res.status(400).json({
                        success: false,
                        error: 'MENU_CLOSED',
                        message: outletStatus.closeMessage || 'This menu is currently closed and cannot accept new orders.'
                    });
                }
            }
        } catch (settingsError) {
            console.error('Failed to verify menu status during checkout:', settingsError);
            // Allow to proceed if DB fails just for settings check, or we could block it. 
            // It's safer to just log it and proceed rather than bringing the whole system down if settings document is missing.
        }
        
        // --- 1. SECURE PRICE CALCULATION ---
        // We ignore the amount and prices sent by the client to prevent manipulation
        let amount, secureItems;
        try {
            ({ amount, secureItems } = await calculateTotal(items, menuOutlet));
        } catch (calcError) {
            // Item deleted between cart-add and checkout — return a clear, actionable 400
            if (calcError.code === 'ITEM_UNAVAILABLE') {
                if (calcError.message.includes('TIME_CONSTRAINT')) {
                    return res.status(400).json({
                        success: false,
                        error: 'TIME_CONSTRAINT',
                        message: calcError.message.replace('TIME_CONSTRAINT: ', '').trim(),
                        itemId: calcError.itemId
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        error: 'ITEM_UNAVAILABLE',
                        message: calcError.message.replace('ITEM_NOT_FOUND: ', ''),
                        itemId: calcError.itemId
                    });
                }
            }
            throw calcError; // Re-throw unexpected errors to the outer catch
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid order total' });
        }
        
        const orderRef = orderReferenceNumber || `ORDER-${Date.now()}`;
        
        // --- 2. Create Server-Side Order Record (Ghost Order Protection) ---
        try {
            await db.collection(COLLECTIONS.ORDERS).doc(orderRef).set({
                id: orderRef,
                roomNumber: variable1 || '',
                phoneNumber: variable2 || '',
                guestName: variable3 || 'Guest',
                chairNumber: variable4 || '',
                menu: variable5 || 'room-service',
                items: secureItems, // Use server-validated items array
                totalAmount: amount, // Use server-calculated amount
                status: 'awaiting_payment',
                paymentMethod: 'card',
                clientIp: clientIp,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
                isSecure: true
            });
            console.log(`Initial order record created: ${orderRef} (Total: ${amount})`);
        } catch (dbError) {
            console.error('Failed to create initial order record:', dbError);
            return res.status(500).json({ success: false, error: 'Failed to initialize order in database. Please try again.' });
        }

        // Build callback URLs — for indirect integration, Hesabe redirects the USER'S BROWSER,
        // so these must be frontend (menu app) URLs, not backend URLs.
        // The frontend PaymentCallback component will then call /payment/verify to finalize the order.
        const webhookUrl = `${req.protocol}://${req.get('host')}/payment/webhook`;
        
        // Create checkout with Hesabe
        const result = await hesabeService.createCheckout({
            amount: amount.toFixed(3), // Use server-calculated amount
            responseUrl: `${MENU_APP_URL}/payment-callback`,
            failureUrl: `${MENU_APP_URL}/payment-callback`,
            webhookUrl: webhookUrl,
            orderReferenceNumber: orderRef,
            variable1: variable1 || '',
            variable2: variable2 || '',
            variable3: variable3 || '',
            variable4: variable4 || '',
            variable5: variable5 || '',
            paymentType: 0 // ALWAYS use indirect payment (0)
        });
        
        if (!result.success) {
            console.error('Checkout failed:', JSON.stringify(result));
            return res.status(400).json(result);
        }
        
        res.json({ ...result, verifiedAmount: amount });
        
    } catch (error) {
        console.error('Checkout error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /payment/verify
 * Indirect integration: Frontend receives encrypted ?data= from Hesabe redirect
 * and sends it here for server-side decryption, verification, and Firestore update.
 */
router.post('/verify', async (req, res) => {
    try {
        const { data: encryptedData } = req.body;

        if (!encryptedData) {
            return res.status(400).json({ success: false, error: 'Missing encrypted payment data' });
        }

        const result = hesabeService.handlePaymentCallback(encryptedData);
        const data = result.data;
        const orderRef = data.orderReferenceNumber;

        console.log(`=== VERIFY CALLBACK: ${orderRef} (success=${result.success}) ===`);

        if (!orderRef) {
            return res.status(400).json({ success: false, error: 'No order reference in payment response' });
        }

        if (result.success) {
            try {
                const docRef = db.collection(COLLECTIONS.ORDERS).doc(orderRef);
                const docSnap = await docRef.get();

                if (docSnap.exists) {
                    const currentStatus = docSnap.data().status;
                    if (currentStatus !== 'awaiting_payment') {
                        console.warn(`Verify: Order ${orderRef} already in status '${currentStatus}'. Skipping.`);
                    } else {
                        await docRef.update({
                            status: 'pending',
                            updatedAt: admin.firestore.Timestamp.now(),
                            paidAt: admin.firestore.Timestamp.now(),
                            paymentDetails: {
                                paymentId: data.paymentId,
                                paidOn: data.paidOn,
                                gatewayResult: data.resultCode,
                                via: 'indirect_verify',
                                transactionId: encryptField(data.transactionId),
                                authCode: encryptField(data.auth),
                                bankReferenceId: encryptField(data.bankReferenceId),
                                paymentToken: encryptField(data.paymentToken),
                            },
                            customerInfo: data.customer || null
                        });
                        console.log(`Order ${orderRef} verified and set to PENDING.`);

                        // --- Dynamic Prep Time & Auto-Close Logic (same as success callback) ---
                        try {
                            const menuOutlet = docSnap.data().menu;
                            if (menuOutlet) {
                                const countSnap = await db.collection(COLLECTIONS.ORDERS)
                                    .where('menu', '==', menuOutlet)
                                    .where('status', 'in', ['pending', 'preparing', 'ready'])
                                    .get();
                                const pendingCount = countSnap.size;
                                const settingsRef = db.collection(COLLECTIONS.SETTINGS).doc('global_settings');
                                const settingsDoc = await settingsRef.get();
                                if (settingsDoc.exists) {
                                    const settings = settingsDoc.data();
                                    let menuStatus = settings.menuStatus || {};
                                    let outletStatus = menuStatus[menuOutlet] || { isOpen: true };
                                    const pendingCounts = settings.pendingCounts || {};
                                    const updates = {};
                                    let shouldUpdate = false;
                                    if (pendingCounts[menuOutlet] !== pendingCount) {
                                        pendingCounts[menuOutlet] = pendingCount;
                                        updates['pendingCounts'] = pendingCounts;
                                        shouldUpdate = true;
                                    }
                                    if (pendingCount >= 10 && outletStatus.isOpen) {
                                        outletStatus.isOpen = false;
                                        outletStatus.closeMessage = "Due to a high volume of orders, this outlet is temporarily paused. Please try again in a few minutes.";
                                        outletStatus.autoClosed = true;
                                        menuStatus[menuOutlet] = outletStatus;
                                        updates['menuStatus'] = menuStatus;
                                        shouldUpdate = true;
                                    } else if (pendingCount <= 7 && !outletStatus.isOpen && outletStatus.autoClosed) {
                                        outletStatus.isOpen = true;
                                        outletStatus.closeMessage = "";
                                        outletStatus.autoClosed = false;
                                        menuStatus[menuOutlet] = outletStatus;
                                        updates['menuStatus'] = menuStatus;
                                        shouldUpdate = true;
                                    }
                                    if (shouldUpdate) {
                                        updates['lastMenuUpdate'] = Date.now();
                                        await settingsRef.update(updates);
                                    }
                                }
                            }
                        } catch (syncError) {
                            console.error("Error syncing outlet status:", syncError);
                        }
                    }
                } else {
                    console.error(`CRITICAL: Payment verified but order ${orderRef} not in Firestore.`);
                }
            } catch (dbError) {
                console.error(`Error updating order ${orderRef}:`, dbError);
                return res.status(500).json({ success: false, error: 'Order update failed. Contact reception.' });
            }

            return res.json({ success: true, orderRef });
        } else {
            // Payment failed — mark order cancelled
            try {
                await db.collection(COLLECTIONS.ORDERS).doc(orderRef).update({
                    status: 'cancelled',
                    paymentFailure: { errorCode: data.resultCode || 'FAILED', errorMessage: result.message },
                    updatedAt: admin.firestore.Timestamp.now()
                });
            } catch (e) { /* non-critical */ }

            return res.json({ success: false, orderRef, resultCode: data.resultCode, message: result.message });
        }

    } catch (error) {
        console.error('Verify error:', error.message);
        return res.status(500).json({ success: false, error: 'Failed to verify payment. Contact reception.' });
    }
});

/**
 * GET /payment/success  (legacy — kept for backwards compatibility / webhook redirects)
 * Secure payment success callback
 */
router.get('/success', async (req, res) => {
    try {
        const encryptedData = req.query.data;
        if (!encryptedData) return res.redirect(MENU_APP_URL);
        
        // Decrypt and parse response
        const result = hesabeService.handlePaymentCallback(encryptedData);
        const data = result.data;
        const orderRef = data.orderReferenceNumber;
        
        console.log(`=== SUCCESS CALLBACK: ${orderRef} ===`);
        
        if (result.success) {
            // --- 2. Update Order Record in Firestore (Transaction Correlation) ---
            // Address Risk 5 & 8
            try {
                const docRef = db.collection(COLLECTIONS.ORDERS).doc(orderRef);
                const docSnap = await docRef.get();
                
                if (docSnap.exists) {
                    const currentStatus = docSnap.data().status;

                    // RACE CONDITION GUARD: Only transition from awaiting_payment.
                    // This prevents the success callback from clobbering an order
                    // already processed by the webhook, or resurrecting an admin-cancelled order.
                    if (currentStatus !== 'awaiting_payment') {
                        console.warn(`Success callback: Order ${orderRef} is already in status '${currentStatus}'. Skipping update to prevent dual-write.`);
                    } else {
                    await docRef.update({
                        status: 'pending', // Move to kitchen queue automatically
                        updatedAt: admin.firestore.Timestamp.now(),
                        paidAt: admin.firestore.Timestamp.now(),
                        paymentDetails: {
                            // Non-sensitive identifiers stored in plaintext for reference
                            paymentId: data.paymentId,
                            paidOn: data.paidOn,
                            gatewayResult: data.resultCode,
                            via: 'success_callback',
                            // Sensitive tokens encrypted with AES-256-GCM before storage
                            transactionId: encryptField(data.transactionId),
                            authCode: encryptField(data.auth),
                            bankReferenceId: encryptField(data.bankReferenceId),
                            paymentToken: encryptField(data.paymentToken),
                        },
                        customerInfo: data.customer || null
                    });
                    console.log(`Order ${orderRef} successfully verified and updated to PENDING.`);
                    
                    // --- 3. Dynamic Prep Time & Auto-Close Logic ---
                    try {
                        const menuOutlet = docSnap.data().menu;
                        if (menuOutlet) {
                            // Count pending orders for this outlet
                            const countSnap = await db.collection(COLLECTIONS.ORDERS)
                                .where('menu', '==', menuOutlet)
                                .where('status', 'in', ['pending', 'preparing', 'ready'])
                                .get();
                            const pendingCount = countSnap.size;

                            const settingsRef = db.collection(COLLECTIONS.SETTINGS).doc('global_settings');
                            const settingsDoc = await settingsRef.get();
                            if (settingsDoc.exists) {
                                const settings = settingsDoc.data();
                                let menuStatus = settings.menuStatus || {};
                                let currentStatus = menuStatus[menuOutlet] || { isOpen: true };

                                let shouldUpdate = false;
                                const updates = {};

                                const pendingCounts = settings.pendingCounts || {};
                                if (pendingCounts[menuOutlet] !== pendingCount) {
                                    pendingCounts[menuOutlet] = pendingCount;
                                    updates['pendingCounts'] = pendingCounts;
                                    shouldUpdate = true;
                                }

                                if (pendingCount >= 10 && currentStatus.isOpen) {
                                    currentStatus.isOpen = false;
                                    currentStatus.closeMessage = "Due to a high volume of orders, this outlet is temporarily paused. Please try again in a few minutes.";
                                    currentStatus.autoClosed = true;
                                    menuStatus[menuOutlet] = currentStatus;
                                    updates['menuStatus'] = menuStatus;
                                    shouldUpdate = true;
                                } else if (pendingCount <= 7 && !currentStatus.isOpen && currentStatus.autoClosed) {
                                    currentStatus.isOpen = true;
                                    currentStatus.closeMessage = "";
                                    currentStatus.autoClosed = false;
                                    menuStatus[menuOutlet] = currentStatus;
                                    updates['menuStatus'] = menuStatus;
                                    shouldUpdate = true;
                                }

                                if (shouldUpdate) {
                                    updates['lastMenuUpdate'] = Date.now();
                                    await settingsRef.update(updates);
                                    console.log(`Outlet '${menuOutlet}' pending count synced to ${pendingCount}`);
                                }
                            }
                        }
                    } catch (syncError) {
                        console.error("Error syncing outlet status:", syncError);
                    }
                    } // end if (currentStatus === 'awaiting_payment')

                } else {
                    console.error(`CRITICAL: Payment successful but order ${orderRef} not found in Firestore!`);
                }
            } catch (updateError) {
                console.error(`Error updating order ${orderRef}:`, updateError);
            }
        }
        
        // Redirect to menu app with MINIMAL information (Security Fix 6)
        // We only send success status and the order reference.
        // PaymentCallback.tsx will verify the status server-side.
        const redirectUrl = new URL(`${MENU_APP_URL}/payment-callback`);
        redirectUrl.searchParams.set('success', result.success.toString());
        redirectUrl.searchParams.set('orderRef', orderRef);
        
        res.redirect(redirectUrl.toString());
        
    } catch (error) {
        console.error('Success callback error:', error);
        res.redirect(`${MENU_APP_URL}/payment-callback?success=false&error=verification_failed`);
    }
});

/**
 * GET /payment/failure
 * Payment failure callback
 */
router.get('/failure', async (req, res) => {
    try {
        const encryptedData = req.query.data;
        let errorMessage = 'The payment was cancelled or failed.';
        let errorCode = 'PAYMENT_FAILED';
        let orderRef = null;
        
        if (encryptedData) {
            try {
                const result = hesabeService.handlePaymentCallback(encryptedData);
                errorMessage = result.message || errorMessage;
                orderRef = result.data?.orderReferenceNumber;
                
                if (result.data?.resultCode) {
                    errorCode = result.data.resultCode;
                }
            } catch (e) {
                console.error('Could not decrypt failure data:', e);
                errorCode = 'DECRYPT_ERROR';
            }
        }
        
        // Update order status if we have the reference
        if (orderRef) {
            try {
                await db.collection(COLLECTIONS.ORDERS).doc(orderRef).update({
                    status: 'cancelled',
                    paymentFailure: { errorCode, errorMessage },
                    updatedAt: admin.firestore.Timestamp.now()
                });
            } catch (e) { /* ignore */ }
        }
        
        // Redirect to menu app with error info
        const params = new URLSearchParams({
            success: 'false',
            error: errorMessage,
            errorCode: errorCode
        });
        
        res.redirect(`${MENU_APP_URL}/payment-callback?${params.toString()}`);
        
    } catch (error) {
        console.error('Failure callback error:', error);
        res.redirect(`${MENU_APP_URL}/payment-callback?success=false&error=Payment+processing+error&errorCode=SYSTEM_ERROR`);
    }
});

/**
 * POST /payment/webhook
 * Secure webhook endpoint with decryption verification
 */
router.post('/webhook', async (req, res) => {
    try {
        console.log('=== WEBHOOK RECEIVED ===');
        
        // 1. Decrypt and verify the payload
        let webhookData;
        try {
            webhookData = hesabeService.handleWebhook(req.body);
        } catch (decryptError) {
            console.error('Webhook Decryption Failed:', decryptError.message);
            return res.status(400).json({ received: false, error: 'decryption_failure' });
        }
        
        // Extract data depending on structure
        const data = (webhookData.response && webhookData.response.data) || webhookData.response || webhookData.data || webhookData;
        
        if (!data || !data.orderReferenceNumber) {
            console.warn('Webhook verified but payload structure is invalid.');
            return res.status(400).json({ received: false, error: 'invalid_payload' });
        }

        const orderRef = data.orderReferenceNumber;
        const isSuccess = data.resultCode === 'CAPTURED';

        console.log(`Webhook Handshake: Order ${orderRef}, Success: ${isSuccess}`);

        // 2. Synchronize Order Status (Secure Fail-safe)
        if (isSuccess && orderRef) {
            try {
                const docRef = db.collection(COLLECTIONS.ORDERS).doc(orderRef);
                const docSnap = await docRef.get();

                if (docSnap.exists) {
                    const currentStatus = docSnap.data().status;
                    
                    // Only update if not already processed (prevents duplicate triggers)
                    if (currentStatus === 'awaiting_payment') {
                        // Check if payment arrived severely late (> 2 hours)
                        const createdAtVal = docSnap.data().createdAt;
                        const createdAtMs = typeof createdAtVal === 'number' 
                            ? createdAtVal 
                            : (createdAtVal?.toMillis ? createdAtVal.toMillis() : Date.now());
                        
                        const isLatePayment = (Date.now() - createdAtMs) > (2 * 60 * 60 * 1000); // > 2 hours

                        const updateData = {
                            status: 'pending',
                            updatedAt: admin.firestore.Timestamp.now(),
                            paidAt: admin.firestore.Timestamp.now(),
                            webhookVerified: true,
                            paymentDetails: {
                                paymentId: data.paymentId,
                                paidOn: data.paidOn,
                                gatewayResult: data.resultCode,
                                via: 'webhook',
                                // Sensitive tokens encrypted with AES-256-GCM before storage
                                transactionId: encryptField(data.transactionId),
                                authCode: encryptField(data.auth || data.authCode),
                                bankReferenceId: encryptField(data.bankReferenceId),
                                paymentToken: encryptField(data.paymentToken),
                            }
                        };

                        if (isLatePayment) {
                            updateData.isLatePayment = true;
                            console.warn(`LATE PAYMENT DETECTED: Order ${orderRef} captured after > 2 hours.`);
                        }

                        await docRef.update(updateData);
                        console.log(`Order ${orderRef} verified via Webhook and moved to PENDING.`);
                    }
                } else {
                    console.error(`Webhook Data Error: Order ${orderRef} not found in database.`);
                    // Return 404 so the gateway might retry, just in case there's a race condition where the order is still writing
                    return res.status(404).json({ received: false, error: 'order_not_found' });
                }
            } catch (dbError) {
                console.error('Webhook Database Sync Error:', dbError.message);
                // Return 500 to FORCE the payment gateway to retry the webhook later
                return res.status(500).json({ received: false, error: 'database_sync_error' });
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('General Webhook Processing Error:', error);
        // Return 500 to FORCE the payment gateway to retry the webhook later
        res.status(500).json({ received: false, error: 'system_processing_error' });
    }
});

/**
 * GET /payment/test
 */
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Payment routes are working',
        config: {
            merchantCode: process.env.HESABE_MERCHANT_ID ? '***' + process.env.HESABE_MERCHANT_ID.slice(-3) : 'NOT SET',
            baseUrl: process.env.HESABE_BASE_URL || 'NOT SET'
        }
    });
});

/**
 * POST /admin/create-staff
 * Create or update a staff user account with a fixed role
 * SECURE: Verifies the caller's Firebase ID Token and Admin Role
 */
router.post('/admin/create-staff', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        // 1. Verify the caller's identity via Firebase
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const callerUid = decodedToken.uid;

        // 2. Verify the caller has 'admin' role in Firestore
        const callerSnap = await db.collection('staff_roles').doc(callerUid).get();
        if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
            console.warn(`Unauthorized staff management attempt by UID: ${callerUid}`);
            return res.status(403).json({ success: false, error: 'Permission denied: Admin only' });
        }

        const { role, password } = req.body;
        const validRoles = ['kitchen', 'seashell', 'presto', 'room-service', 'admin', 'admin2'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid staff role' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }

        const email = `${role}@seashell.internal`;
        const displayName = role.startsWith('admin') 
            ? (role === 'admin' ? 'Primary Admin' : 'Secondary Admin')
            : role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Staff';

        // 3. Perform the management action
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
            await admin.auth().updateUser(userRecord.uid, {
                password: password,
                displayName: displayName
            });
            console.log(`Admin ${callerUid} updated staff: ${email}`);
        } catch (authError) {
            if (authError.code === 'auth/user-not-found') {
                userRecord = await admin.auth().createUser({
                    email: email,
                    password: password,
                    displayName: displayName,
                    emailVerified: true
                });
                console.log(`Admin ${callerUid} created staff: ${email}`);
            } else {
                throw authError;
            }
        }

        // 4. Sync role in Firestore
        await db.collection('staff_roles').doc(userRecord.uid).set({
            role: role,
            updatedAt: admin.firestore.Timestamp.now(),
            email: email,
            managedBy: callerUid
        });

        res.json({ 
            success: true, 
            message: `Account for ${role} updated successfully.`,
            email: email 
        });

    } catch (error) {
        console.error('Secure Staff Management Error:', error);
        res.status(500).json({ success: false, error: 'Failed to process management request' });
    }
});

module.exports = router;
