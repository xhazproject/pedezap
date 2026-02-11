import React from 'react';
import { Home, ShoppingBag, User } from 'lucide-react';

interface BottomNavProps {
  cartCount: number;
  activeTab: 'menu' | 'cart' | 'profile';
  onMenu: () => void;
  onCheckout: () => void;
  onProfile: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  cartCount,
  activeTab,
  onMenu,
  onCheckout,
  onProfile
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-around px-6">
        <button onClick={onMenu} className={`flex flex-col items-center gap-1 ${activeTab === 'menu' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>
          <Home size={20} />
          <span className="text-xs font-semibold">Cardapio</span>
        </button>

        <button onClick={onCheckout} className={`relative flex flex-col items-center gap-1 ${activeTab === 'cart' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>
          <ShoppingBag size={20} />
          <span className="text-xs font-semibold">Carrinho</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 right-1 min-w-5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>

        <button onClick={onProfile} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>
          <User size={20} />
          <span className="text-xs font-semibold">Perfil</span>
        </button>
      </div>
    </div>
  );
};
