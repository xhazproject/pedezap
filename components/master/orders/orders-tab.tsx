'use client';

import { LayoutDashboard, List, Plus, Printer, Search } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/store-data';

type OrdersByStatus = {
  Recebido: Order[];
  'Em preparo': Order[];
  Concluido: Order[];
};

type Props = {
  ordersView: 'board' | 'table';
  setOrdersView: (value: 'board' | 'table') => void;
  ordersQuery: string;
  setOrdersQuery: (value: string) => void;
  onOpenManualOrder: () => void;
  hasReachedManualOrderLimit: boolean;
  lastOrdersRefreshAt: string | null;
  newOrdersAlertCount: number;
  clearNewOrdersAlert: () => void;
  manualOrderMonthlyLimit: number | null;
  manualOrdersThisMonthCount: number;
  filteredOrders: Order[];
  ordersByStatus: OrdersByStatus;
  updatingOrderId: string | null;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onPrintOrderTicket: (order: Order) => void;
  getOrderAgeMinutes: (createdAt: string) => number;
  paymentMethodLabel: (paymentMethod: Order['paymentMethod']) => string;
  getOrderStatus: (order: Order) => OrderStatus;
};

export function MasterOrdersTab(props: Props) {
  const {
    ordersView,
    setOrdersView,
    ordersQuery,
    setOrdersQuery,
    onOpenManualOrder,
    hasReachedManualOrderLimit,
    lastOrdersRefreshAt,
    newOrdersAlertCount,
    clearNewOrdersAlert,
    manualOrderMonthlyLimit,
    manualOrdersThisMonthCount,
    filteredOrders,
    ordersByStatus,
    updatingOrderId,
    onUpdateOrderStatus,
    onPrintOrderTicket,
    getOrderAgeMinutes,
    paymentMethodLabel,
    getOrderStatus
  } = props;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gestao de Pedidos</h2>
          <p className="text-sm text-gray-500">Acompanhe o fluxo da cozinha em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManualOrder}
            disabled={hasReachedManualOrderLimit}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus size={16} />
            Novo Pedido
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={ordersQuery}
              onChange={(event) => setOrdersQuery(event.target.value)}
              className="w-48 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm"
              placeholder="Buscar cliente ou ID..."
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setOrdersView('board')}
              className={`h-8 w-8 rounded-md flex items-center justify-center ${
                ordersView === 'board' ? 'bg-slate-100 text-slate-900' : 'text-gray-400'
              }`}
            >
              <LayoutDashboard size={16} />
            </button>
            <button
              onClick={() => setOrdersView('table')}
              className={`h-8 w-8 rounded-md flex items-center justify-center ${
                ordersView === 'table' ? 'bg-slate-100 text-slate-900' : 'text-gray-400'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          Atualizacao automatica a cada 5s
          {lastOrdersRefreshAt
            ? ` • Ultimo refresh: ${new Date(lastOrdersRefreshAt).toLocaleTimeString('pt-BR')}`
            : ''}
        </div>
        {newOrdersAlertCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {newOrdersAlertCount} novo(s) pedido(s) recebido(s)
            <button
              type="button"
              onClick={clearNewOrdersAlert}
              className="ml-1 rounded-md border border-emerald-300 bg-white px-2 py-0.5 text-[11px] hover:bg-emerald-100"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {manualOrderMonthlyLimit !== null && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          Pedidos manuais no mes: {manualOrdersThisMonthCount}/{manualOrderMonthlyLimit}
          {hasReachedManualOrderLimit ? ' (limite atingido)' : ''}
        </div>
      )}

      {ordersView === 'board' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { key: 'Recebido', label: 'Recebidos', color: 'bg-slate-100 border-slate-200' },
            { key: 'Em preparo', label: 'Na Cozinha', color: 'bg-slate-100 border-slate-200' },
            { key: 'Concluido', label: 'Prontos / Historico', color: 'bg-slate-100 border-slate-200' }
          ].map((column) => (
            <div key={column.key} className={`rounded-xl border ${column.color} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">{column.label}</h3>
                <span className="text-xs text-gray-500">{ordersByStatus[column.key as keyof OrdersByStatus].length}</span>
              </div>
              <div className="space-y-3">
                {ordersByStatus[column.key as keyof OrdersByStatus].map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                        <p className="text-xs text-gray-500">{order.customerName}</p>
                      </div>
                      <span className="text-[10px] text-gray-400">{getOrderAgeMinutes(order.createdAt)} min</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={`${item.productId}_${idx}`}>
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{paymentMethodLabel(order.paymentMethod)}</span>
                      <span className="font-semibold text-slate-900">R$ {order.total.toFixed(2)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {column.key === 'Recebido' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Em preparo')}
                          disabled={updatingOrderId === order.id}
                          className="flex-1 rounded-lg bg-black text-white py-1.5 text-xs font-medium hover:bg-slate-900 disabled:opacity-60"
                        >
                          {updatingOrderId === order.id ? 'Atualizando...' : 'Aceitar & Preparar'}
                        </button>
                      )}
                      {column.key === 'Em preparo' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Concluido')}
                          disabled={updatingOrderId === order.id}
                          className="flex-1 rounded-lg border border-slate-200 text-slate-900 py-1.5 text-xs font-medium hover:bg-slate-100 disabled:opacity-60"
                        >
                          {updatingOrderId === order.id ? 'Atualizando...' : 'Marcar Pronto'}
                        </button>
                      )}
                      {column.key === 'Concluido' && (
                        <button className="flex-1 rounded-lg border border-slate-200 text-slate-900 py-1.5 text-xs font-medium bg-slate-100">
                          Concluido
                        </button>
                      )}
                      <button
                        onClick={() => onPrintOrderTicket(order)}
                        className="h-8 w-10 rounded-lg border border-gray-200 text-gray-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-center"
                        title={`Imprimir comanda #${order.id}`}
                        aria-label={`Imprimir comanda #${order.id}`}
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {!ordersByStatus[column.key as keyof OrdersByStatus].length && (
                  <div className="text-xs text-gray-400">Nenhum pedido.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const status = getOrderStatus(order);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">#{order.id}</div>
                      <div className="text-xs text-gray-400">{getOrderAgeMinutes(order.createdAt)} min</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-400">{order.customerWhatsapp}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">R$ {order.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          status === 'Recebido'
                            ? 'bg-slate-100 text-slate-800'
                            : status === 'Em preparo'
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {status === 'Recebido' ? 'RECEBIDO' : status === 'Em preparo' ? 'EM PREPARO' : 'CONCLUIDO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 font-medium">
                      <div className="inline-flex items-center justify-end gap-3">
                        <button
                          onClick={() => onPrintOrderTicket(order)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100"
                          title={`Imprimir comanda #${order.id}`}
                          aria-label={`Imprimir comanda #${order.id}`}
                        >
                          <Printer size={14} />
                        </button>
                        {status === 'Recebido' && (
                          <button onClick={() => onUpdateOrderStatus(order.id, 'Em preparo')} className="hover:underline">
                            Aceitar
                          </button>
                        )}
                        {status === 'Em preparo' && (
                          <button onClick={() => onUpdateOrderStatus(order.id, 'Concluido')} className="hover:underline">
                            Finalizar
                          </button>
                        )}
                        {status === 'Concluido' && <button>Detalhes</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredOrders.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
