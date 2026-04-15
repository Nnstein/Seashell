# Hesabe Payment Integration - Implementation Guide

This document explains the complete Hesabe payment gateway integration for the Seashell menu app.

---

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Menu App      │────────▶│ Seashell Backend │────────▶│ Hesabe Payment   │
│  (Frontend)     │◀────────│   (Node.js)      │◀────────│    Gateway       │
└─────────────────┘         └──────────────────┘         └──────────────────┘
```

### Flow:

1. **Customer** selects "Pay with Card" in menu app checkout
2. **Menu App** calls backend to create Hesabe checkout
3. **Backend** encrypts payment data & creates checkout with Hesabe
4. **Hesabe** returns payment token
5. **Backend** returns redirect URL to menu app
6. **Menu App** redirects customer to Hesabe payment page
7. **Customer** completes payment on Hesabe
8. **Hesabe** redirects back to backend success/failure URL
9. **Backend** decrypts response & redirects to menu app callback
10. **Menu App** completes order in Firebase

---

## 📁 Files Created/Modified

### Backend (`seashell-backend/`)

| File                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `lib/HesabeCrypt.js`      | AES-256-CBC encryption library                        |
| `lib/hesabeEncryption.js` | `getEncryptedData()` and `getDecryptedData()` helpers |
| `services/hesabe.js`      | Main Hesabe service (checkout, callbacks)             |
| `routes/payment.js`       | Payment API routes                                    |
| `server.js`               | Express server                                        |
| `.env.local`              | Hesabe credentials + `MENU_APP_URL`                   |

### Frontend (`apps/menu-app/`)

| File                             | Purpose                                   |
| -------------------------------- | ----------------------------------------- |
| `services/paymentService.ts`     | API client for Hesabe backend             |
| `hooks/useOrder.ts`              | Updated with card payment logic           |
| `components/PaymentCallback.tsx` | Handles payment return & order completion |
| `components/OrderDrawer.tsx`     | Already has payment method selector       |
| `.env`                           | Added `VITE_BACKEND_URL`                  |

---

## 🔐 Environment Variables

### Backend (`.env.local`)

```env
HESABE_MERCHANT_ID=842217
HESABE_ACCESS_CODE=c333729b-d060-4b74-a49d-7686a8353481
HESABE_SECRET_KEY=PkW64zMe5NVdrlPVNnjo2Jy9nOb7v1Xg
HESABE_IV_KEY=5NVdrlPVNnjo2Jy9
HESABE_BASE_URL=https://sandbox.hesabe.com
HESABE_PAYMENT_INITIATED_CHECKOUT_URL=https://sandbox.hesabe.com/checkout
HESABE_PAYMENT_PAGE_REDIRECTION_URL=https://sandbox.hesabe.com/payment
MENU_APP_URL=http://localhost:5173
```

### Frontend (`.env`)

```env
VITE_FIREBASE_API_KEY='Seashell Meal Menu (auto created by Firebase)'
VITE_BACKEND_URL=http://localhost:3001
```

---

## 🔄 Payment Flow Details

### 1. Customer Checkout (useOrder.ts)

When customer clicks "Place Order" with "Pay with Card":

```typescript
// Create order reference
const orderRef = `ORDER-${Date.now()}`;

// Call backend to create Hesabe checkout
const checkoutResult = await createHesabeCheckout({
    amount: totalAmount,
    orderReferenceNumber: orderRef,
    variable1: roomNumber,      // Room number
    variable2: phoneNumber,      // Phone number
    variable3: 'Guest',          // Guest name
    variable4: chairNumber,      // Chair/table (beach guests)
    variable5: activeMenu,       // Menu type (presto/room-service)
});

// Save order data to localStorage (for completion after payment)
localStorage.setItem('pending_order', JSON.stringify({ ... }));

// Redirect to Hesabe payment page
window.location.href = checkoutResult.redirectUrl;
```

### 2. Backend Checkout Creation (routes/payment.js)

```javascript
// Encrypt payment data
const encryptedData = getEncryptedData({
    merchantCode: HESABE_MERCHANT_ID,
    amount: amount.toFixed(3), // KWD uses 3 decimals
    paymentType: 0, // All payment methods
    responseUrl: `${BACKEND_URL}/payment/success`,
    failureUrl: `${BACKEND_URL}/payment/failure`,
    version: '2.0',
    orderReferenceNumber: orderRef,
    variable1-5: custom data
});

