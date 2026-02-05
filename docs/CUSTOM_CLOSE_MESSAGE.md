# Custom Menu Close Message Feature

## Overview

This feature allows managers to provide custom, personalized closure messages when temporarily disabling the menu. Instead of showing a fixed generic message, managers can explain the specific reason for closure (e.g., "high volume of orders", "kitchen maintenance", "special event", etc.).

## Business Need

- **Flexibility**: Different closure reasons require different messaging
- **Transparency**: Guests appreciate knowing the specific reason
- **Professionalism**: Custom messages show attention to detail
- **Manager Control**: Each closure situation can be handled uniquely

## User Experience

### For Managers (Management App):

**1. Closing the Menu:**

1. Manager clicks the **Door/Close button** on Dashboard
2. **Modal popup appears** with:
   - Title: "Close Menu - Custom Message"
   - Large text area (500 char limit)
   - Default suggestion: "Due to high volume of orders, we can no longer accept any new order. Please try again in 1 hour."
   - Live character counter
   - Preview section showing how message will appear
3. Manager edits the message to match the situation
4. Manager clicks **"Publish & Close Menu"**
5. Menu closes instantly with custom message saved

**2. Reopening the Menu:**

1. Manager clicks the **Door/Open button**
2. Menu reopens immediately (no modal needed)

### For Guests (Menu App):

**Guest Journey:**

1. Guest opens menu website
2. Guest enters room number and phone number
3. **Menu loads normally** (shows all items)
4. **Modal overlay appears** on top of menu with:
   - Backdrop (dark blur preventing interaction)
   - Centered card with custom manager message
   - "Temporarily Closed" heading
   - Manager's custom message (prominent display)
   - "Thank you for understanding" footer
5. Guest **cannot interact** with menu behind modal
6. Guest can see menu but cannot add items or checkout

**Visual Experience:**

```
┌────────────────────────────────────────┐
│  [Menu Items - Visible but Disabled]  │
│  ┌──────────────────────────────┐     │
│  │  ╔════════════════════════╗  │     │
│  │  ║   TEMPORARILY CLOSED   ║  │     │  ← Modal Overlay
│  │  ║                        ║  │     │
│  │  ║  🕐                    ║  │     │
│  │  ║                        ║  │     │
│  │  ║  Due to high volume of ║  │     │  ← Custom
│  │  ║  orders, we can no     ║  │     │     Manager
│  │  ║  longer accept any new ║  │     │     Message
│  │  ║  order. Please try     ║  │     │
│  │  ║  again in 1 hour.      ║  │     │
│  │  ║                        ║  │     │
│  │  ║  Thank you for your    ║  │     │
│  │  ║  understanding         ║  │     │
│  │  ╚════════════════════════╝  │     │
│  └──────────────────────────────┘     │
│                                         │
└────────────────────────────────────────┘
    ↑ Menu visible but not clickable
```

## Implementation Details

### Database Schema

**MenuSettings** (Firestore: `settings/global_settings`):

```typescript
interface MenuSettings {
  id: string; // 'global_settings'
  activeSeason: "Summer" | "Winter";
  activeMenu: "presto" | "room-service";
  menuOpen?: boolean; // true = open, false = closed
  closeMessage?: string; // Custom message when closed (NEW)
}
```

### Backend Changes

**1. Updated `setMenuStatus` Function:**

```typescript
// management-app/services/firestoreService.ts

export const setMenuStatus = async (isOpen: boolean, closeMessage?: string) => {
  const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
  const updates: any = { menuOpen: isOpen };

  // If closing and message provided, save it
  if (!isOpen && closeMessage) {
    updates.closeMessage = closeMessage;
  }

  return await updateDoc(docRef, updates);
};
```

**Usage:**

```typescript
// Close menu with custom message
await setMenuStatus(
  false,
  "Due to kitchen maintenance, menu is temporarily unavailable",
);

// Reopen menu (no message needed)
await setMenuStatus(true);
```

### Frontend Components

**1. CloseMenuModal Component** (`management-app/components/CloseMenuModal.tsx`):

- **Purpose**: Allow manager to enter custom close message
- **Features**:
  - Textarea with 500 character limit
  - Character counter
  - Live preview
  - Default suggested message
  - Publish button
  - Cancel button

**Props Interface:**

```typescript
interface CloseMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  isSubmitting: boolean;
}
```

**2. Dashboard Integration:**

```typescript
// State
const [showCloseModal, setShowCloseModal] = useState(false);

// Handler
const handleMenuToggle = () => {
    if (menuIsOpen) {
        setShowCloseModal(true); // Show modal
    } else {
        handleReopenMenu(); // Direct reopen
    }
};

const handleCloseMenuWithMessage = async (message: string) => {
    await setMenuStatus(false, message);
    setMenuIsOpen(false);
    setShowCloseModal(false);
};

// Render
<CloseMenuModal
    isOpen={showCloseModal}
    onClose={() => setShowCloseModal(false)}
    onConfirm={handleCloseMenuWithMessage}
    isSubmitting={isToggling}
/>
```

**3. Menu App Display:**

