export enum PaymentMethod {
  CASH = 'Dinheiro',
  CARD = 'Cartão',
  PIX = 'PIX'
}

export enum OrderStatus {
  RECEIVED = 'recebido',
  PREPARING = 'em preparo',
  COMPLETED = 'concluído',
  CANCELLED = 'cancelado'
}

export enum PlanType {
  LOCAL = 'Local',
  LOCAL_ONLINE = 'Local + Online'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  active: boolean;
  order: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  active: boolean;
  order: number;
}

export interface RestaurantSettings {
  name: string;
  slug: string; // for url
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
  openingHours: string;
  footerText: string;
  isOpen: boolean;
}

export interface OrderSettings {
  acceptingOrders: boolean;
  minOrderValue: number;
  deliveryFee: number;
  estimatedTime: string; // e.g., "40-50 min"
  pixInstructions: string;
  paymentMethods: PaymentMethod[];
  autoMessage: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  date: string; // ISO string
  customerName: string;
  customerPhone: string;
  total: number;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  status: OrderStatus;
}