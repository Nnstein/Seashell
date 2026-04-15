# Server-Side Hesabe Payment Processing Without Cloud Functions

## 🎯 Goal

Implement server-side Hesabe payment processing while staying on Firebase Spark (free) plan.

## 💡 Strategy

Since Cloud Functions aren't available on Spark plan, we'll create a **separate backend API server** and host it for FREE on platforms like:

- **Vercel** (Recommended - easiest deployment)
- **Railway** (Good for persistent servers)
- **Render** (Generous free tier)
- **Replit** (Quick prototyping)

---

## 🏗️ Architecture

```
┌─────────────┐
│ Guest App   │
│ (Firebase)  │
└──────┬──────┘
       │
       │ 1. POST /api/payment
       ▼
┌──────────────────┐
│ Backend Server   │
│ (Vercel/Railway) │◄──── 3. Webhook from Hesabe
└──────┬───────────┘
       │
       │ 2. Call Hesabe API
       ▼
┌─────────────┐
│ Hesabe API  │
└─────────────┘
       │
       │ 4. Payment status
       ▼
┌─────────────┐
│ Firebase    │
│ Firestore   │◄──── 5. Create/Update Order
└─────────────┘
```

---

## 📁 Project Structure

```
seashell-backend/
├── package.json
├── server.js (or index.js)
├── routes/
│   └── payment.js
├── services/
│   ├── hesabe.js
│   └── firebase.js
├── .env
├── .gitignore
└── vercel.json (for Vercel deployment)
```

---

## 🚀 Implementation

### Step 1: Create Backend Server

**Initialize Project:**

```bash
mkdir seashell-backend
cd seashell-backend
npm init -y
npm install express cors dotenv firebase-admin axios
```

---

### Step 2: Create Express Server

**File: `server.js`**

```javascript
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const paymentRoutes = require("./routes/payment");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://your-firebase-app.web.app",
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Seashell Payment API - Running" });
});

// Routes
app.use("/api/payment", paymentRoutes);

// Start server (for local development)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for serverless platforms
module.exports = app;
```

---

### Step 3: Create Payment Routes

**File: `routes/payment.js`**

```javascript
const express = require("express");
const router = express.Router();
const {
  initiatePayment,
  handleWebhook,
  verifyPayment,
} = require("../services/hesabe");
const { createOrder, updateOrder } = require("../services/firebase");

/**
 * POST /api/payment/initiate
 * Initiate Hesabe payment
 */
router.post("/initiate", async (req, res) => {
  try {
    const { orderData } = req.body;

    // Validate request
    if (!orderData || !orderData.totalAmount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // 1. Create pending order in Firestore
    const orderId = await createOrder({
      ...orderData,
      status: "payment_pending",
      paymentMethod: "hesabe",
    });

    // 2. Initiate Hesabe payment
    const paymentResult = await initiatePayment({
      amount: orderData.totalAmount,
      orderId: orderId,
      merchantId: process.env.HESABE_MERCHANT_ID,
      // Add customer details
      customerName: orderData.guestName,
      customerEmail: orderData.email || `room${orderData.roomNumber}@hotel.com`,
      customerMobile: orderData.phoneNumber,
      // Callback URLs
      returnUrl: `${process.env.CLIENT_URL}/payment/success`,
      failureUrl: `${process.env.CLIENT_URL}/payment/failed`,
      callbackUrl: `${process.env.BACKEND_URL}/api/payment/webhook`,
    });

    if (paymentResult.success) {
      // 3. Update order with payment reference
      await updateOrder(orderId, {
        hesabePaymentId: paymentResult.paymentId,
        hesabePaymentUrl: paymentResult.paymentUrl,
      });

      // 4. Return payment URL to client
      res.json({
        success: true,
        orderId: orderId,
        paymentUrl: paymentResult.paymentUrl,
        paymentId: paymentResult.paymentId,
      });
    } else {
      res.status(400).json({
        success: false,
        error: paymentResult.error,
      });
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({
      success: false,
      error: "Payment initiation failed",
      details: error.message,
    });
  }
});

/**
 * POST /api/payment/webhook
 * Hesabe webhook callback
 */
router.post("/webhook", async (req, res) => {
  try {
    const webhookData = req.body;

    console.log("Hesabe webhook received:", webhookData);

    // Process webhook
    const result = await handleWebhook(webhookData);

    if (result.success) {
      // Update order status in Firestore
      await updateOrder(result.orderId, {
        status: result.paymentStatus === "paid" ? "pending" : "payment_failed",
        paymentStatus: result.paymentStatus,
        hesabeTransactionId: result.transactionId,
        paidAt: result.paymentStatus === "paid" ? new Date() : null,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook handling error:", error);
    res.status(500).json({ success: false });
  }
});

/**
 * GET /api/payment/verify/:paymentId
 * Verify payment status
 */
router.get("/verify/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await verifyPayment(paymentId);

    res.json({
      success: true,
      status: result.status,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
});

module.exports = router;
```

