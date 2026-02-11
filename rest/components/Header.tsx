import React from 'react';
import { RESTAURANT_DATA } from '../constants';
import { Star, ChevronRight } from 'lucide-react';

interface HeaderProps {
  onOpenStoreInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenStoreInfo }) => {
  const { name, coverUrl, isOpen, logoUrl, city, state } = RESTAURANT_DATA;

  return (
    <div className="bg-white pb-3 relative border-b border-slate-100">
      <div 
        className="h-36 md:h-56 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${coverUrl})` }}
      >
        <div className="absolute inset-0 bg-slate-900/35"></div>
      </div>
      
      <div className="container-custom -mt-8 md:-mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden border border-slate-200">
                <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-slate-900 leading-tight">{name}</h1>
                <div className="mt-1 flex items-center gap-2 text-xs md:text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    4.7
                  </span>
                  <span>-</span>
                  <span>{city} / {state}</span>
                </div>
              </div>
            </div>
            <button onClick={onOpenStoreInfo} className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Ver mais
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
        <div className="mt-3">
          <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {isOpen ? 'Loja Aberta' : 'Loja Fechada'}
          </span>
        </div>
      </div>
    </div>
  );
};
