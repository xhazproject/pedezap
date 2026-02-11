import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { MockService } from '../services/mockData';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle2, XCircle, ChevronDown, Phone, CreditCard } from 'lucide-react';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    MockService.getOrders().then(data => {
      // Sort by date desc
      setOrders(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
  };

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    await MockService.updateOrderStatus(id, newStatus);
    loadOrders();
  };

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.RECEIVED: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Histórico de Pedidos</h2>
        {/* Simple Filter could go here */}
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <Card key={order.id} className="hover:border-brand-200 transition-colors">
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Header Info Mobile */}
              <div className="flex justify-between items-start md:hidden">
                <div>
                   <span className="font-bold text-lg">{order.id}</span>
                   <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString('pt-BR')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              {/* Main Content */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* ID & Customer */}
                <div className="md:col-span-1">
                  <div className="hidden md:block mb-2">
                    <span className="font-bold text-lg text-gray-900">{order.id}</span>
                    <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                       <Phone size={14} />
                       {order.customerPhone}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-3 text-sm">
                   <ul className="space-y-1">
                     {order.items.map((item, idx) => (
                       <li key={idx} className="flex justify-between text-gray-700">
                         <span>{item.quantity}x {item.productName}</span>
                         <span className="font-medium text-gray-900">R$ {item.total.toFixed(2)}</span>
                       </li>
                     ))}
                   </ul>
                   <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                     <div className="flex items-center gap-2 text-gray-500">
                        <CreditCard size={16} />
                        <span>{order.paymentMethod}</span>
                     </div>
                     <span className="font-bold text-lg text-brand-700">Total: R$ {order.total.toFixed(2)}</span>
                   </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex flex-col gap-3 justify-center">
                   <div className="hidden md:flex justify-end mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                   </div>
                   
                   <div className="relative group">
                     <select 
                        className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-brand-500"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                     >
                       {Object.values(OrderStatus).map(s => (
                         <option key={s} value={s}>{s.toUpperCase()}</option>
                       ))}
                     </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                       <ChevronDown size={16} />
                     </div>
                   </div>
                </div>

              </div>
            </div>
          </Card>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 text-gray-500">
            <p>Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};