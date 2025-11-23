export type Language = 'en' | 'ar';

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface MenuItem {
  id: string;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  category: string;
  image?: string;
}

export interface Theme {
  textColor: string;
  accentColor: string; // Tailwind class reference or hex
}

export interface Category {
  id: string;
  name: LocalizedString;
  image: string;
  video: string; // Background video URL
  theme: Theme;
  items: MenuItem[];
}

export interface CartItem extends MenuItem {
  cartId: string; // Unique ID for the instance in cart
  quantity: number;
  notes?: string;
}

export type ViewState = 'HOME' | 'MENU' | 'CONFIRMATION';