---

### Step 4: Hesabe Service

**File: `services/hesabe.js`**

```javascript
const axios = require("axios");

const HESABE_BASE_URL = process.env.HESABE_API_URL || "https://api.hesabe.com";
const MERCHANT_ID = process.env.HESABE_MERCHANT_ID;
const API_KEY = process.env.HESABE_API_KEY;
const SECRET_KEY = process.env.HESABE_SECRET_KEY;

/**
 * Initiate Hesabe payment
 */
async function initiatePayment(paymentData) {
  try {
    const response = await axios.post(
      `${HESABE_BASE_URL}/payment/initiate`,
      {
        merchantId: MERCHANT_ID,
        amount: paymentData.amount,
        currency: "KWD",
        orderId: paymentData.orderId,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        customerMobile: paymentData.customerMobile,
        returnUrl: paymentData.returnUrl,
        failureUrl: paymentData.failureUrl,
        callbackUrl: paymentData.callbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return {
      success: true,
      paymentId: response.data.paymentId,
      paymentUrl: response.data.paymentUrl,
    };
  } catch (error) {
    console.error("Hesabe API error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || "Payment initiation failed",
    };
  }
}

/**
 * Handle Hesabe webhook
 */
async function handleWebhook(webhookData) {
  try {
    // Verify webhook signature (important for security!)
    const isValid = verifyWebhookSignature(webhookData);

    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    return {
      success: true,
      orderId: webhookData.orderId,
      transactionId: webhookData.transactionId,
      paymentStatus: webhookData.status === "success" ? "paid" : "failed",
      amount: webhookData.amount,
    };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(webhookData) {
  // Implement Hesabe's signature verification
  // This prevents unauthorized webhook calls
  const crypto = require("crypto");

  const signature = webhookData.signature;
  const payload = JSON.stringify(webhookData.payload);

  const expectedSignature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}

/**
 * Verify payment status
 */
async function verifyPayment(paymentId) {
  try {
    const response = await axios.get(
      `${HESABE_BASE_URL}/payment/verify/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    return {
      status: response.data.status,
      transactionId: response.data.transactionId,
      amount: response.data.amount,
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    throw error;
  }
}

module.exports = {
  initiatePayment,
  handleWebhook,
  verifyPayment,
};
```

---

### Step 5: Firebase Service

**File: `services/firebase.js`**

```javascript
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

/**
 * Create order in Firestore
 */
