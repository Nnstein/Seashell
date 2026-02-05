# Kitchen Capacity Management Feature

## Overview

This feature implements an intelligent kitchen capacity management system that:

1. Automatically calculates preparation times based on pending orders
2. Allows managers to temporarily close the menu when capacity is exceeded
3. Provides guests with accurate delivery time expectations
4. Prevents kitchen overwhelm and maintains service quality

## Key Features

### 1. **Dynamic Preparation Time Calculation**

- **First Order**: 30 minutes delivery time
- **Additional Orders**: +10 minutes per pending order
- **Example**:
  - 0 pending orders = 30 min
  - 1 pending order = 40 min
  - 2 pending orders = 50 min
  - etc.

### 2. **Kitchen Capacity Limits**

- **Max Pending Orders**: 10
- **Reopen Threshold**: 6 or fewer pending orders
- **Manager Control**: Admin can manually toggle menu open/closed

### 3. **Guest Experience**

#### Menu Open:

- Guests can browse and place orders normally
- Upon order confirmation, they see expected preparation time (e.g., "40 minutes")

#### Menu Closed:

- Guests see a friendly message:
  > "Temporarily closed due to high volume of orders at the moment. Please try again after an hour."
- Prevents new orders from overwhelming the kitchen

### 4. **Manager Dashboard Features**

- **Pending Orders Counter**: Real-time count of active orders (pending, preparing, ready)
- **Menu Toggle Button**:
  - Green "OPEN" button with pending count
  - Red "CLOSED" button when menu is closed
  - Disabled when at capacity limits (10+ orders for open, >6 for closed)
  - Shows warning icon (⚠️) when approaching capacity
- **Auto-Update**: Refreshes count whenever orders change status

## Implementation Details

### Database Changes

**MenuSettings Collection** (`settings/global_settings`):

```typescript
{
  id: 'global_settings',
  activeSeason: 'Summer' | 'Winter',
  activeMenu: 'presto' | 'room-service',
  menuOpen: boolean  // NEW: Tracks if menu accepts orders
}
```

**Order Collection** (added field):

```typescript
{
  ...existing fields,
  expectedPreparationTime: number  // Minutes shown to guest
}
```

### Key Functions

#### Menu App (`apps/menu-app`):

1. **`getPendingOrdersCount()`** - Counts orders with status: pending, preparing, or ready
2. **`calculatePreparationTime(pendingCount)`** - Returns 30 + (pendingCount \* 10)
3. **`placeOrder()`** - Updated to calculate and store preparation time
4. **Menu Status Check** - App.tsx checks every 30 seconds if menu is open

#### Management App (`apps/management-app`):

1. **`getPendingOrdersCount()`** - Same as menu app
2. **`setMenuStatus(isOpen)`** - Toggles menu open/closed in Firestore
3. **Dashboard UI** - Shows pending count and toggle button

### Workflow

1. **Guest Places Order**:

   ```
   Guest adds items → Clicks checkout
   → System counts pending orders (e.g., 2)
   → Calculates time: 30 + (2 × 10) = 50 min
   → Order placed with expectedPreparationTime: 50
   → Confirmation screen shows "50 minutes"
   ```

2. **Manager Monitors Kitchen**:

   ```
   Dashboard shows: "Menu OPEN  [7]"
   → 7 orders currently being processed
   → Warning icon appears (approaching limit)
   ```

3. **Manager Closes Menu** (at 10+ orders):

   ```
   Manager clicks "CLOSE" button
   → menuOpen set to false in Firestore
   → New guests see "Temporarily Closed" message
   → Existing orders continue processing
   ```

4. **Manager Reopens Menu** (at ≤6 orders):
   ```
   Orders completed, count drops to 6
   → Manager clicks "OPEN" button
   → menuOpen set to true
   → Guests can order again
   ```

## UI/UX Highlights

### Guest Confirmation Screen

- Beautiful gradient card showing preparation time
- **English**: "Expected Preparation Time: 50 minutes"
- **Arabic**: "الوقت المقدر للتحضير: 50 دقيقة"
- Prominent golden/orange styling

### Manager Dashboard Button

- **While Open (< 10 orders)**:
  - Green background
  - Shows "Menu OPEN [count]"
  - Enables toggle to close

- **While Open (= 10 orders)**:
  - Green background with warning icon ⚠️
  - Button disabled (can't close manually - must wait for orders to complete)
  - Tooltip: "Menu will auto-close at 10+ pending orders"

- **While Closed (> 6 orders)**:
  - Red background
  - Shows "Menu CLOSED [count]"
  - Button disabled (can't reopen yet)
  - Tooltip: "Menu can reopen when pending orders ≤ 6"

- **While Closed (≤ 6 orders)**:
  - Red background
  - Enables toggle to reopen

### Guest Closed Screen

- Full-page centered layout
- Amber/orange color scheme
- Clock icon
- Bilingual messaging
- Auto-refreshes every 30 seconds to check if reopened

## Benefits

1. **Kitchen Efficiency**: Prevents order backlog and maintains quality
2. **Guest Satisfaction**: Clear expectations with accurate delivery times
3. **Staff Control**: Managers can manually intervene when needed
4. **Automatic Management**: System helps guide when to open/close
5. **Fair Service**: First-come-first-served with transparent wait times

## Testing Scenarios

### Scenario 1: Normal Operations

- 3 pending orders → Guest sees "50 minutes" → Order accepted

### Scenario 2: High Volume

- 10 pending orders → Manager closes menu → New guest sees "Temporarily Closed"

### Scenario 3: Recovery

- Orders complete → Count drops to 5 → Manager reopens → Service resumes

## Future Enhancements (Optional)

- Auto-close at 10 orders (no manual click needed)
- Auto-reopen at 6 orders
- SMS/push notifications to guests when menu reopens
- Historical analytics of peak times
- Dynamic time calculation based on order complexity
