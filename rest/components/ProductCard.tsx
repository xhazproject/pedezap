import React from 'react';
import { Product } from '../types';
import { formatCurrency } from './Formatters';
import { ChevronRight, Plus } from 'lucide-react';
import { RESTAURANT_DATA } from '../constants';

interface Props {
  product: Product;
  onOpenModal?: (product: Product) => void;
}

export const ProductCard: React.FC<Props> = ({ product, onOpenModal }) => {
  const { isOpen } = RESTAURANT_DATA;

  const handleAction = () => {
    if (onOpenModal) {
      onOpenModal(product);
    }
  };

  return (
    <div className="group bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex gap-4 items-stretch h-full overflow-hidden">
      {/* Image Section */}
      {product.imageUrl && (
        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          {product.isInCampaign && (
            <span className="absolute left-2 top-2 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Em campanha
            </span>
          )}
        </div>
      )}
      
      {/* Content Section */}
      <div className="min-w-0 flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start min-w-0">
            <h3 className="min-w-0 break-words font-bold text-gray-800 text-base sm:text-lg leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h3>
          </div>
          <p className="min-w-0 break-words text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
        
        <div className="flex justify-between items-end gap-2 mt-3">
          <span className="font-bold text-emerald-700 text-base sm:text-lg">
            {formatCurrency(product.price)}
          </span>
          
          <button
            onClick={handleAction}
            disabled={!isOpen}
            className={`
              h-8 sm:h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 px-3 gap-1
              ${isOpen 
                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white active:scale-95' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
            aria-label={`Adicionar ${product.name}`}
          >
            {product.isPizza ? (
              <>
                <span className="text-xs font-bold">Montar</span>
                <ChevronRight size={16} strokeWidth={2.5} />
              </>
            ) : (
              <Plus size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
