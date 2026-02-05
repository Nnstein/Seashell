# VIP Order Tagging Feature

## Overview

This feature enables managers to identify and tag VIP orders in the management dashboard. Once tagged, the VIP status is visible to all users including kitchen staff, allowing priority handling of important guest orders.

## Business Use Case

- **Manager Knowledge**: Managers have access to the occupant list and know which rooms house VIP guests
- **Order Identification**: When an order comes from a VIP room, managers can tag it appropriately
- **Kitchen Visibility**: Kitchen staff (read-only users) can see VIP orders and prioritize them
- **Better Service**: Ensures premium service for important guests

## Implementation Details

### Database Changes

**Order Interface** (`management-app/src/types.ts`):

```typescript
export interface Order {
  // ... existing fields
  isVIP?: boolean; // VIP status - manager can tag important orders
}
```

### New Functions

**Firestore Service** (`management-app/services/firestoreService.ts`):

```typescript
/**
 * Toggle VIP status on an order
 * Allows managers to mark important orders for priority handling
 */
export const toggleOrderVIP = async (id: string, isVIP: boolean) => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  return await updateDoc(docRef, { isVIP });
};
```

### User Interface

#### For Managers (Admin Role):

**Kanban View (OrderCard)**:

- ⭐ **Clickable Star Icon** next to order number
  - **Inactive**: Gray outline star
  - **Active**: Golden filled star
  - **Tooltip**: "Mark as VIP" / "Remove VIP status"
- **VIP Ribbon**: Golden diagonal ribbon in top-right corner when VIP
  - Text: "VIP"
  - Color: Amber gradient (from-amber-400 to-yellow-500)

**List View (Table)**:

- ⭐ **Star Toggle Button** next to guest name
  - Same inactive/active states
  - Inline with guest name

**Visual Design - Kanban Card**:

```
┌──────────────────────────────────┐
│                          🏷️ VIP │ ← Golden ribbon (if VIP)
│ #A1B2C3  2m ago  ⭐              │ ← Star toggle button
│                                  │
│ John Doe                         │
│ 📍 Room 501                     │
│ 📞 +965 1234 5678               │
│                                  │
│ [Order Items]                    │
│                                  │
│ [Start Cooking Button]           │
└──────────────────────────────────┘
```

#### For Kitchen Staff (Read-Only Role):

**Kanban View**:

- **VIP Ribbon**: Same golden ribbon displayed
- **No Toggle**: Star button not shown (read-only)

**List View**:

- **VIP Badge**: Small amber badge next to name
  - Icon: ⭐ (filled white star)
  - Text: "VIP"
  - Color: bg-amber-500, text-white

## UI States

### VIP Star Button States

| State   | Icon        | Color          | Hover                       |
| ------- | ----------- | -------------- | --------------------------- |
| Not VIP | ☆ (outline) | text-slate-300 | text-amber-400, bg-slate-50 |
| Is VIP  | ★ (filled)  | text-amber-500 | text-amber-600, bg-amber-50 |

### VIP Ribbon (Top-Right Corner)

- **Position**: `absolute top-0 right-0`
- **Rotation**: `rotate-12` (tilted)
- **Color**: `bg-gradient-to-br from-amber-400 to-yellow-500`
- **Shadow**: `shadow-lg`
- **Content**: Star icon + "VIP" text

## Workflow

### Manager Tags VIP Order:

1. Manager sees order from Room 501
2. Manager checks occupant list → confirms VIP guest
3. Manager clicks **star icon** ⭐ on order card
4. Star fills with golden color
5. Golden "VIP" ribbon appears on card
6. Database updated: `isVIP: true`

### Kitchen Staff Sees VIP Order:

1. Order appears in dashboard
2. **Golden VIP ribbon** immediately visible
3. Staff prioritizes this order
4. In list view, sees **VIP badge** next to guest name

### Manager Removes VIP Tag:

1. Manager clicks **filled star** ★
2. Star becomes outline ☆
3. VIP ribbon disappears
4. Database updated: `isVIP: false`

## Code Integration

### Dashboard.tsx

```tsx
// Handler function
const handleToggleVIP = async (orderId: string, currentVIPStatus: boolean) => {
  try {
    await toggleOrderVIP(orderId, !currentVIPStatus);
    // Order updates via real-time listener
  } catch (error) {
    console.error("Error toggling VIP status:", error);
    alert("Failed to toggle VIP status");
  }
};

// Pass to OrderCard
<OrderCard
  order={order}
  onUpdateStatus={onUpdateStatus}
  onToggleVIP={handleToggleVIP} // ← New prop
  userRole={userRole}
/>;
```

### OrderCard.tsx

```tsx
interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onToggleVIP?: (orderId: string, currentVIPStatus: boolean) => void; // ← New
  userRole: "admin" | "kitchen";
}

// In render:
{
  /* VIP Ribbon */
}
{
  order.isVIP && (
    <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-400 to-yellow-500...">
      <Star size={12} fill="white" />
      <span>VIP</span>
    </div>
  );
}

{
  /* VIP Toggle - Admin Only */
}
{
  userRole === "admin" && onToggleVIP && (
    <button onClick={() => onToggleVIP(order.id, order.isVIP || false)}>
      <Star fill={order.isVIP ? "currentColor" : "none"} />
    </button>
  );
}
```

## Benefits

1. **Easy Identification**: Managers can quickly spot VIP orders
2. **Priority Service**: Kitchen knows which orders need special attention
3. **No Backend Logic**: Simple boolean flag, no complex rules
4. **Real-time Updates**: Changes visible immediately to all users
5. **Role-Based Access**:
   - Managers: Can toggle VIP status
   - Kitchen: Can see VIP status (read-only)
6. **Visual Prominence**: Golden ribbon catches attention

## Future Enhancements (Optional)

- **Auto-VIP**: Automatically tag orders from known VIP room numbers
- **VIP List Management**: Upload/maintain VIP room list in settings
- **Notification Priority**: Send VIP order notifications first
- **Analytics**: Track VIP order response times
- **Custom VIP Levels**: Bronze/Silver/Gold tiers
- **Alert System**: Notify manager when VIP order reaches certain status

## Technical Notes

- VIP status stored in Firestore `orders` collection
- Optional field (`isVIP?: boolean`)
- Defaults to `false` if undefined
- Real-time sync via OrdersContext listener
- No migration needed for existing orders
- Backward compatible (old orders without field work fine)

## Testing Scenarios

### Scenario 1: Manager Tags Order as VIP

1. Admin views order from Room 301
2. Clicks gray star → Star turns gold
3. VIP ribbon appears
4. Kitchen staff refreshes → Sees VIP ribbon

### Scenario 2: Kitchen Staff Views VIP

1. Kitchen user logs in
2. Sees order with gold VIP ribbon
3. Cannot click star (read-only)
4. Prioritizes VIP order in queue

### Scenario 3: Manager Removes VIP Tag

1. Order was VIP, now guest checked out
2. Manager clicks gold star
3. Star turns gray, ribbon disappears
4. Order appears normal to all users
