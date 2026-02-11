import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  ShieldOff, 
  Lock,
  MessageCircle,
  Eye
} from 'lucide-react';
import { Restaurant, RestaurantStatus, PlanType } from '../types';

// Mock Data
const MOCK_RESTAURANTS: Restaurant[] = [
  { id: '1', name: 'Pizzaria do João', slug: 'pizzaria-joao', ownerName: 'João Silva', whatsapp: '11999999999', city: 'São Paulo', state: 'SP', plan: PlanType.LOCAL_ONLINE, status: RestaurantStatus.ACTIVE, createdAt: '2023-10-01', ordersCount: 1540 },
  { id: '2', name: 'Sushi Express', slug: 'sushi-express', ownerName: 'Maria Oliveira', whatsapp: '11988888888', city: 'Rio de Janeiro', state: 'RJ', plan: PlanType.LOCAL, status: RestaurantStatus.PENDING, createdAt: '2023-10-05', ordersCount: 0 },
  { id: '3', name: 'Açaí Power', slug: 'acai-power', ownerName: 'Pedro Santos', whatsapp: '11977777777', city: 'Belo Horizonte', state: 'MG', plan: PlanType.LOCAL_ONLINE, status: RestaurantStatus.BLOCKED, createdAt: '2023-09-15', ordersCount: 450 },
  { id: '4', name: 'Burger Top', slug: 'burger-top', ownerName: 'Ana Costa', whatsapp: '11966666666', city: 'Curitiba', state: 'PR', plan: PlanType.LOCAL, status: RestaurantStatus.INACTIVE, createdAt: '2023-08-20', ordersCount: 20 },
  { id: '5', name: 'Cantina Italiana', slug: 'cantina-italiana', ownerName: 'Carlos Souza', whatsapp: '11955555555', city: 'São Paulo', state: 'SP', plan: PlanType.LOCAL_ONLINE, status: RestaurantStatus.ACTIVE, createdAt: '2023-07-10', ordersCount: 3200 },
];

export const Restaurants: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRestaurants = MOCK_RESTAURANTS.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: RestaurantStatus) => {
    switch (status) {
      case RestaurantStatus.ACTIVE:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">Ativo</span>;
      case RestaurantStatus.PENDING:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold leading-5 text-yellow-800 bg-yellow-100 rounded-full">Pendente</span>;
      case RestaurantStatus.BLOCKED:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full">Bloqueado</span>;
      case RestaurantStatus.INACTIVE:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold leading-5 text-gray-800 bg-gray-100 rounded-full">Inativo</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Restaurantes</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie, aprove e monitore os parceiros da plataforma.</p>
        </div>
        <button className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={18} className="mr-2" />
          Novo Restaurante
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, slug ou cidade..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
                <Filter size={18} className="absolute left-3 top-2.5 text-slate-500" />
                <select 
                    className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">Todos os Status</option>
                    <option value={RestaurantStatus.ACTIVE}>Ativo</option>
                    <option value={RestaurantStatus.PENDING}>Pendente</option>
                    <option value={RestaurantStatus.BLOCKED}>Bloqueado</option>
                    <option value={RestaurantStatus.INACTIVE}>Inativo</option>
                </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Restaurante / Proprietário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plano & Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Localização</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                        {restaurant.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{restaurant.name}</div>
                        <div className="text-sm text-slate-500">{restaurant.ownerName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{restaurant.plan}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                        <MessageCircle size={12}/> {restaurant.whatsapp}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{restaurant.city}</div>
                    <div className="text-sm text-slate-500">{restaurant.state}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(restaurant.status)}
                    <div className="text-xs text-slate-400 mt-1">Pedidos: {restaurant.ordersCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-indigo-600 tooltip" title="Entrar como (Impersonate)">
                            <ExternalLink size={18} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-amber-600 tooltip" title="Resetar Senha">
                            <Lock size={18} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-slate-600 tooltip" title="Ver Detalhes">
                            <Eye size={18} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-red-600 tooltip" title="Bloquear/Desativar">
                            <ShieldOff size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRestaurants.length === 0 && (
            <div className="p-8 text-center text-slate-500">
                Nenhum restaurante encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
