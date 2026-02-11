export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Restaurant {
  name: string;
  logoUrl: string;
  coverUrl: string;
  whatsappNumber: string; // Format: 5511999999999
  isOpen: boolean;
  openingHours: string;
  address: string;
  minOrderValue: number;
  deliveryFee: number;
}

export interface CartItem extends Product {
  quantity: number;
  notes: string;
}

export interface CustomerData {
  name: string;
  phone: string;
  address: string;
  reference?: string;
  paymentMethod: 'credit' | 'debit' | 'money' | 'pix';
  changeFor?: string; // For money payment
}

export interface Order {
  customer: CustomerData;
  items: CartItem[];
  total: number;
  subtotal: number;
  deliveryFee: number;
  generalNotes?: string;
}