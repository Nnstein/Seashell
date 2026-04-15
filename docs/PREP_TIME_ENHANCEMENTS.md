# Preparation Time Display Enhancements

## Overview

Enhanced the preparation time display with:

1. **Dynamic, varied messages** - Personalized phrasings instead of just numbers
2. **Pre-payment visibility** - Shows in order drawer before checkout

## 1. Dynamic Preparation Time Messages

### Features:

- **6 different message variations** that rotate based on prep time
- **Proper time formatting**:
  - Under 60 mins: "40 mins"
  - Over 60 mins: "1h 10 mins"
  - Exactly 1 hour: "1 hour"
  - Multiple hours: "2 hours"
- **Bilingual support** (English & Arabic)

### Example Messages:

| Prep Time | English Examples                                                                                                                                                                                                                                            | Arabic Examples                                                                                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 40 mins   | - Your order will be ready within 40 mins<br>- We'll get it ready for you within 40 mins<br>- Estimated delivery time: 40 mins<br>- Your delicious meal arrives in 40 mins<br>- Sit back and relax! Ready in 40 mins<br>- Fresh from our kitchen in 40 mins | - سيكون طلبك جاهزاً خلال 40 دقيقة<br>- سنجهزه لك خلال 40 دقيقة<br>- وقت التوصيل المقدر: 40 دقيقة<br>- وجبتك اللذيذة ستصل خلال 40 دقيقة<br>- استرخِ! جاهز خلال 40 دقيقة<br>- طازج من مطبخنا خلال 40 دقيقة |
| 70 mins   | - Your order will be ready within 1h 10 mins<br>- We'll get it ready for you within 1h 10 mins<br>- etc.                                                                                                                                                    | - سيكون طلبك جاهزاً خلال ساعة و 10 دقيقة<br>- سنجهزه لك خلال ساعة و 10 دقيقة<br>- etc.                                                                                                                   |
| 60 mins   | - Your order will be ready within 1 hour<br>- Your delicious meal arrives in 1 hour<br>- etc.                                                                                                                                                               | - سيكون طلبك جاهزاً خلال ساعة واحدة<br>- وجبتك اللذيذة ستصل خلال ساعة واحدة<br>- etc.                                                                                                                    |

### Message Selection:

- Uses prep time as a **seed for consistency**
- Same prep time always shows the same message variation
- Formula: `messages[prepTime % 6]`
- Ensures consistency per order while varying across different orders

## 2. Order Drawer Preview (Pre-Payment)

### Location:

- Displayed **in the order drawer/cart**
- **Above payment method selection**
- **Before** guest confirms order

### UI Design:

```
┌──────────────────────────────────────┐
│ 🕐 ESTIMATED DELIVERY                │
│    Your order will be ready          │
│    within 40 mins                     │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│ PAYMENT METHOD                        │
│ [ Room Charge ] [ Pay with Card ]    │
└──────────────────────────────────────┘
```

### Visual Styling:

- **Amber/Orange gradient background** (matches confirmation)
- **Clock icon** in circular badge
- **Loading state** while calculating:
  - Shows spinner icon
  - Text: "Calculating..." / "جاري الحساب..."
- **Responsive sizing** for mobile/desktop

### Behavior:

- **Auto-calculates** when cart drawer opens
- **Updates** when cart contents change
- **Real-time** - fetches current pending orders count
- **Cached** until cart changes or drawer closes/reopens

## 3. Implementation Details

### New Utility File:

**`utils/preparationTimeMessages.ts`**

- `formatPrepTime()` - Converts minutes to friendly format
- `getRandomPrepTimeMessage()` - Returns varied message
- `getPrepTimeLabel()` - Returns section label

### Modified Files:

#### ConfirmationScreen.tsx:

```tsx
import {
  getRandomPrepTimeMessage,
  getPrepTimeLabel,
} from "../utils/preparationTimeMessages";

const prepTimeMessage = getRandomPrepTimeMessage(
  expectedPreparationTime,
  language,
);

// Display
<p className="text-2xl md:text-3xl font-bold">{prepTimeMessage[language]}</p>;
```

#### OrderDrawer.tsx:

```tsx
import {
  getPendingOrdersCount,
  calculatePreparationTime,
} from "../services/firestoreService";
import { getRandomPrepTimeMessage } from "../utils/preparationTimeMessages";

// State
const [estimatedPrepTime, setEstimatedPrepTime] = useState<number>(30);
const [loadingPrepTime, setLoadingPrepTime] = useState(false);

// Effect - fetch on open
useEffect(() => {
  const fetchPrepTime = async () => {
    if (cart.length > 0 && isCartOpen) {
      const pendingCount = await getPendingOrdersCount();
      const prepTime = calculatePreparationTime(pendingCount);
      setEstimatedPrepTime(prepTime);
    }
  };
  fetchPrepTime();
}, [cart.length, isCartOpen]);
```

## User Experience Flow

### Before (Original):

1. Guest adds items to cart
2. Opens cart drawer
3. Selects payment method
4. Places order
5. ⚠️ **ONLY NOW sees**: "40 minutes"

### After (Enhanced):

1. Guest adds items to cart
2. Opens cart drawer
3. **✅ IMMEDIATELY sees**: "Your order will be ready within 40 mins"
4. Makes informed decision about payment
5. Places order
6. Confirmation shows: "We'll get it ready for you within 40 mins" (different wording!)

## Benefits

### 1. Transparency

- Guests know delivery time **before** committing
- No surprises after payment

### 2. Better Decision Making

- Guests can decide if they have time to wait
- Reduces potential complaints about wait times

### 3. Personalized Experience

- Varied messages feel more human
- Not robotic "40 minutes" every time

### 4. Professional

- Shows care for guest experience
- Proactive communication

## Examples in Context

### Scenario 1: Quick Service (30 mins)

**Order Drawer:**

> 🕐 ESTIMATED DELIVERY  
> Sit back and relax! Ready in 30 mins

**Confirmation:**

> 🎉 Order Received!  
> Fresh from our kitchen in 30 mins

### Scenario 2: Busy Period (70 mins)

**Order Drawer:**

> 🕐 ESTIMATED DELIVERY  
> Your delicious meal arrives in 1h 10 mins

**Confirmation:**

> 🎉 Order Received!  
> Estimated delivery time: 1h 10 mins

### Scenario 3: Very Busy (2 hours)

**Order Drawer:**

> 🕐 ESTIMATED DELIVERY  
> We'll get it ready for you within 2 hours

**Confirmation:**

> 🎉 Order Received!  
> Your order will be ready within 2 hours

## Technical Notes

- Messages are deterministic (same time = same message) for consistency
- Time formatting handles edge cases (0 mins remainder, single hour, etc.)
- Loading states prevent UI flash
- Bilingual support throughout
- No database schema changes required

## Future Enhancements (Optional)

- Add "Fast delivery!" badge for orders under 30 mins
- Warning message if prep time exceeds 90 mins
- Allow manager to override prep time calculation
- Push notifications when prep time changes
