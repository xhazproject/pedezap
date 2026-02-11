import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MockService } from '../services/mockData';
import { Copy, ExternalLink, Store, ShoppingBag, List, AlertCircle, Eye } from 'lucide-react';
import { RestaurantSettings, PlanType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [plan, setPlan] = useState<{ type: PlanType } | null>(null);

  useEffect(() => {
    MockService.getRestaurantSettings().then(setSettings);
    MockService.getProducts().then((prods) => setProductCount(prods.length));
    MockService.getCategories().then((cats) => setCategoryCount(cats.length));
    MockService.getPlan().then(setPlan);
  }, []);

  const toggleStoreStatus = async () => {
    if (!settings) return;
    const newState = !settings.isOpen;
    await MockService.updateRestaurantSettings({ isOpen: newState });
    setSettings((prev) => (prev ? { ...prev, isOpen: newState } : null));
  };

  const copyLink = () => {
    if (!settings) return;
    const link = `app.pedezap.ai/${settings.slug}`;
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  };

  const chartData = [
    { name: 'Seg', vendas: 12 },
    { name: 'Ter', vendas: 19 },
    { name: 'Qua', vendas: 15 },
    { name: 'Qui', vendas: 22 },
    { name: 'Sex', vendas: 45 },
    { name: 'Sab', vendas: 60 },
    { name: 'Dom', vendas: 55 }
  ];

  if (!settings) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2 bg-emerald-600 text-white border-none">
          <div className="flex flex-col justify-between h-full">
            <div>
              <h3 className="text-lg font-semibold">Seu Link de Pedidos</h3>
              <p className="text-emerald-100 text-sm mt-1">Compartilhe com seus clientes</p>
            </div>
            <div className="mt-6 flex gap-2">
              <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-sm font-mono truncate">
                app.pedezap.ai/{settings.slug}
              </div>
              <button onClick={copyLink} className="bg-white text-emerald-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Copy size={18} />
              </button>
              <button
                onClick={() => window.open(`https://app.pedezap.ai/${settings.slug}`, '_blank')}
                className="bg-white/15 border border-white/20 text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between items-center text-center p-6">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status da Loja</span>
          <div className={`mt-2 px-4 py-1 rounded-full text-xs font-bold ${settings.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {settings.isOpen ? 'ABERTA' : 'FECHADA'}
          </div>
          <div className="mt-4 w-full">
            <Button
              variant={settings.isOpen ? 'danger' : 'primary'}
              fullWidth
              size="sm"
              onClick={toggleStoreStatus}
            >
              {settings.isOpen ? 'Fechar Loja' : 'Abrir Loja'}
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Plano Atual</span>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{plan?.type || '...'}</h3>
          </div>
          <div className="mt-4">
            <Button variant="secondary" size="sm" fullWidth onClick={() => (window.location.hash = '#/plans')}>
              Ver Detalhes
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <List size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Categorias</p>
            <p className="text-xl font-bold text-gray-900">{categoryCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <ShoppingBag size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Produtos</p>
            <p className="text-xl font-bold text-gray-900">{productCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
            <Eye size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Visualizacoes</p>
            <p className="text-xl font-bold text-gray-900">1.2k</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Vendas da Semana" className="lg:col-span-2 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="vendas" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Dicas de Sucesso" className="h-auto">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1 text-emerald-600">
                <AlertCircle size={18} />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Fotos vendem mais!</p>
                Adicione fotos reais e atraentes aos seus produtos para aumentar a conversao.
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1 text-emerald-600">
                <AlertCircle size={18} />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Descricao detalhada</p>
                Liste todos os ingredientes para evitar duvidas e agilizar o pedido.
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="ghost" size="sm" fullWidth>
              Ver todas as dicas
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
