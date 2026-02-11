import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const data = [
  { name: 'Seg', pedidos: 4000, restaurantes: 240 },
  { name: 'Ter', pedidos: 3000, restaurantes: 242 },
  { name: 'Qua', pedidos: 2000, restaurantes: 245 },
  { name: 'Qui', pedidos: 2780, restaurantes: 250 },
  { name: 'Sex', pedidos: 1890, restaurantes: 255 },
  { name: 'Sáb', pedidos: 2390, restaurantes: 260 },
  { name: 'Dom', pedidos: 3490, restaurantes: 265 },
];

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div className="flex items-center text-sm">
      <span className={`font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'} flex items-center gap-1`}>
        {trend === 'up' ? '+' : '-'}{subtext}
      </span>
      <span className="text-slate-400 ml-2">vs. mês passado</span>
    </div>
  </div>
);

const AlertItem = ({ message, type }: { message: string, type: 'error' | 'warning' | 'info' }) => {
    const colors = {
        error: 'bg-red-50 text-red-700 border-red-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return (
        <div className={`px-4 py-3 rounded-lg border flex items-center gap-3 ${colors[type]}`}>
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">{message}</span>
        </div>
    )
}

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
        <div className="text-sm text-slate-500">Última atualização: Hoje, 14:30</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Restaurantes Ativos" 
          value="1,240" 
          subtext="12%" 
          trend="up"
          icon={Store} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Receita Estimada (Mês)" 
          value="R$ 145.2k" 
          subtext="8.1%" 
          trend="up"
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Pedidos (24h)" 
          value="3,892" 
          subtext="2.3%" 
          trend="down"
          icon={ShoppingBag} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Tickets Pendentes" 
          value="14" 
          subtext="5 Novos" 
          trend="down"
          icon={FileText} 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Crescimento da Plataforma</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="pedidos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPedidos)" />
                <Area type="monotone" dataKey="restaurantes" stroke="#6366f1" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Actions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500"/>
            Atenção Necessária
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
             <AlertItem type="error" message="3 Restaurantes com WhatsApp inválido" />
             <AlertItem type="warning" message="5 Tickets de alta prioridade abertos" />
             <AlertItem type="warning" message="12 Assinaturas venceram hoje" />
             <AlertItem type="info" message="Backup do sistema realizado com sucesso" />
             <AlertItem type="error" message="Falha no webhook de pagamento (23x)" />
          </div>
          <button className="mt-4 w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
            Ver Todos os Alertas
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Restaurantes em Destaque (Volume)</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Ver Ranking Completo</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-3">Restaurante</th>
                        <th className="px-6 py-3">Plano</th>
                        <th className="px-6 py-3 text-right">Pedidos (Mês)</th>
                        <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {[1,2,3,4,5].map((i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-900">Burguer King da Silva #{i}</td>
                            <td className="px-6 py-3 text-slate-500">Local + Online</td>
                            <td className="px-6 py-3 text-right text-slate-900 font-bold">{1200 - (i*50)}</td>
                            <td className="px-6 py-3 text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    Ativo
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

// Simple icon import helper for the card
import { Store } from 'lucide-react';
