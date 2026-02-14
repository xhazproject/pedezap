import React from 'react';
import { Store } from '../types';
import { Star, Clock, Bike, MapPin, ArrowRight, Store as StoreIcon } from 'lucide-react';

interface StoreCardProps {
  store: Store;
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  return (
    <div className={`group relative bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${!store.isOpen ? 'opacity-90' : ''}`}>
      
      {/* Cover Image */}
      <div className="h-40 w-full overflow-hidden relative">
        <img 
          src={store.imageUrl} 
          alt={store.name} 
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!store.isOpen ? 'grayscale contrast-75' : ''}`}
        />
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-20">
            {store.isOpen ? (
                <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-emerald-400/20">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                    Online
                </div>
            ) : (
                <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-rose-400/20">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    Fechado
                </div>
            )}
        </div>

        {/* Gradient Overlay for text readability if needed, though mostly using solid backgrounds below */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="p-5 pt-12 relative flex-1 flex flex-col">
        {/* Logo Avatar - Floating */}
        <div className="absolute -top-10 left-5 p-1 bg-white rounded-2xl shadow-md z-10">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 relative">
                <img 
                    src={store.logoUrl} 
                    alt={`${store.name} logo`} 
                    className={`w-full h-full object-cover ${!store.isOpen ? 'grayscale' : ''}`}
                />
            </div>
        </div>

        {/* Store Info */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-black transition-colors line-clamp-2 pr-2">
            {store.name}
          </h3>
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg shrink-0">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-gray-700">{store.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center text-gray-500 text-xs gap-2 mb-4">
            <span className="bg-gray-100 px-2.5 py-1 rounded-md font-semibold text-gray-700 tracking-wide uppercase text-[10px]">
                {store.category === 'burger' ? 'Lanches' : store.category === 'japanese' ? 'Japonesa' : store.category === 'drinks' ? 'Bebidas' : store.category.charAt(0).toUpperCase() + store.category.slice(1)}
            </span>
            <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {store.deliveryTime}
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
             <div className="flex items-center gap-1 font-medium text-gray-700">
                {store.deliveryFee === 0 ? <span className="text-green-600">Grátis</span> : `R$ ${store.deliveryFee.toFixed(2).replace('.', ',')}`}
            </div>
        </div>

        {/* Push button to bottom */}
        <div className="mt-auto pt-4 border-t border-dashed border-gray-100">
          {store.isOpen ? (
             <a 
                href={store.storeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-gray-900 text-white hover:bg-black transition-all active:scale-[0.98] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gray-200 group/btn relative overflow-hidden"
             >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-2">
                    <StoreIcon className="w-4 h-4" />
                    Ver Cardápio
                    <ArrowRight className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-300" />
                </span>
             </a>
          ) : (
            <button disabled className="w-full bg-gray-50 text-gray-400 cursor-not-allowed py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-gray-100">
                Loja Fechada
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreCard;