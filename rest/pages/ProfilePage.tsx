import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, LogOut, MapPin, ShoppingBag, UserRound } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';

type CustomerSession = {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  neighborhood: string;
};

type CustomerOrder = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customerWhatsapp: string;
};

interface ProfilePageProps {
  slug: string;
  customer: CustomerSession;
  onMenu: () => void;
  onCheckout: () => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  slug,
  customer,
  onMenu,
  onCheckout,
  onLogout
}) => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  useEffect(() => {
    fetch(`/api/orders?slug=${slug}`)
      .then((res) => res.json())
      .then((payload: { orders?: CustomerOrder[] }) => {
        const allOrders = payload.orders ?? [];
        const normalizedPhone = customer.whatsapp.replace(/\D/g, '');
        const mine = allOrders.filter(
          (order) => order.customerWhatsapp.replace(/\D/g, '') === normalizedPhone
        );
        setOrders(mine.slice(0, 5));
      })
      .catch(() => setOrders([]));
  }, [slug, customer.whatsapp]);

  const initial = useMemo(() => customer.name.trim().charAt(0).toUpperCase() || 'U', [customer.name]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="container-custom pt-4 space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Meu Perfil</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
              {initial}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{customer.name || 'Usuario Demo'}</p>
              <p className="text-sm text-slate-500">{customer.whatsapp}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <MapPin size={18} />
            Ultimo Endereco
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-800">{customer.address}</p>
            <p className="mt-1 text-sm text-slate-400">
              Este endereco sera preenchido automaticamente no seu proximo pedido.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Clock3 size={18} />
            Ultimos Pedidos
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {orders.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-400">
                <ShoppingBag className="mx-auto mb-2" size={26} />
                <p>Nenhum pedido realizado ainda.</p>
              </div>
            )}
            {orders.length > 0 && (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div>
                      <p className="font-semibold text-slate-900">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">R$ {order.total.toFixed(2)}</p>
                      <p className="text-xs text-emerald-600">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-white py-3.5 font-bold text-rose-600 hover:bg-rose-50"
        >
          <LogOut size={16} />
          Sair da Conta
        </button>

        <p className="text-center text-xs text-slate-400">Versao 1.1.0</p>
      </div>

      <BottomNav
        activeTab="profile"
        onMenu={onMenu}
        onCheckout={onCheckout}
        onProfile={() => {}}
        cartCount={0}
      />
    </div>
  );
};
