# Firebase Cloud Functions & Payment Processing - Plan Limitations

## 🚨 **Critical Information: Cloud Functions Require Blaze Plan**

### ❌ Spark Plan Limitations

**What's NOT Available on Spark Plan:**

- ❌ **Cloud Functions** (any type)
- ❌ **Cloud Storage for Firebase** (beyond 5GB downloads/day)
- ❌ **Test Lab** virtual devices

**What IS Available on Spark Plan:**

- ✅ Firestore (50k reads, 20k writes, 20k deletes per day)
- ✅ Firebase Hosting (10GB storage, 1GB bandwidth/month)
- ✅ Authentication (unlimited)
- ✅ Realtime Database (1GB storage, 10GB/month bandwidth)
- ✅ Cloud Storage (1GB storage, 1GB/day downloads)

**Verdict:** You **CANNOT** use Cloud Functions on Spark plan! ❌

---

## 💰 **Blaze Plan Costs for Cloud Functions**

If you upgrade to Blaze plan, here are the costs:

### Cloud Functions Pricing (Blaze Plan):

| Resource          | Free Tier (per month)   | After Free Tier          |
| ----------------- | ----------------------- | ------------------------ |
| **Invocations**   | 2,000,000 FREE          | $0.40 per million        |
| **Compute Time**  | 400,000 GB-seconds FREE | $0.0000025 per GB-second |
| **Outbound Data** | 5GB FREE                | $0.12 per GB             |

### Your Use Case: Payment Processing for 100 Guests

**Assumptions:**

- 100 orders/month
- 1 Cloud Function call per order (payment processing)
- Average function runtime: 2 seconds
- Function memory: 256MB (0.25GB)
- Negligible outbound data (API responses are tiny)

**Monthly Costs:**

```
Invocations:
- 100 calls/month
- FREE (well under 2M free tier)

Compute Time:
- 100 calls × 2 seconds × 0.25GB = 50 GB-seconds
- FREE (well under 400,000 GB-seconds free tier)

Outbound Data:
- ~1KB per response = 0.0001GB total
- FREE (well under 5GB free tier)

TOTAL COST: $0.00 for 100 guests/month ✅
```

**Even with 1,000 orders/month:**

```
Invocations: 1,000 calls = FREE
Compute Time: 500 GB-seconds = FREE
TOTAL COST: Still $0.00 ✅
```

---

## 🎯 **Payment Processing Options**

### Option 1: Client-Side Payment Processing (Spark Plan Compatible) ✅

**How it works:**

```
Guest App → Payment Gateway (Stripe/PayPal/Hesabe) → Confirmation → Create Order in Firestore
```

**Pros:**

- ✅ **Works on Spark plan** (no Cloud Functions needed)
- ✅ **No additional Firebase costs**
- ✅ **Simpler architecture**
- ✅ **Real-time feedback to user**

**Cons:**

- ⚠️ Payment logic in client (less secure)
- ⚠️ No server-side validation
- ⚠️ Potential for tampering (though payment gateway handles security)

**Security Note:**
Most payment gateways (Stripe, PayPal, Hesabe) have client-side SDKs designed for this. The actual payment processing happens on their secure servers, not yours. You just get a token/confirmation.

**Implementation:**

```typescript
// Client-side (works on Spark plan)
import { loadStripe } from "@stripe/stripe-js";

const handlePayment = async (orderData) => {
  // 1. Process payment with Stripe/Hesabe
  const paymentResult = await processPaymentWithGateway(orderData);

  if (paymentResult.success) {
    // 2. Create order in Firestore
    await addDoc(collection(db, "orders"), {
      ...orderData,
      paymentId: paymentResult.id,
      status: "paid",
      createdAt: Timestamp.now(),
    });
  }
};
```

**Cost: $0 (Spark plan works!)** ✅

---

### Option 2: Cloud Functions for Server-Side Processing (Requires Blaze Plan)

**How it works:**

```
Guest App → Cloud Function → Payment Gateway → Create Order → Return Result
```

**Pros:**

- ✅ **More secure** (server-side validation)
- ✅ **Better error handling**
- ✅ **Can integrate with multiple payment gateways**
- ✅ **Centralized business logic**

**Cons:**

- ❌ **Requires Blaze plan**
- ⚠️ Adds ~500ms latency (function cold start)
- ⚠️ More complex setup

**Implementation:**

```typescript
// functions/index.ts
import * as functions from "firebase-functions";
import Stripe from "stripe";

export const processPayment = functions.https.onCall(async (data, context) => {
  // Validate request
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  // Process payment
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: data.amount,
    currency: "kwd",
  });

  // Create order in Firestore
  await admin
    .firestore()
    .collection("orders")
    .add({
      ...data.order,
      paymentId: paymentIntent.id,
      status: "paid",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return { success: true, orderId: order.id };
});
```

**Cost:**

- Upgrade to Blaze: Required
- Function costs for 100-1000 orders/month: **$0** (within free tier)
- **Total: $0/month** (but requires Blaze plan setup)

---

### Option 3: Hybrid Approach (Best of Both Worlds)

**Strategy:**

1. Use **client-side payment** for instant feedback (Spark compatible)
2. Use **Firestore Triggers** to validate/process orders server-side

Wait, Firestore Triggers are Cloud Functions too! So this also requires Blaze plan.

**Better Hybrid:**

1. Client-side payment with payment gateway
2. Store order in Firestore with `paymentPending: true`
3. Use **scheduled Firebase Hosting Deploy** to verify payments periodically
4. Or verify on management app load (client-side in management app)

---

## 📊 **Cost Comparison: Spark vs Blaze**

