# Notification System Update

## Changes Made

### 1. **New Notification Sound**
- Copied `new order notification.mp3` from Menu App to Management App
- Location: `Seashell-Management-App/public/notification/new-order-notification.mp3`

### 2. **Updated Notification Utilities** (`utils/notifications.ts`)
- Replaced Web Audio API beep with MP3 file playback
- Added looping functionality for both sound and vibration
- New functions:
  - `startNotificationLoop()` - Starts continuous notification
  - `stopNotificationLoop()` - Stops all notifications
  - `startVibrationLoop()` - Vibrates every 3 seconds
  - `stopVibrationLoop()` - Stops vibration

### 3. **Updated Notification Hook** (`hooks/useOrderNotifications.ts`)
- Changed from monitoring "new orders" to monitoring "pending orders"
- Notification loop starts when there are pending orders
- Notification loop stops only when ALL pending orders are moved to next stage
- Uses Firestore query: `where('status', '==', 'pending')`

## How It Works

1. **On App Load**: Checks for pending orders
   - If pending orders exist → Start notification loop
   - If no pending orders → No notification

2. **When New Order Arrives**: 
   - Notification loop starts/continues

3. **When Order Status Changes**:
   - If order moves from "pending" to "preparing" → Check remaining pending orders
   - If no more pending orders → Stop notification loop
   - If still pending orders → Continue loop

4. **Notification Loop Behavior**:
   - **Sound**: Plays continuously on loop
   - **Vibration**: Triggers every 3 seconds (200ms-100ms-200ms pattern)

## User Control

- Notifications can be toggled ON/OFF via the Dashboard button
- When toggled OFF, all loops stop immediately
- Notification preference is saved in localStorage

## Testing

To test the system:
1. Enable notifications in the Dashboard
2. Place an order from the Menu App
3. Notification should start looping
4. Move the order to "Preparing" status
5. Notification should stop (if no other pending orders)
