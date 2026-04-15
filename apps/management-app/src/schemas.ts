import { z } from 'zod';

// ============================================
// MENU ITEM SCHEMA
// ============================================
export const MenuItemSchema = z.object({
    id: z.string().optional(),
    name: z.union([
        z.string(),
        z.object({ en: z.string(), ar: z.string() })
    ]),
    description: z.union([
        z.string(),
        z.object({ en: z.string(), ar: z.string() })
    ]).optional(),
    price: z.number().min(0),
    category: z.string(),
    menuType: z.enum(['All Day', 'Breakfast', 'Lunch', 'Dinner']).optional(),
    menu: z.enum(['presto', 'room-service']).optional(),
    isAvailable: z.boolean().optional().default(true),
    imageUrl: z.string().optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    createdAt: z.union([
        z.number(),
        z.object({ seconds: z.number(), nanoseconds: z.number() })
    ]).optional(),
    season: z.enum(['Summer', 'Winter']).optional(),
    sizes: z.array(z.object({
        name: z.string(),
        price: z.number()
    })).optional(),
    addons: z.array(z.object({
        name: z.string(),
        price: z.number()
    })).optional(),
    note: z.string().optional(),
    tags: z.array(z.enum(['spicy', 'vegetarian', 'nuts', 'traditional'])).optional(),

    // Discount fields (optional - backward compatible)
    discountPrice: z.number().min(0).optional(),
    discountLabel: z.string().optional(),
    bundlePricing: z.array(z.object({
        quantity: z.number().int().min(2),
        price: z.number().min(0),
        label: z.string().optional()
    })).optional()
});

export type MenuItemValidated = z.infer<typeof MenuItemSchema>;

// ============================================
// ORDER ITEM SCHEMA
// ============================================
export const OrderItemSchema = z.object({
    itemId: z.string(),
    name: z.union([
        z.string(),
        z.object({ en: z.string(), ar: z.string() })
    ]),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    selectedSize: z.string().optional(),
    selectedAddons: z.array(z.string()).optional(),
    specialInstructions: z.string().optional()
});

// ============================================
// ORDER SCHEMA
// ============================================
export const OrderStatusSchema = z.enum([
    'pending', 'preparing', 'ready', 'delivered', 'cancelled', 'completed'
]);

export const OrderSchema = z.object({
    id: z.string(),
    roomNumber: z.string(),
    guestName: z.string().optional(),
    guestId: z.string().optional(),
    status: OrderStatusSchema,
    totalAmount: z.number().min(0),
    paymentMethod: z.enum(['cash', 'card', 'room-charge', 'hesabe']).optional(),
    createdAt: z.union([
        z.number(),
        z.object({ seconds: z.number(), nanoseconds: z.number() })
    ]),
    items: z.array(OrderItemSchema),
    chairNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
    menu: z.enum(['presto', 'room-service']).optional()
});

export type OrderValidated = z.infer<typeof OrderSchema>;

// ============================================
// GUEST SCHEMA
// ============================================
export const GuestSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    roomNumber: z.string(),
    phoneNumber: z.string(),
    isActive: z.boolean(),
    checkInDate: z.any(), // Firestore Timestamp
    checkOutDate: z.any()  // Firestore Timestamp
});

export type GuestValidated = z.infer<typeof GuestSchema>;

// ============================================
// MENU SETTINGS SCHEMA
// ============================================
export const MenuSettingsSchema = z.object({
    id: z.string(),
    activeSeason: z.enum(['Summer', 'Winter']),
    activeMenu: z.enum(['presto', 'room-service'])
});

export type MenuSettingsValidated = z.infer<typeof MenuSettingsSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Safely parse data with a Zod schema, returning null on failure
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    console.warn('Zod validation failed:', result.error.format());
    return null;
}

/**
 * Parse data with a Zod schema, using defaults for missing optional fields
 */
export function parseWithDefaults<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}
