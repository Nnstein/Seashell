# Room Service Breakfast Menu - Seeding Instructions

## Overview
This script populates the Firestore database with the complete Room Service breakfast menu (12 items) with bilingual support (English/Arabic).

## Special Features

### Seashell & Mediterranean Breakfasts
These two items have a **special addon structure** that allows guests to choose:
- **Beverage**: Tea OR Coffee (choose one)
- **Egg Style**: Scrambled, Fried, or Omelette (choose one)

**For multiple servings**: Guests can specify preferences in the special instructions box.

### Standard Breakfast Items
The remaining 10 items follow the standard menu structure without special addons.

## Items Included

| Item | Price (KD) | Image | Special Addons |
|------|-----------|-------|----------------|
| Seashell Breakfast | 6.000 | bk-1.jpg | ✅ Tea/Coffee + Egg Style |
| Mediterranean Breakfast | 5.500 | bk-2.jpg | ✅ Tea/Coffee + Egg Style |
| Eggs | 2.000 | bk-3.jpg | ❌ |
| Cheese Plate | 3.000 | bk-4.jpg | ❌ |
| Pastry Basket | 2.750 | bk-5.jpg | ❌ |
| Bread - Baguette | 1.100 | bk-6.jpg | ❌ |
| Bread - Multi Cereal | 1.250 | bk-7.jpg | ❌ |
| Bread - Kraft Corn | 1.250 | bk-8.jpg | ❌ |
| Bread - Country Loaf | 1.250 | bk-9.jpg | ❌ |
| Pancakes & Waffles | 3.500 | bk-10.jpg | ❌ |
| Cereal | 1.750 | bk-11.jpg | ❌ |
| Fresh Fruits | 1.500 | bk-12.jpg | ❌ |

## Setup Instructions

### 1. Update Firebase Config
Edit `seed-breakfast-menu.js` and replace the placeholder config with your actual Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "seashell-meal-menu",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

You can find these in:
- Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

### 2. Install Dependencies
```bash
npm install firebase
```

### 3. Run the Script
```bash
node seed-breakfast-menu.js
```

## What the Script Does

1. ✅ Sets `activeMenu` to `'room-service'` in global settings
2. ✅ Adds 12 breakfast items to `menu_items` collection
3. ✅ Tags all items with `menu: 'room-service'`
4. ✅ Uses existing breakfast images (bk-1.jpg through bk-12.jpg)
5. ✅ Includes bilingual names and descriptions (EN/AR)
6. ✅ Sets availability note: "06:30–11:00"
7. ✅ Adds special addons for Seashell & Mediterranean breakfasts

## Verification

After running the script, verify in:

### Firestore Console
- Collection: `menu_items`
- Filter: `menu == room-service`
- Should see 12 breakfast items

### Management App
- Menu Editor → Room Service Menu
- Should see all 12 breakfast items
- Seashell & Mediterranean should have addon options

### Menu App (Guest View)
- Guests will see all 12 items
- Clicking Seashell/Mediterranean shows addon selection
- Other items show standard order flow

## Notes

- **Backward Compatibility**: Items without `menu` field default to `room-service`
- **Images**: All images already exist in `public/assets/images/items/`
- **Pricing**: All prices in Kuwait Dinar (KD) with 3 decimal places
- **Availability**: All items available 06:30–11:00
- **Season**: All items tagged for Summer season

## Next Steps

After breakfast is seeded, you can:
1. Add more categories (Appetizers, Main Course, etc.)
2. Create Presto menu items (tag with `menu: 'presto'`)
3. Toggle between menus in Management App
4. Test guest ordering flow
