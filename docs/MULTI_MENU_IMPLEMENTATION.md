# Multi-Menu System Implementation

## Overview
Implemented a dual-menu system where the Management App controls which menu (Presto or Room Service) is active for guests.

## Changes Made

### 1. Menu App (`Seashell-Menu-App`)

#### `src/types.ts`
- Added `menu?: 'presto' | 'room-service'` field to `MenuItem` interface
- Added `activeMenu: 'presto' | 'room-service'` field to `MenuSettings` interface

#### `context/AppContext.tsx`
- Updated menu filtering logic to filter by both `activeSeason` AND `activeMenu`
- Backward compatible: Items without `menu` field default to 'presto'
- Default active menu is 'presto' if not set in settings

### 2. Management App (`Seashell-Management-App`)

#### TODO - Next Steps:
1. **Copy updated types.ts** from Menu App to Management App
2. **Update MenuEditor.tsx**:
   - Add menu toggle/selector (Presto ↔ Room Service)
   - Display current active menu prominently
   - Add menu field to item creation/editing forms
   - Filter displayed items by selected menu

3. **Update firestoreService.ts**:
   - Add function to update `activeMenu` in settings
   - Ensure default settings include `activeMenu: 'presto'`

4. **Update Dashboard/OrderCard**:
   - Display which menu an order came from (for tracking)

## Database Structure

### Firestore `settings/global_settings`
```json
{
  "id": "global_settings",
  "activeSeason": "Summer",
  "activeMenu": "presto"
}
```

### Firestore `menu_items/{itemId}`
```json
{
  "name": "Pancakes",
  "menu": "presto",
  "season": "Summer",
  // ... other fields
}
```

## User Flow

1. **Management App**: Staff selects "Presto Menu" or "Room Service Menu"
2. **Firestore**: `activeMenu` setting is updated
3. **Menu App**: Automatically reloads and shows only items from active menu
4. **Guests**: See only the currently active menu (no menu names visible)

## Migration Notes

- Existing menu items without `menu` field will default to 'presto'
- Need to manually tag items as 'room-service' when adding room service menu
- Both menus can coexist in same database with different items
