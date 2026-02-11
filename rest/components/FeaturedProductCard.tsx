import React from 'react';
import { Product } from '../types';
import { formatCurrency } from './Formatters';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RESTAURANT_DATA } from '../constants';

interface Props {
  product: Product;
  onOpenModal?: (product: Product) => void;
}

export const FeaturedProductCard: React.FC<Props> = ({ product, onOpenModal }) => {
  const { addToCart } = useCart();
  const { isOpen } = RESTAURANT_DATA;
  const handleAction = () => {
    if (product.isPizza && onOpenModal) {
      onOpenModal(product);
      return;
    }
    addToCart(product);
  };

  return (
    <div className="group flex-shrink-0 w-40 sm:w-48 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
      {/* Image Section */}
      <div className="w-full h-32 sm:h-40 bg-gray-100 relative overflow-hidden">
        {product.imageUrl && (
            <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
            />
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md shadow-sm border border-emerald-100 uppercase tracking-wide">
            {product.isInCampaign ? 'Em campanha' : 'Destaque'}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="mb-2">
          <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2">
            {product.description}
          </p>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-auto">
          <span className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(product.price)}</span>
          <button
            onClick={handleAction}
            disabled={!isOpen}
            className={`p-1.5 sm:p-2 rounded-full transition-colors shadow-sm ${
                isOpen 
                ? 'bg-emerald-600 text-white active:bg-emerald-700 hover:bg-emerald-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label={`Adicionar ${product.name}`}
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
