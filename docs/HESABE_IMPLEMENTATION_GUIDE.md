# Hesabe Sandbox Integration - Implementation Checklist

**Date Started:** 2026-01-25  
**Merchant Portal:** https://merchant.hesbstaging.com/home/dashboard

---

## Phase 1: Credentials & Setup ⏳

### 1.1 Gather Hesabe Sandbox Credentials

- [ ] Merchant Code / Access Code
- [ ] Secret Key
- [ ] IV Key (Initialization Vector)
- [ ] API Endpoint (should be staging URL)

**Where to find:** Usually in Dashboard → API Settings / Integration / Developer section

### 1.2 Set Up Firebase Functions

- [ ] Check if Firebase Functions is enabled in Firebase Console
- [ ] Create `functions` directory in project root
- [ ] Initialize Firebase Functions (`firebase init functions`)
- [ ] Install required dependencies (crypto-js, axios)

---

## Phase 2: Backend Implementation (Cloud Functions) ⏳

### 2.1 Create Encryption Helper

- [ ] Create `functions/src/utils/hesabeEncryption.ts`
- [ ] Implement AES-256-CBC encryption matching Hesabe's requirements
- [ ] Implement decryption for response handling

### 2.2 Create Payment Initiation Function

- [ ] Create `functions/src/index.ts` with `initiateHesabePayment`
- [ ] Validate input (orderId, amount, customer info)
- [ ] Build Hesabe payment payload
- [ ] Encrypt payload
- [ ] Call Hesabe `/checkout` API
- [ ] Decrypt response and return payment URL

### 2.3 Create Payment Verification Function

- [ ] Create `verifyHesabePayment` function
- [ ] Decrypt callback data from Hesabe
- [ ] Verify payment status
- [ ] Return structured response to frontend

### 2.4 Deploy Functions

- [ ] Test functions locally with Firebase emulator
- [ ] Deploy to Firebase (`firebase deploy --only functions`)
- [ ] Verify functions are accessible

---

## Phase 3: Frontend Integration (Menu App) ⏳

### 3.1 Install Firebase Functions SDK

- [ ] Add `firebase/functions` to menu app if not already there
- [ ] Configure functions in Firebase config

### 3.2 Update Order Hook

- [ ] Modify `useOrder.ts` to handle Hesabe payment method
- [ ] Call `initiateHesabePayment` Cloud Function
- [ ] Handle loading states
- [ ] Redirect to Hesabe payment URL

### 3.3 Create Payment Callback Page

- [ ] Create `/payment-callback` route
- [ ] Parse Hesabe response from URL params
- [ ] Call `verifyHesabePayment` to verify
- [ ] Show success/failure message
- [ ] Update order status in Firestore

### 3.4 Create Payment Failed Page

- [ ] Create `/payment-failed` route
- [ ] Show user-friendly error message
- [ ] Allow user to retry or go back to cart

---

## Phase 4: Testing & Validation ⏳

### 4.1 Test with Hesabe Sandbox

- [ ] Use test card numbers from Hesabe docs
- [ ] Test successful payment flow
- [ ] Test failed payment flow
- [ ] Test callback handling
- [ ] Verify order appears in Management App

### 4.2 Error Handling

- [ ] Test network failures
- [ ] Test invalid card details
- [ ] Test timeout scenarios
- [ ] Ensure proper error messages to user

### 4.3 Security Checks

- [ ] Ensure secret keys are NEVER in frontend code
- [ ] Verify all functions use Cloud Functions (not client-side)
- [ ] Check that Firebase Rules protect order data
- [ ] Validate amounts server-side (prevent tampering)

---

## Phase 5: Documentation & Deployment ✅

### 5.1 Documentation

- [ ] Document the payment flow
- [ ] Create troubleshooting guide
- [ ] Document test card numbers
- [ ] Add environment variables guide

### 5.2 Production Preparation

- [ ] Replace sandbox URLs with production URLs
- [ ] Update credentials to production keys
- [ ] Test end-to-end in production
- [ ] Monitor first real transactions

---

## Key Hesabe API Endpoints

### Sandbox (Staging)

- **Checkout API:** `https://api.hesabe.com/checkout` (verify exact URL in docs)
- **Payment Page:** Returned by API after checkout call

### Production

- To be confirmed when going live

---

## Notes & Discoveries

_(Add notes as you discover things during implementation)_

-

---

## Helpful Resources

- [Hesabe Developer Docs](https://developer.hesabe.com/)
- Merchant Dashboard: https://merchant.hesbstaging.com/home/dashboard
- Firebase Functions Docs: https://firebase.google.com/docs/functions
