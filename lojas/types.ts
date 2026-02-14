export interface Store {
  id: string;
  name: string;
  category: string;
  rating: number;
  deliveryTime: string; // e.g., "30-40 min"
  deliveryFee: number; // 0 for free
  imageUrl: string;
  logoUrl: string;
  isOpen: boolean;
  city: string; // New field for filtering
  storeUrl: string; // New field for redirection
}

export interface Category {
  id: string;
  name: string;
  iconName: string; // mapping to a Lucide icon or emoji
}

export interface City {
  id: string;
  name: string;
  state: string;
}