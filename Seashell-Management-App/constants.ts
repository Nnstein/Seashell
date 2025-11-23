import { MenuItem, Order } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Seared Scallops',
    description: 'Pan-seared atlantic scallops served with a lemon butter sauce and microgreens.',
    price: 24,
    category: 'Starters',
    image: 'https://picsum.photos/400/300?random=1',
    available: true,
  },
  {
    id: '2',
    name: 'Lobster Thermidor',
    description: 'Fresh lobster meat cooked in a rich wine sauce, stuffed back into the shell and browned.',
    price: 58,
    category: 'Mains',
    image: 'https://picsum.photos/400/300?random=2',
    available: true,
  },
  {
    id: '3',
    name: 'Truffle Mushroom Risotto',
    description: 'Creamy arborio rice with wild mushrooms, parmesan, and shaved black truffle.',
    price: 32,
    category: 'Mains',
    image: 'https://picsum.photos/400/300?random=3',
    available: true,
  },
  {
    id: '4',
    name: 'Coconut Panna Cotta',
    description: 'Silky coconut cream set with agar, topped with mango coulis and toasted flakes.',
    price: 14,
    category: 'Desserts',
    image: 'https://picsum.photos/400/300?random=4',
    available: true,
  },
  {
    id: '5',
    name: 'Signature Mojito',
    description: 'White rum, sugar, lime juice, soda water, and fresh mint.',
    price: 16,
    category: 'Drinks',
    image: 'https://picsum.photos/400/300?random=5',
    available: true,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-123',
    guestName: 'Mr. Thompson',
    roomNumber: '104',
    items: [
      { menuItemId: '1', name: 'Seared Scallops', quantity: 1, price: 24 },
      { menuItemId: '2', name: 'Lobster Thermidor', quantity: 1, price: 58 },
    ],
    status: 'RECEIVED',
    total: 82,
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    notes: 'Allergy: Peanuts',
  },
  {
    id: 'ord-124',
    guestName: 'Sarah Jenks',
    roomNumber: '201',
    items: [
      { menuItemId: '5', name: 'Signature Mojito', quantity: 2, price: 16 },
    ],
    status: 'PREPARING',
    total: 32,
    timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
  },
  {
    id: 'ord-125',
    guestName: 'Family Room',
    roomNumber: 'Villa 3',
    items: [
      { menuItemId: '3', name: 'Truffle Mushroom Risotto', quantity: 2, price: 32 },
      { menuItemId: '4', name: 'Coconut Panna Cotta', quantity: 2, price: 14 },
    ],
    status: 'READY',
    total: 92,
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
  },
];

export const CATEGORIES: string[] = ['Starters', 'Mains', 'Desserts', 'Drinks'];
