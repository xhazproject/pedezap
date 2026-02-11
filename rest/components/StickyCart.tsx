import React from 'react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from './Formatters';
import { ShoppingBag } from 'lucide-react';

interface StickyCartProps {
  onCheckout: () => void;
}

export const StickyCart: React.FC<StickyCartProps> = ({ onCheckout }) => {
  const { cartCount, cartTotal } = useCart();

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-30">
        <div className="container mx-auto max-w-2xl">
            <button
                onClick={onCheckout}
                className="w-full bg-emerald-600 text-white rounded-xl shadow-lg py-4 px-6 flex justify-between items-center hover:bg-emerald-700 transition-transform active:scale-95"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-800 bg-opacity-40 p-2 rounded-lg">
                        <ShoppingBag size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-medium text-emerald-100 uppercase">Seu carrinho</p>
                        <p className="font-bold">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
                    <span className="text-xs text-emerald-100">Ver &rarr;</span>
                </div>
            </button>
        </div>
    </div>
  );
};
