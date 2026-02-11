import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MockService } from '../services/mockData';
import { OrderSettings, RestaurantSettings, PaymentMethod } from '../types';

export const Settings: React.FC = () => {
  const [restaurant, setRestaurant] = useState<RestaurantSettings | null>(null);
  const [orderConfig, setOrderConfig] = useState<OrderSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      MockService.getRestaurantSettings(),
      MockService.getOrderSettings()
    ]).then(([res, ord]) => {
      setRestaurant(res);
      setOrderConfig(ord);
    });
  }, []);

  const handleSave = async () => {
    if (!restaurant || !orderConfig) return;
    setSaving(true);
    await MockService.updateRestaurantSettings(restaurant);
    await MockService.updateOrderSettings(orderConfig);
    setSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    if (!orderConfig) return;
    const current = orderConfig.paymentMethods;
    const updated = current.includes(method) 
      ? current.filter(m => m !== method)
      : [...current, method];
    setOrderConfig({...orderConfig, paymentMethods: updated});
  };

  if (!restaurant || !orderConfig) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Restaurant Info */}
      <Card title="Dados do Restaurante">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Nome do Restaurante" 
            value={restaurant.name} 
            onChange={e => setRestaurant({...restaurant, name: e.target.value})} 
          />
          <Input 
            label="WhatsApp para Pedidos" 
            value={restaurant.whatsapp} 
            onChange={e => setRestaurant({...restaurant, whatsapp: e.target.value})} 
            placeholder="5511999999999"
          />
          <Input 
            label="Endereço Completo" 
            className="md:col-span-2"
            value={restaurant.address} 
            onChange={e => setRestaurant({...restaurant, address: e.target.value})} 
          />
          <Input 
            label="Cidade" 
            value={restaurant.city} 
            onChange={e => setRestaurant({...restaurant, city: e.target.value})} 
          />
          <Input 
            label="Estado" 
            value={restaurant.state} 
            onChange={e => setRestaurant({...restaurant, state: e.target.value})} 
          />
          <Input 
            label="Horário de Funcionamento" 
            className="md:col-span-2"
            value={restaurant.openingHours} 
            onChange={e => setRestaurant({...restaurant, openingHours: e.target.value})} 
            placeholder="Ex: Seg a Sex das 18h às 23h"
          />
           <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Rodapé do Cardápio</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-brand-500 focus:border-brand-500"
              value={restaurant.footerText} 
              onChange={e => setRestaurant({...restaurant, footerText: e.target.value})} 
            />
          </div>
        </div>
      </Card>

      {/* Order Config */}
      <Card title="Configurações de Pedido">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
             <div>
               <h4 className="font-medium text-gray-900">Aceitar Pedidos</h4>
               <p className="text-sm text-gray-500">Desative para impedir novos pedidos temporariamente.</p>
             </div>
             <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  checked={orderConfig.acceptingOrders}
                  onChange={e => setOrderConfig({...orderConfig, acceptingOrders: e.target.checked})}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-brand-600 checked:translate-x-full"
                  style={{right: orderConfig.acceptingOrders ? '0' : 'auto', left: orderConfig.acceptingOrders ? 'auto' : '0'}}
                />
                <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${orderConfig.acceptingOrders ? 'bg-brand-600' : 'bg-gray-300'}`}></label>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Input 
              label="Pedido Mínimo (R$)" 
              type="number" 
              value={orderConfig.minOrderValue} 
              onChange={e => setOrderConfig({...orderConfig, minOrderValue: parseFloat(e.target.value)})}
            />
            <Input 
              label="Taxa de Entrega (R$)" 
              type="number" 
              value={orderConfig.deliveryFee} 
              onChange={e => setOrderConfig({...orderConfig, deliveryFee: parseFloat(e.target.value)})}
            />
            <Input 
              label="Tempo Estimado" 
              value={orderConfig.estimatedTime} 
              onChange={e => setOrderConfig({...orderConfig, estimatedTime: e.target.value})}
              placeholder="40-50 min"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formas de Pagamento Aceitas</label>
            <div className="flex flex-wrap gap-3">
              {Object.values(PaymentMethod).map(method => (
                <button
                  key={method}
                  onClick={() => togglePaymentMethod(method)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    orderConfig.paymentMethods.includes(method)
                      ? 'bg-brand-50 border-brand-500 text-brand-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {orderConfig.paymentMethods.includes(PaymentMethod.PIX) && (
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <Input 
                  label="Instruções para PIX" 
                  value={orderConfig.pixInstructions} 
                  onChange={e => setOrderConfig({...orderConfig, pixInstructions: e.target.value})}
                  placeholder="Chave PIX: ..."
                />
             </div>
          )}

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de Boas-vindas (WhatsApp)</label>
             <textarea 
               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
               rows={2}
               value={orderConfig.autoMessage}
               onChange={e => setOrderConfig({...orderConfig, autoMessage: e.target.value})}
             />
          </div>
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:static md:bg-transparent md:border-none md:p-0 flex justify-end z-40">
        <Button size="lg" className="w-full md:w-auto shadow-lg md:shadow-none" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
};