### Scenario: 100 Guests/Month

| Plan      | What You Get                               | Monthly Cost | Notes                          |
| --------- | ------------------------------------------ | ------------ | ------------------------------ |
| **Spark** | Firestore + Hosting + Client-side payments | **$0**       | Sufficient for your needs ✅   |
| **Blaze** | Everything + Cloud Functions               | **$0**       | Free tier covers your usage ✅ |

### Scenario: 1,000 Guests/Month

| Plan      | What You Get                 | Monthly Cost              | Notes                                      |
| --------- | ---------------------------- | ------------------------- | ------------------------------------------ |
| **Spark** | May exceed limits            | **$0** (until limits hit) | Firestore reads might exceed if not cached |
| **Blaze** | Everything + Cloud Functions | **~$0-5**                 | Firestore costs, functions still free      |

---

## 🎯 **Recommendation for Your Use Case**

### For Room Charge / Cash Payments (Most of Your Orders):

**Use Client-Side Approach - Spark Plan Compatible ✅**

You don't need payment processing at all! Just create the order:

```typescript
// No payment gateway needed for room charge
const handleRoomChargeOrder = async (orderData) => {
  await addDoc(collection(db, "orders"), {
    ...orderData,
    paymentMethod: "room-charge",
    status: "pending",
    createdAt: Timestamp.now(),
  });
};
```

**Cost: $0, works on Spark plan** ✅

---

### For Card/Hesabe Payments (if needed):

**Option A: Client-Side Integration (Spark Compatible)**

Use Hesabe's client-side SDK:

```typescript
import Hesabe from "hesabe-sdk"; // hypothetical

const handleHesabePayment = async (orderData) => {
  // 1. Initialize Hesabe payment
  const payment = await Hesabe.createPayment({
    amount: orderData.totalAmount,
    currency: "KWD",
    merchantId: "your_merchant_id",
  });

  // 2. Redirect to Hesabe payment page
  window.location.href = payment.paymentUrl;

  // 3. On return, verify payment and create order
  // (Hesabe redirects back to your app with payment status)
};
```

**Cost: $0 (Spark plan)** ✅

---

**Option B: Cloud Function (Requires Blaze)**

Only upgrade to Blaze if you need:

- Server-side payment validation
- Webhook processing
- Complex payment logic
- PCI compliance requirements

**Cost: $0/month for <10,000 orders** (free tier)

---

## ✅ **Final Recommendation**

### Stay on Spark Plan If:

- ✅ Most orders are room-charge or cash
- ✅ You can use client-side payment gateway integration
- ✅ You want to minimize complexity
- ✅ You're happy with current architecture

### Upgrade to Blaze If:

- You need server-side payment validation
- You need webhook processing from payment gateway
- You want centralized payment logic
- You need automated payment reconciliation

**For 100 guests/month with room-charge payments: Spark plan is PERFECT!** ✅

---

## 🚨 **Important Notes**

### About Blaze Plan:

**Good News:**

- ✅ **No monthly fee** - only pay for what you use
- ✅ **Free tiers are generous** - likely $0/month for your usage
- ✅ **Can set budget alerts** - get notified if costs increase
- ✅ **Can set spending limits** - prevent surprise bills

**How to Protect Yourself on Blaze:**

1. **Set Budget Alerts:**

   ```
   Firebase Console → Usage and Billing → Budget & Alerts
   Set alert at: $1, $5, $10
   ```

2. **Monitor Daily:**
   - Check Firebase Console → Usage tab
   - Watch for unexpected spikes

3. **Set Quotas:**
   - Limit Cloud Functions to X invocations/day
   - Set max concurrent executions

---

## 💡 **Best Approach for Your Hotel**

### Current Setup (Recommended for Spark):

```typescript
// Guest places order (client-side)
const placeOrder = async (orderData) => {
  // Determine payment method
  if (
    orderData.paymentMethod === "room-charge" ||
    orderData.paymentMethod === "cash"
  ) {
    // No payment processing needed!
    await addDoc(collection(db, "orders"), {
      ...orderData,
      status: "pending",
      createdAt: Timestamp.now(),
    });
  } else if (orderData.paymentMethod === "card") {
    // Client-side Hesabe integration
    const paymentResult = await processHesabePayment(orderData);
    if (paymentResult.success) {
      await addDoc(collection(db, "orders"), {
        ...orderData,
        paymentId: paymentResult.id,
        status: "paid",
        createdAt: Timestamp.now(),
      });
    }
  }
};
```

**Works perfectly on Spark plan!** ✅

**Cost: $0/month for unlimited room-charge orders** ✅

---

## 📝 **Summary**

| Question                                         | Answer                                        |
| ------------------------------------------------ | --------------------------------------------- |
| **Can I use Cloud Functions on Spark?**          | ❌ No - requires Blaze plan                   |
| **Will 100+ function calls break Blaze limits?** | ✅ No - well within free tier (2M free calls) |
| **What would Blaze cost for 100 orders/month?**  | $0 - entirely within free tier ✅             |
| **Do I NEED Cloud Functions for payments?**      | ❌ No - client-side works fine for most cases |
| **Should I upgrade to Blaze?**                   | Only if you need server-side validation       |
| **Best approach for your hotel?**                | Stay on Spark, use client-side for now ✅     |

---

**Bottom Line:** You can absolutely stay on Spark plan and handle 100+ orders/month! Most hotel orders are room-charge anyway, which need zero payment processing. If you add card payments later, use client-side integration (works on Spark). Only upgrade to Blaze if you specifically need server-side payment validation, and even then it would cost $0/month for your volume! 🎉
