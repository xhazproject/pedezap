import React from 'react';
import { Product } from '../types';
import { formatCurrency } from './Formatters';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RESTAURANT_DATA } from '../constants';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();
  const { isOpen } = RESTAURANT_DATA;

  return (
    <div className="flex bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Section */}
      {product.imageUrl && (
        <div className="w-28 h-auto bg-gray-100 shrink-0">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Content Section */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
          <button
            onClick={() => addToCart(product)}
            disabled={!isOpen}
            className={`p-2 rounded-full transition-colors ${
                isOpen 
                ? 'bg-emerald-600 text-white active:bg-emerald-700 hover:bg-emerald-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label={`Adicionar ${product.name}`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};