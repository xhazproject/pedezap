import { Category, Product, Restaurant } from './types';

export const RESTAURANT_DATA: Restaurant = {
  name: "Burger King do Zé",
  logoUrl: "https://picsum.photos/200/200?random=1",
  coverUrl: "https://picsum.photos/800/400?random=2",
  whatsappNumber: "5511999999999", // Replace with real number for testing
  isOpen: true,
  openingHours: "Ter à Dom - 18h às 23h30",
  address: "Rua das Flores, 123 - Centro",
  minOrderValue: 15.00,
  deliveryFee: 5.00
};

export const CATEGORIES: Category[] = [
  { id: 'burgers', name: 'Hambúrgueres' },
  { id: 'combos', name: 'Combos' },
  { id: 'drinks', name: 'Bebidas' },
  { id: 'sides', name: 'Acompanhamentos' },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    categoryId: 'burgers',
    name: 'X-Bacon Supremo',
    description: 'Pão brioche, 2 burgers de 150g, muito bacon, queijo cheddar e maionese da casa.',
    price: 32.90,
    imageUrl: 'https://picsum.photos/400/300?random=3'
  },
  {
    id: '2',
    categoryId: 'burgers',
    name: 'Clássico Salad',
    description: 'Pão, burger 150g, alface, tomate, cebola roxa e queijo prato.',
    price: 24.50,
    imageUrl: 'https://picsum.photos/400/300?random=4'
  },
  {
    id: '3',
    categoryId: 'burgers',
    name: 'Smash Duplo',
    description: 'Pão macio, 2 smash burgers de 80g, queijo cheddar inglês e picles.',
    price: 28.00,
    imageUrl: 'https://picsum.photos/400/300?random=5'
  },
  {
    id: '4',
    categoryId: 'combos',
    name: 'Combo Casal',
    description: '2 X-Bacon, 1 Batata Grande com Cheddar e Bacon, 1 Refrigerante 2L.',
    price: 85.00,
    imageUrl: 'https://picsum.photos/400/300?random=6'
  },
  {
    id: '5',
    categoryId: 'drinks',
    name: 'Coca-Cola Lata 350ml',
    description: 'Geladinha.',
    price: 6.00,
    imageUrl: 'https://picsum.photos/400/300?random=7'
  },
  {
    id: '6',
    categoryId: 'sides',
    name: 'Batata Frita Rústica',
    description: 'Porção individual de batata frita com tempero especial.',
    price: 12.00,
    imageUrl: 'https://picsum.photos/400/300?random=8'
  },
];