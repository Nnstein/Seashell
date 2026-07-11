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
    menu: z.enum(['presto', 'room-service', 'seashell']).optional(),
    isAvailable: z.boolean().optional().default(true),
    imageUrl: z.string().optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    createdAt: z.union([
        z.number(),
        z.object({ seconds: z.number(), nanoseconds: z.number() })
    ]).optional().nullable(),
    season: z.enum(['Summer', 'Winter']).optional().nullable(),
    sortOrder: z.number().optional().nullable(),
    sizes: z.array(z.object({
        name: z.string(),
        price: z.number()
    })).optional().nullable(),
    addons: z.array(z.object({
        name: z.string(),
        price: z.number()
    })).optional().nullable(),
    note: z.string().optional().nullable(),
    tags: z.array(z.enum(['spicy', 'vegetarian', 'nuts', 'traditional'])).optional().nullable(),

    // Discount fields (optional - backward compatible)
    discountPrice: z.number().min(0).optional().nullable(),
    discountLabel: z.string().optional().nullable(),
    bundlePricing: z.any().optional().nullable().transform(val => {
        if (Array.isArray(val)) {
            return val.filter(item => 
                typeof item === 'object' && 
                item !== null && 
                typeof item.quantity === 'number' && 
                typeof item.price === 'number'
            );
        }
        return null;
    })
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
    paymentMethod: z.enum(['cash', 'card', 'room-charge', 'hesabe', 'room']).optional(),
    createdAt: z.union([
        z.number(),
        z.object({ seconds: z.number(), nanoseconds: z.number() })
    ]),
    items: z.array(OrderItemSchema),
    chairNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
    menu: z.enum(['presto', 'room-service', 'seashell']).optional(),
    // Order metadata
    expectedPreparationTime: z.number().optional(),
    isVIP: z.boolean().optional(),
    notes: z.string().optional(),
    isLatePayment: z.boolean().optional(),
    // Payment tracking fields written by the backend webhook/callback
    paidAt: z.any().optional(),
    webhookVerified: z.boolean().optional(),
    paymentDetails: z.record(z.string(), z.any()).optional(),
    paymentFailure: z.object({
        errorCode: z.string(),
        errorMessage: z.string()
    }).optional(),
    updatedAt: z.any().optional(),
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
    activeMenu: z.enum(['presto', 'room-service', 'seashell']),
    lastMenuUpdate: z.number().optional(),
    
    // Independent menu statuses
    menuStatus: z.object({
        'room-service': z.object({ isOpen: z.boolean(), closeMessage: z.string().optional() }),
        'presto': z.object({ isOpen: z.boolean(), closeMessage: z.string().optional() }),
        'seashell': z.object({ isOpen: z.boolean(), closeMessage: z.string().optional() }),
    }).optional(),

    // Dynamic categories for each menu
    categories: z.record(z.enum(['room-service', 'presto', 'seashell']), z.array(z.string())).optional(),

    adminEmail: z.string().optional(),
    admin2Email: z.string().optional(),

    // Legacy fields
    menuOpen: z.boolean().optional(),
    closeMessage: z.string().optional()
});

export type MenuSettingsValidated = z.infer<typeof MenuSettingsSchema>;

// ============================================
// LOCATION SECTION SCHEMA
// ============================================
export const LocationSectionSchema = z.object({
    id: z.string(),
    name: z.string(),
    prefix: z.string(),
    ranges: z.array(z.object({
        min: z.number().int(),
        max: z.number().int()
    })).optional(),
    menu: z.enum(['seashell', 'room-service', 'presto']),
    isDefault: z.boolean(),
    padLength: z.number().int().min(0),
    requiresPhone: z.boolean()
});

export type LocationSectionValidated = z.infer<typeof LocationSectionSchema>;

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
