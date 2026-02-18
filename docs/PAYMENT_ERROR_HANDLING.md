# Payment Error Handling Guide

## Overview

This document describes the error handling implemented for the Hesabe payment integration in the Seashell Menu App.

## Error Scenarios Handled

### 1. Payment Gateway Errors

| Error Code           | User Message                                                             | Can Retry |
| -------------------- | ------------------------------------------------------------------------ | --------- |
| `CANCELLED`          | "You cancelled the payment. Your cart items are still saved."            | ✅ Yes    |
| `DECLINED`           | "Your card was declined. Please try a different card or payment method." | ✅ Yes    |
| `INSUFFICIENT_FUNDS` | "Your card has insufficient funds. Please try a different card."         | ✅ Yes    |
| `EXPIRED_CARD`       | "Your card has expired. Please use a valid card."                        | ✅ Yes    |
| `INVALID_CARD`       | "The card details are invalid. Please check and try again."              | ✅ Yes    |
| `TIMEOUT`            | "The payment session timed out. Please try again."                       | ✅ Yes    |
| `PAYMENT_FAILED`     | "The payment could not be completed. Please try again."                  | ✅ Yes    |

### 2. System Errors

| Error Code         | User Message                                                                                                | Can Retry |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | --------- |
| `DECRYPT_ERROR`    | "There was an error processing the payment response. Please contact reception."                             | ❌ No     |
| `SYSTEM_ERROR`     | "A system error occurred. Please contact reception for assistance."                                         | ❌ No     |
| `FIREBASE_ERROR`   | "Payment successful but order could not be saved. Please contact reception with your payment confirmation." | ❌ No     |
| `NO_PENDING_ORDER` | "Your order session has expired. Please add items to your cart and try again."                              | ❌ No     |

## User Flow on Error

### Retryable Errors

1. Error screen shows with amber warning icon
2. "Try Again" button prominently displayed
3. "Return to Menu" as secondary option
4. Cart items preserved in localStorage
5. When user returns to menu, cart is automatically restored

### Non-Retryable Errors

1. Error screen shows with red error icon
2. "Contact Reception" button displayed
3. Cart items still preserved (in case staff can help)
4. Clear instruction to seek assistance

## Cart Preservation

When a payment fails:

1. The `pending_order` is kept in localStorage
2. The `useCart` hook checks for `pending_order` on mount
3. If found (and not on payment-callback page), cart is restored
4. User sees their items ready to checkout again

## Stale Order Detection

Orders older than 2 hours are considered stale and automatically cleared:

- Prevents confusion from old abandoned orders
- User is prompted to re-add items

## Double-Click Protection

The checkout button is disabled after the first click:

- `isPlacingOrder` state prevents multiple submissions
- Button shows loading spinner during processing

## Backend Changes

### Success Callback (`/payment/success`)

- Decrypts Hesabe response
- Redirects to menu app with success data

### Failure Callback (`/payment/failure`)

- Extracts error code from Hesabe response
- Redirects to menu app with error details
- Logs failure for debugging

## Testing Checklist

- [ ] Cancel payment at Hesabe page → Cart restored
- [ ] Use invalid card → Error shown, retry available
- [ ] Close browser during payment → Cart restored on return
- [ ] Successful payment → Order placed, cart cleared
- [ ] Network error during checkout → Error shown
- [ ] Backend down → Friendly error message
- [ ] Double-click Pay button → Only one submission