// Call Hesabe API
const response = await axios.post(
    `https://sandbox.hesabe.com/checkout`,
    { data: encryptedData },
    { headers: { accessCode: HESABE_ACCESS_CODE } }
);

// Decrypt response
const responseData = getDecryptedData(response.data);

// Return payment redirect URL
return {
    success: true,
    redirectUrl: `https://sandbox.hesabe.com/payment?data=${responseData.response.data}`
};
```

### 3. Payment Success Callback (routes/payment.js)

```javascript
router.get("/payment/success", (req, res) => {
  // Decrypt Hesabe response
  const result = hesabeService.handlePaymentCallback(req.query.data);

  // Redirect to menu app with payment data
  res.redirect(
    `${MENU_APP_URL}/payment-callback?success=${result.success}&data=...`,
  );
});
```

### 4. Complete Order (PaymentCallback.tsx)

```typescript
// Get pending order from localStorage
const pendingOrder = JSON.parse(localStorage.getItem("pending_order"));

// Place order in Firebase with payment status
await placeOrder({
  ...pendingOrder,
  paymentMethod: "card",
  paymentStatus: "paid",
});

// Clear pending order
localStorage.removeItem("pending_order");

// Show confirmation & redirect home
navigate("/", { state: { orderConfirmed: true } });
```

---

## 🧪 Testing

### 1. Start the Backend

```bash
cd seashell-backend
node server.js
# Server runs on http://localhost:3001
```

### 2. Start the Menu App

```bash
cd apps/menu-app
npm run dev
# App runs on http://localhost:5173
```

### 3. Test Payment Flow

1. Open http://localhost:5173
2. Add items to cart
3. Enter room number and phone
4. Select **"Pay with Card"**
5. Click **"Place Order"**
6. You'll be redirected to Hesabe sandbox
7. Use test card:
   - **KNET**: Expiry `09/30`, PIN `1234`
   - **Visa**: Card `4543474002249996`, Expiry `01/39`, CVV `207`, Name `Hesabe`
8. Complete payment
9. You'll be redirected back to menu app
10. Order will be completed in Firebase

---

## 🚨 Important Notes

### Payment Data Storage

- **Room charge**: Order saved to Firebase immediately
- **Card payment**: Order data saved to `localStorage` first, then Firebase after payment success

### Variable Mapping

Hesabe allows 5 custom variables. We use them as:

- `variable1`: Room number
- `variable2`: Phone number
- `variable3`: Guest name
- `variable4`: Chair/table number (beach guests)
- `variable5`: Menu type (presto/room-service)

### Error Handling

- If payment fails, customer is redirected back to menu app
- Pending order remains in localStorage for retry
- If order submission fails after payment, also stored in localStorage

---

## 🔜 Next Steps & TODO

### Required: Route Setup

You need to add the `PaymentCallback` route to your menu app router:

```typescript
// In your router configuration
import PaymentCallback from './components/PaymentCallback';

<Route path="/payment-callback" element={<PaymentCallback />} />
```

### Optional Enhancements

1. **Logging**: Implement production-ready logging (Winston/Pino)
2. **Webhooks**: Handle async payment status updates
3. **Receipt Email**: Send confirmation emails after payment
4. **Order Status**: Update order tracking in management app
5. **Payment History**: Store payment transactions separately
6. **Refunds**: Implement refund handling via Hesabe API

---

## 🐛 Troubleshooting

### Backend not connecting?

```bash
# Test backend health
curl http://localhost:3001/health

# Test Hesabe config
curl http://localhost:3001/payment/test
```

### Frontend can't reach backend?

1. Check `.env` file has `VITE_BACKEND_URL`
2. Restart Vite dev server to reload env variables
3. Check CORS is enabled in backend

### Payment redirect not working?

1. Check `MENU_APP_URL` in backend `.env.local`
2. Ensure menu app is running on the configured port
3. Check browser console for navigation errors

---

## 📚 Resources

- **Hesabe Docs**: https://developer.hesabe.com/
- **Test Cards**: https://developer.hesabe.com/docs/support/support-test-cards
- **Sandbox Environment**: https://sandbox.hesabe.com

---

**Integration Status**: ✅ Complete - Ready for testing!
