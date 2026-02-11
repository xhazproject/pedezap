import { Category, Order, OrderSettings, OrderStatus, PaymentMethod, PlanType, Product, RestaurantSettings } from '../types';

// Initial Mock Data
let categories: Category[] = [
  { id: '1', name: 'Lanches', active: true, order: 1 },
  { id: '2', name: 'Bebidas', active: true, order: 2 },
  { id: '3', name: 'Sobremesas', active: true, order: 3 },
];

let products: Product[] = [
  { id: '101', categoryId: '1', name: 'X-Tudo', description: 'Pão, carne, queijo, presunto, ovo, bacon, salada.', price: 25.90, active: true, order: 1, image: 'https://picsum.photos/200/200?random=1' },
  { id: '102', categoryId: '1', name: 'X-Salada', description: 'Pão, carne, queijo, salada e maionese.', price: 18.50, active: true, order: 2, image: 'https://picsum.photos/200/200?random=2' },
  { id: '201', categoryId: '2', name: 'Coca-Cola 350ml', description: 'Lata gelada', price: 6.00, active: true, order: 1, image: 'https://picsum.photos/200/200?random=3' },
];

let restaurantSettings: RestaurantSettings = {
  name: 'Burger Kingo',
  slug: 'burger-kingo',
  whatsapp: '11999999999',
  address: 'Av. Paulista, 1000',
  city: 'São Paulo',
  state: 'SP',
  openingHours: '18:00 às 23:00',
  footerText: 'Feito com amor.',
  isOpen: true,
  logo: 'https://picsum.photos/100/100?random=logo'
};

let orderSettings: OrderSettings = {
  acceptingOrders: true,
  minOrderValue: 15.00,
  deliveryFee: 5.00,
  estimatedTime: '40-60 min',
  pixInstructions: 'Chave PIX: cnpj@loja.com. Envie o comprovante.',
  paymentMethods: [PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.CARD],
  autoMessage: 'Olá! Gostaria de fazer um pedido.'
};

let orders: Order[] = [
  {
    id: '#1234',
    date: new Date().toISOString(),
    customerName: 'João Silva',
    customerPhone: '11988887777',
    total: 31.90,
    paymentMethod: PaymentMethod.PIX,
    status: OrderStatus.RECEIVED,
    items: [
      { productId: '101', productName: 'X-Tudo', price: 25.90, quantity: 1, total: 25.90 },
      { productId: '201', productName: 'Coca-Cola', price: 6.00, quantity: 1, total: 6.00 }
    ]
  },
  {
    id: '#1233',
    date: new Date(Date.now() - 86400000).toISOString(),
    customerName: 'Maria Oliveira',
    customerPhone: '11977776666',
    total: 55.00,
    paymentMethod: PaymentMethod.CARD,
    status: OrderStatus.COMPLETED,
    items: [
      { productId: '101', productName: 'X-Tudo', price: 25.90, quantity: 2, total: 51.80 }
    ]
  }
];

export const MockService = {
  // Restaurant
  getRestaurantSettings: () => Promise.resolve({ ...restaurantSettings }),
  updateRestaurantSettings: (data: Partial<RestaurantSettings>) => {
    restaurantSettings = { ...restaurantSettings, ...data };
    return Promise.resolve(restaurantSettings);
  },

  // Order Settings
  getOrderSettings: () => Promise.resolve({ ...orderSettings }),
  updateOrderSettings: (data: Partial<OrderSettings>) => {
    orderSettings = { ...orderSettings, ...data };
    return Promise.resolve(orderSettings);
  },

  // Categories
  getCategories: () => Promise.resolve([...categories]),
  saveCategory: (cat: Category) => {
    const idx = categories.findIndex(c => c.id === cat.id);
    if (idx >= 0) categories[idx] = cat;
    else categories.push({ ...cat, id: Math.random().toString(36).substr(2, 9) });
    return Promise.resolve(true);
  },
  deleteCategory: (id: string) => {
    categories = categories.filter(c => c.id !== id);
    return Promise.resolve(true);
  },

  // Products
  getProducts: () => Promise.resolve([...products]),
  saveProduct: (prod: Product) => {
    const idx = products.findIndex(p => p.id === prod.id);
    if (idx >= 0) products[idx] = prod;
    else products.push({ ...prod, id: Math.random().toString(36).substr(2, 9) });
    return Promise.resolve(true);
  },
  deleteProduct: (id: string) => {
    products = products.filter(p => p.id !== id);
    return Promise.resolve(true);
  },
  duplicateProduct: (id: string) => {
    const prod = products.find(p => p.id === id);
    if (prod) {
      const newProd = { ...prod, id: Math.random().toString(36).substr(2, 9), name: `${prod.name} (Cópia)` };
      products.push(newProd);
      return Promise.resolve(newProd);
    }
    return Promise.resolve(null);
  },

  // Orders
  getOrders: () => Promise.resolve([...orders]),
  updateOrderStatus: (id: string, status: OrderStatus) => {
    const idx = orders.findIndex(o => o.id === id);
    if (idx >= 0) {
      orders[idx].status = status;
      return Promise.resolve(orders[idx]);
    }
    return Promise.reject('Order not found');
  },

  // Plan
  getPlan: () => Promise.resolve({ type: PlanType.LOCAL_ONLINE, nextBilling: '2024-12-01' })
};