async function createOrder(orderData) {
  const docRef = await db.collection("orders").add({
    ...orderData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Update order in Firestore
 */
async function updateOrder(orderId, updates) {
  await db
    .collection("orders")
    .doc(orderId)
    .update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Get order by ID
 */
async function getOrder(orderId) {
  const doc = await db.collection("orders").doc(orderId).get();
  if (!doc.exists) {
    throw new Error("Order not found");
  }
  return { id: doc.id, ...doc.data() };
}

module.exports = {
  createOrder,
  updateOrder,
  getOrder,
};
```

---

### Step 6: Environment Variables

**File: `.env`**

```env
# Server Config
PORT=3000
NODE_ENV=development
CLIENT_URL=https://your-firebase-app.web.app
BACKEND_URL=https://your-backend.vercel.app

# Hesabe Config
HESABE_API_URL=https://api.hesabe.com
HESABE_MERCHANT_ID=your_merchant_id
HESABE_API_KEY=your_api_key
HESABE_SECRET_KEY=your_secret_key

# Firebase Config
FIREBASE_PROJECT_ID=seashell-meal-menu
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seashell-meal-menu.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended) ✅

**1. Create `vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

**2. Deploy:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Or use CLI:
vercel env add HESABE_API_KEY
```

**Cost: FREE** ✅

- 100GB bandwidth/month
- Unlimited requests
- Serverless functions included

---

### Option 2: Railway ✅

**1. Create `railway.json`:**

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**2. Deploy:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Cost: FREE** ✅

- $5 credit/month (enough for your usage)
- Always-on server

---

### Option 3: Render ✅

**1. Create `render.yaml`:**

```yaml
services:
  - type: web
    name: seashell-payment-api
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
```

**2. Deploy:**

- Go to https://render.com
- Connect GitHub repo
- Deploy automatically

**Cost: FREE** ✅

- 750 hours/month free
- Auto-deploy on git push

---

## 📱 Client-Side Integration

**File: `apps/menu-app/services/paymentService.ts`**

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const initiateHesabePayment = async (orderData: any) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderData }),
    });

    const result = await response.json();

    if (result.success) {
      // Redirect to Hesabe payment page
      window.location.href = result.paymentUrl;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Payment initiation failed:", error);
    throw error;
  }
};

export const verifyPayment = async (paymentId: string) => {
  const response = await fetch(
    `${BACKEND_URL}/api/payment/verify/${paymentId}`,
  );
  return await response.json();
};
```

**Usage in your app:**

```typescript
import { initiateHesabePayment } from "./services/paymentService";

const handleCheckout = async () => {
  if (paymentMethod === "hesabe") {
    await initiateHesabePayment({
      totalAmount: cartTotal,
      guestName: session.guestName,
      roomNumber: session.roomNumber,
      phoneNumber: session.phoneNumber,
      items: cartItems,
    });
  } else {
    // Room charge - direct to Firestore
    await placeOrder({ ...orderData, paymentMethod: "room-charge" });
  }
};
```

---

## 💰 Cost Summary

| Platform           | Free Tier       | Cost | Best For                   |
| ------------------ | --------------- | ---- | -------------------------- |
| **Vercel**         | 100GB bandwidth | $0   | ✅ Serverless, zero config |
| **Railway**        | $5 credit/month | $0   | ✅ Always-on server        |
| **Render**         | 750 hours       | $0   | ✅ Auto-deploy             |
| **Firebase Spark** | Firestore only  | $0   | ✅ Your database           |

**Total Monthly Cost: $0** 🎉

---

## ✅ Advantages of This Approach

1. **✅ FREE** - All platforms have generous free tiers
2. **✅ Server-side security** - API keys never exposed
3. **✅ Stays on Spark plan** - No Firebase upgrade needed
4. **✅ Scalable** - Handles 100s-1000s of requests
5. **✅ Easy deployment** - Push to deploy
6. **✅ Separate concerns** - Payment logic isolated

---

## 🔒 Security Best Practices

1. **Never expose API keys in client**
2. **Verify webhook signatures**
3. **Use HTTPS** (all platforms provide this)
4. **Validate all inputs server-side**
5. **Rate limit endpoints**
6. **Log all transactions**

---

## 📝 Summary

**Instead of Cloud Functions, you can:**

- ✅ Build a simple Express server
- ✅ Host it FREE on Vercel/Railway/Render
- ✅ Keep Firebase Spark plan
- ✅ Have full server-side payment processing
- ✅ Cost: $0/month for 100-1000 orders

This gives you the best of both worlds: **FREE Firebase + Server-side payment processing!** 🎉

Would you like me to help you set up any of these platforms?
