import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, PizzaFlavor, PizzaCrust } from '../types';

interface AddToCartOptions {
  flavors?: PizzaFlavor[];
  crust?: PizzaCrust;
  notes?: string;
  quantity?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, options?: AddToCartOptions) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  updateItemNotes: (cartId: string, notes: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Persist cart on load
    const savedCart = localStorage.getItem('pedezap_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    // Save to local storage whenever cart changes
    localStorage.setItem('pedezap_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, options?: AddToCartOptions) => {
    setCart((prev) => {
      // Logic: Simple products (non-pizza) stack if ID matches.
      // Complex products (pizza) stack only if flavors/crust match exactly.
      // For simplicity in this demo, every customized item gets a new entry unless strictly identical.
      
      const isCustom = product.isPizza;
      
      // Calculate adjusted price (pizza by selected flavors + crust)
      let finalPrice = product.price;
      if (product.isPizza && options?.flavors?.length) {
        const totalFlavorPrice = options.flavors.reduce((sum, flavor) => sum + (flavor.price ?? 0), 0);
        const averageFlavorPrice = totalFlavorPrice / options.flavors.length;
        finalPrice = Number(averageFlavorPrice.toFixed(2));
      }
      if (options?.crust) {
        finalPrice += options.crust.price;
      }

      const quantityToAdd = Math.max(1, options?.quantity ?? 1);

      // Generate a unique ID for the cart item
      const newItem: CartItem = {
        ...product,
        cartId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        quantity: quantityToAdd,
        notes: options?.notes || '',
        price: finalPrice, // Override price with calculated price
        selectedFlavors: options?.flavors,
        selectedCrust: options?.crust
      };

      // Check if identical item exists
      const existingItemIndex = prev.findIndex(item => {
        if (item.id !== product.id) return false;
        
        // If simple product, it matches
        if (!isCustom) return true;

        // If custom, check deep equality of options
        const flavorsMatch = JSON.stringify(item.selectedFlavors) === JSON.stringify(options?.flavors);
        const crustMatch = item.selectedCrust?.id === options?.crust?.id;
        
        return flavorsMatch && crustMatch;
      });

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantityToAdd;
        if (options?.notes) {
          newCart[existingItemIndex].notes = options.notes;
        }
        return newCart;
      }

      return [...prev, newItem];
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      });
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateItemNotes = (cartId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.cartId === cartId ? { ...item, notes } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemNotes,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
