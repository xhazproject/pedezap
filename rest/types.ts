export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isFeatured?: boolean;
  isInCampaign?: boolean;
  isPizza?: boolean;
  kind?: 'padrao' | 'pizza' | 'bebida' | 'acai';
  pizzaFlavors?: PizzaFlavor[];
  pizzaCrusts?: PizzaCrust[];
  complements?: ProductComplement[];
  acaiComplementGroups?: AcaiComplementGroup[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  productIds?: string[];
  campaignId?: string;
  couponCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export interface Restaurant {
  slug?: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
  whatsappNumber: string;
  isOpen: boolean;
  openingHours: string;
  address: string;
  city: string;
  state: string;
  taxId?: string | null;
  minOrderValue: number;
  deliveryFee: number;
  coupons?: RestaurantCoupon[];
}

export interface RestaurantCoupon {
  id: string;
  code: string;
  uses: number;
  active: boolean;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

// Auxiliar types for Pizza
export interface PizzaFlavor {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

export interface PizzaCrust {
  id: string;
  name: string;
  price: number;
}

export interface ProductComplement {
  id: string;
  name: string;
  price: number;
}

export interface AcaiComplementItem {
  id: string;
  name: string;
  price: number;
  maxQty: number;
}

export interface AcaiComplementGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  items: AcaiComplementItem[];
}

export interface SelectedAcaiOption {
  groupId: string;
  groupName: string;
  items: Array<AcaiComplementItem & { quantity: number }>;
}

export interface CartItem extends Product {
  cartId: string; // Unique ID for the item in the cart (to separate customizations)
  quantity: number;
  notes: string;
  // Customization fields
  selectedFlavors?: PizzaFlavor[];
  selectedCrust?: PizzaCrust;
  selectedComplements?: ProductComplement[];
  selectedAcaiOptions?: SelectedAcaiOption[];
}

export interface CustomerData {
  name: string;
  phone: string;
  email?: string;
  address: string;
  reference?: string;
  paymentMethod: 'credit' | 'debit' | 'money' | 'pix';
  changeFor?: string;
}

export interface Order {
  customer: CustomerData;
  items: CartItem[];
  total: number;
  subtotal: number;
  deliveryFee: number;
  generalNotes?: string;
}
