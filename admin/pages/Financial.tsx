import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  MoreVertical,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const tabs = [
  { id: 'overview', label: 'Visao Geral' },
  { id: 'invoices', label: 'Faturas & Cobrancas' },
  { id: 'delinquency', label: 'Inadimplencia' },
  { id: 'plans', label: 'Planos' },
];

const kpis = [
  {
    title: 'MRR (Recorrencia)',
    value: 'R$ 168.450',
    trend: '+ 8.4% vs mes ant.',
    trendUp: true,
    icon: TrendingUp,
    iconBg: 'bg-emerald-50 text-emerald-600'
  },
  {
    title: 'Churn Rate (Cancelamento)',
    value: '1.2%',
    trend: '- 0.3% (Melhorando)',
    trendUp: false,
    icon: TrendingDown,
    iconBg: 'bg-red-50 text-red-600'
  },
  {
    title: 'ARPU (Ticket Medio)',
    value: 'R$ 135,84',
    trend: 'Baseado em 1.240 lojas',
    trendUp: true,
    icon: DollarSign,
    iconBg: 'bg-indigo-50 text-indigo-600'
  },
  {
    title: 'Inadimplencia Bruta',
    value: 'R$ 8.920',
    trend: '42 faturas em atraso',
    trendUp: false,
    icon: AlertCircle,
    iconBg: 'bg-amber-50 text-amber-600'
  }
];

const mrrData = [
  { name: 'Jan', value: 120 },
  { name: 'Fev', value: 128 },
  { name: 'Mar', value: 136 },
  { name: 'Abr', value: 142 },
  { name: 'Mai', value: 152 },
  { name: 'Jun', value: 165 },
];

const planData = [
  { name: 'Plano Local', value: 740, color: '#6366f1' },
  { name: 'Plano Local + Online', value: 500, color: '#10b981' },
];

const invoices = [
  {
    id: 'INV-001',
    restaurant: 'Pizzaria Napolitana',
    method: 'Cartao de Credito',
    value: 'R$ 149,90',
    date: '2023-11-24',
    status: 'Pago'
  },
  {
    id: 'INV-002',
    restaurant: 'Sushi Express',
    method: 'Boleto',
    value: 'R$ 149,90',
    date: '2023-11-23',
    status: 'Pendente'
  },
  {
    id: 'INV-003',
    restaurant: 'Burger House',
    method: 'Pix',
    value: 'R$ 299,90',
    date: '2023-11-22',
    status: 'Vencido'
  },
  {
    id: 'INV-004',
    restaurant: 'Acai do Porto',
    method: 'Cartao de Credito',
    value: 'R$ 149,90',
    date: '2023-11-21',
    status: 'Pago'
  },
  {
    id: 'INV-005',
    restaurant: 'Pastelaria Central',
    method: 'Cartao de Credito',
    value: 'R$ 149,90',
    date: '2023-11-20',
    status: 'Estornado'
  },
];

const statusStyles: Record<string, string> = {
  Pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  Vencido: 'bg-red-50 text-red-700 border-red-200',
  Estornado: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const Financial: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro & Faturamento</h1>
          <p className="text-sm text-slate-500">Gestao de receita, assinaturas e saude financeira da plataforma.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
            <RefreshCw size={16} />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700">
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="inline-flex rounded-lg bg-slate-100 p-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-slate-900">{kpi.value}</div>
                  <p className={`mt-2 text-xs ${kpi.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                    {kpi.trend}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Crescimento de Receita (MRR)</h3>
                <select className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white">
                  <option>Ultimos 6 meses</option>
                </select>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mrrData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={18} className="text-slate-600" />
                <h3 className="text-lg font-bold text-slate-900">Distribuicao por Plano</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {planData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {planData.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: plan.color }} />
                      <span className="text-slate-600">{plan.name}</span>
                    </div>
                    <span className="font-medium text-slate-900">{plan.value} lojas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Buscar fatura ou loja..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                <SlidersHorizontal size={16} />
                Filtros
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                <Plus size={16} />
                Nova Cobranca
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">ID / FATURA</th>
                  <th className="px-6 py-3">RESTAURANTE</th>
                  <th className="px-6 py-3">VALOR</th>
                  <th className="px-6 py-3">DATA</th>
                  <th className="px-6 py-3">STATUS</th>
                  <th className="px-6 py-3 text-right">ACOES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{row.restaurant}</div>
                      <div className="text-xs text-slate-500">{row.method}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{row.value}</td>
                    <td className="px-6 py-4 text-slate-500">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3 text-slate-500">
                        <FileText size={16} />
                        <CheckCircle2 size={16} />
                        <MoreVertical size={16} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between text-xs text-slate-500">
            <span>Mostrando 5 de 1.450 faturas</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600">Anterior</button>
              <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600">Proxima</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'delinquency' && (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
            <AlertCircle className="text-slate-400" size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">Modulo de Cobranca Automatica</h3>
          <p className="text-sm text-slate-500 mt-2">
            Aqui voce podera gerenciar as regras de cobranca e suspensao automatica de lojas devedoras.
          </p>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-slate-900">Plano Local</h3>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">R$ 149,90/mes</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lojas Ativas</span>
                <span className="font-medium text-slate-900">740</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Receita Estimada</span>
                <span className="font-medium text-emerald-600">R$ 110.926,00</span>
              </div>
            </div>
            <button className="mt-6 w-full py-2 border border-indigo-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50">
              Gerenciar Beneficios
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-slate-900">Plano Local + Online</h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">R$ 299,90/mes</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lojas Ativas</span>
                <span className="font-medium text-slate-900">500</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Receita Estimada</span>
                <span className="font-medium text-emerald-600">R$ 149.950,00</span>
              </div>
            </div>
            <button className="mt-6 w-full py-2 border border-emerald-200 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50">
              Gerenciar Beneficios
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