```typescript
// menu-app/App.tsx

// State
const [menuIsOpen, setMenuIsOpen] = useState(true);
const [closeMessage, setCloseMessage] = useState('');

// Fetch status
useEffect(() => {
    const settings = await getMenuSettings();
    if (settings) {
        setMenuIsOpen(settings.menuOpen ?? true);
        setCloseMessage(settings.closeMessage || '');
    }
}, []);

// Render
{!menuIsOpen && view === 'MENU' && (
    <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />

        {/* Modal with Custom Message */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-amber-50...">
                <Clock size={48} />
                <h2>Temporarily Closed</h2>
                <p>{closeMessage || 'Default fallback message'}</p>
            </div>
        </div>
    </>
)}
```

## Example Use Cases

### Use Case 1: High Volume

**Manager Message:**

> "Due to an exceptionally high volume of orders, we can no longer accept new orders at this time. Please try again in approximately 1 hour. We appreciate your patience!"

### Use Case 2: Kitchen Maintenance

**Manager Message:**

> "Our kitchen is undergoing brief maintenance to ensure the highest quality service. The menu will reopen in 30 minutes. Thank you for your understanding."

### Use Case 3: Special Event

**Manager Message:**

> "We are currently preparing for a special event. Room service will resume at 8:00 PM. For immediate assistance, please contact the front desk at extension 100."

### Use Case 4: Late Night

**Manager Message:**

> "Our kitchen is now closed for the evening. Room service will resume tomorrow at 7:00 AM. For late-night snacks, visit our 24-hour café on the ground floor."

### Use Case 5: Ingredient Shortage

**Manager Message:**

> "We are temporarily out of key ingredients due to unexpected demand. We are working to restock and will reopen the menu within 2 hours. We apologize for the inconvenience."

## Workflow Diagram

```
┌─────────────────────────────────────────────────┐
│  MANAGER WANTS TO CLOSE MENU                    │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Clicks "Close Menu" Button on Dashboard        │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Modal Popup Appears                            │
│  ┌───────────────────────────────────────────┐  │
│  │  "Enter custom close message..."          │  │
│  │  [Textarea with 500 char limit]           │  │
│  │  Preview: [How message will look]         │  │
│  │  [Cancel]  [Publish & Close Menu]         │  │
│  └───────────────────────────────────────────┘  │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Manager Types Custom Message                   │
│  e.g., "High volume, try in 1 hour"             │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Manager Clicks "Publish & Close Menu"          │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Firestore Updated:                             │
│  - menuOpen: false                              │
│  - closeMessage: "High volume, try in 1 hour"   │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Guest Opens Menu App                           │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Guest Enters Room Number & Phone               │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Menu Loads (Items Visible)                     │
│  + Modal Overlay Appears                        │
│  ┌──────────────────────────────────────┐       │
│  │  ⏰  Temporarily Closed              │       │
│  │                                       │       │
│  │  "High volume, try in 1 hour"        │  ← Custom Message
│  │                                       │       │
│  │  Thank you for understanding          │       │
│  └──────────────────────────────────────┘       │
│  [Background Menu - Not Clickable]              │
└─────────────────────────────────────────────────┘
```

## Technical Features

### Modal Features:

- **Character Limit**: 500 characters (prevents excessive text)
- **Live Preview**: Shows how message will appear to guests
- **Character Counter**: Real-time count display
- **Default Suggestion**: Pre-filled common message
- **Whitespace Handling**: Trims leading/trailing spaces
- **Multi-line Support**: `whitespace-pre-wrap` preserves line breaks

### Guest Modal Overlay:

- **Z-Index**: 50 (above all menu content)
- **Backdrop**: Black 70% opacity with blur
- **Prevents Interaction**: Click events blocked
- **Responsive**: Works on mobile, tablet, desktop
- **RTL Support**: Proper text direction for Arabic
- **Animation**: Zoom-in effect on appearance

### Real-Time Sync:

- Menu status checked every 30 seconds
- Custom message fetched with status
- Immediate update when manager changes message
- No page refresh needed

## Benefits

1. **Manager Flexibility**: Can adapt message to any situation
2. **Guest Clarity**: Always know the specific reason for closure
3. **Professional Image**: Custom messages show attention to detail
4. **Reduced Frustration**: Specific information reduces guest confusion
5. **Better Communication**: Clear timelines and expectations
6. **Easy Updates**: Manager can change message anytime

## Edge Cases Handled

1. **No Message Provided**: Falls back to default generic message
2. **Very Long Message**: Character limit prevents overflow
3. **Empty Message**: Submit button disabled if empty
4. **Network Failure**: Error handling with user notification
5. **Concurrent Changes**: Last write wins (Firestore default)
6. **Legacy Orders**: Backward compatible (closeMessage is optional)

## Future Enhancements (Optional)

- **Message Templates**: Pre-defined common messages
- **Multi-language**: Auto-translate to Arabic
- **Scheduled Closure**: Set future close time with message
- **History**: Track previous close messages
- **Guest Notifications**: Push notification when reopening
- **Analytics**: Track closure frequency and messages

## Testing Checklist

- [ ] Manager can open close menu modal
- [ ] Default message appears in textarea
- [ ] Character counter works correctly
- [ ] Preview updates as manager types
- [ ] Submit disabled when message empty
- [ ] Message saves to Firestore correctly
- [ ] Menu closes after submission
- [ ] Modal closes after submission
- [ ] Guest sees custom message in overlay
- [ ] Guest cannot interact with menu when closed
- [ ] Reopen works without message
- [ ] Real-time sync updates both apps
- [ ] Works on mobile, tablet, desktop
- [ ] RTL support works properly
- [ ] Line breaks preserved in message
