# Hesabe Payment Gateway Integration Plan

Based on the [Hesabe Developer Documentation](https://developer.hesabe.com/), this document outlines the secure integration strategy for the Seashell Menu App.

## ⚠️ Critical Security Requirement
**Hesabe requires AES encryption** using a secret key to generate the payment payload.
**You CANNOT perform this encryption in the React Frontend** because it would expose your Merchant Secret Key to the public, allowing anyone to forge payments or steal credentials.

**Solution:** We must use a **Firebase Cloud Function** (Backend) to handle the sensitive encryption and communication with Hesabe.

---

## Architecture Overview

1.  **Frontend (Seashell Menu App)**
    - User selects items and clicks "Checkout".
    - Apps calls Firebase Cloud Function: `initiateHesabePayment`.
    - Function returns a `paymentUrl`.
    - App redirects user to `paymentUrl`.

2.  **Firebase Cloud Function (`initiateHesabePayment`)**
    - Authenticates with Hesabe Credentials (stored in environment variables).
    - Constructs the Payment Payload (Amount, Order ID).
    - Encrypts the payload using AES-256-CBC (or Hesabe's specific algo).
    - POSTs to Hesabe `/checkout` (Quick Invoice).
    - Decrypts the response to get the URL.

3.  **Hesabe Payment Page**
    - User enters card details.
    - On success/failure, redirects to your `responseUrl` (handled by App or another Cloud Function).

---

## Detailed Implementation Steps

### 1. Backend Setup (Firebase Functions)
You need to deploy a Node.js Cloud Function.

**Required Secrets:**
- `HESABE_MERCHANT_CODE`
- `HESABE_ACCESS_CODE`
- `HESABE_SECRET_KEY`
- `HESABE_IV_KEY`

**Code Structure (Pseudo-code for Cloud Function):**

```javascript
const functions = require('firebase-functions');
const crypto = require('crypto');
const axios = require('axios');

// Hesabe AES Encryption Helper
const encrypt = (text, key, iv) => {
    // Implementation of AES-CBC using crypto module
    // Matches Hesabe's "Hesabe Crypt" library logic
};

exports.initiateHesabePayment = functions.https.onCall(async (data, context) => {
    const { orderId, amount, customerData } = data;
    
    // 1. Prepare Payload
    const payload = {
        merchantCode: process.env.HESABE_MERCHANT_CODE,
        amount: amount.toFixed(3),
        responseUrl: "https://your-app.web.app/payment-callback",
        failureUrl: "https://your-app.web.app/payment-failed",
        orderReferenceNumber: orderId,
        variable1: orderId, // Custom tracking
        version: "2.0"
    };

    // 2. Encrypt Payload
    const encryptedData = encrypt(JSON.stringify(payload), process.env.HESABE_SECRET_KEY, process.env.HESABE_IV_KEY);

    // 3. Call Hesabe API
    try {
        const response = await axios.post('https://api.hesabe.com/checkout', {
            data: encryptedData
        });
        
        // 4. Decrypt Response
        const decryptedResponse = decrypt(response.data, ...);
        
        // 5. Return Payment URL
        if (decryptedResponse.status && decryptedResponse.response.data) {
             // Decode base64 if needed or parse token
             const token = decryptedResponse.response.data;
             return { url: `https://api.hesabe.com/payment?data=${token}` };
        }
        return { error: 'Failed' };
    } catch (e) {
        throw new functions.https.HttpsError('internal', 'Payment Init Failed');
    }
});
```

### 2. Frontend Integration (React)

Update `AppContext.tsx` to handle the new payment flow.

```typescript
// AppContext.tsx

const handleCheckout = async (paymentMethod) => {
    if (paymentMethod === 'hesabe') {
        const createPayment = httpsCallable(functions, 'initiateHesabePayment');
        const setRes = await createPayment({ 
            orderId: 'ORDER_123', 
            amount: 5.000 
        });
        
        if (setRes.data.url) {
            window.location.href = setRes.data.url; // Redirect
        }
    } else {
        // ... existing logic (Room Charge)
    }
}
```

### 3. Handling the Callback
Create a new Route/Page in the Menu App (e.g., `/payment-callback`).
This page should:
1.  Read the URL query parameters `?data=...`.
2.  Call another Cloud Function `verifyHesabePayment(data)` to decrypt the result.
3.  If verified success, show "Thank You" screen and update Firestore.

---

## Action Items
1.  **Register** for a Merchant Account at https://hesabe.com/ to get your Keys.
2.  **Enable Firebase Functions** in your project unless you have another backend.
3.  **Deploy** the encryption logic to the backend.
