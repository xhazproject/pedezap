import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { RESTAURANT_DATA } from '../constants';
import { formatCurrency } from '../components/Formatters';
import { ArrowLeft, Trash2, Plus, Minus, MessageCircle, MapPin, User, DollarSign, FileText } from 'lucide-react';
import { CustomerData } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, updateItemNotes, clearCart, cartTotal } = useCart();
  const { deliveryFee, whatsappNumber, name: restaurantName, minOrderValue } = RESTAURANT_DATA;

  // Form State
  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'credit',
    changeFor: '',
    reference: ''
  });
  const [generalNotes, setGeneralNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Validation
  const isValid = 
    customer.name.trim().length > 0 &&
    customer.phone.trim().length > 0 &&
    customer.address.trim().length > 0 &&
    cart.length > 0 &&
    cartTotal >= minOrderValue;

  const handleSendOrder = () => {
    if (!isValid) return;

    // Build the Message
    const total = cartTotal + deliveryFee;
    let message = `*NOVO PEDIDO - ${restaurantName}*\n`;
    message += `--------------------------------\n`;
    
    cart.forEach((item) => {
      message += `${item.quantity}x ${item.name} (${formatCurrency(item.price)})\n`;
      if (item.notes) message += `   Obs: ${item.notes}\n`;
    });
    
    message += `--------------------------------\n`;
    message += `Subtotal: ${formatCurrency(cartTotal)}\n`;
    message += `Taxa de Entrega: ${formatCurrency(deliveryFee)}\n`;
    message += `*TOTAL: ${formatCurrency(total)}*\n\n`;
    
    message += `*DADOS DO CLIENTE*\n`;
    message += `Nome: ${customer.name}\n`;
    message += `Telefone: ${customer.phone}\n`;
    message += `Endereço: ${customer.address}\n`;
    if (customer.reference) message += `Ref: ${customer.reference}\n`;
    
    message += `\n*PAGAMENTO*\n`;
    const paymentLabels = {
        'credit': 'Cartão de Crédito',
        'debit': 'Cartão de Débito',
        'pix': 'PIX',
        'money': 'Dinheiro'
    };
    message += `Forma: ${paymentLabels[customer.paymentMethod]}\n`;
    if (customer.paymentMethod === 'money' && customer.changeFor) {
        message += `Troco para: ${customer.changeFor}\n`;
    }

    if (generalNotes) {
        message += `\n*OBSERVAÇÃO GERAL*\n${generalNotes}\n`;
    }

    // Encode and Open WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
    setShowConfirmation(true);
    clearCart();
  };

  if (showConfirmation) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <MessageCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Pedido Enviado!</h1>
            <p className="text-gray-600 mb-8">
                Seu pedido foi gerado e aberto no WhatsApp do restaurante. Aguarde a confirmação do atendente.
            </p>
            <button 
                onClick={() => { setShowConfirmation(false); navigate('/'); }}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:bg-emerald-700 transition-colors"
            >
                Voltar ao Cardápio
            </button>
        </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 border-b">
            <button onClick={() => navigate('/')} className="flex items-center text-gray-600">
                <ArrowLeft size={20} className="mr-2" /> Voltar
            </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <Trash2 size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-6">Adicione itens deliciosos do nosso cardápio.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium shadow hover:bg-emerald-700"
          >
            Ver Cardápio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
        {/* Header */}
      <div className="bg-white sticky top-0 z-20 shadow-sm px-4 py-3 flex items-center border-b">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="ml-2 font-bold text-lg text-gray-800">Finalizar Pedido</h1>
      </div>

      <div className="container mx-auto max-w-2xl p-4 space-y-6">
        
        {/* Cart Items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FileText size={18} /> Resumo do Pedido
                </h2>
            </div>
            <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                    <div key={item.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-medium text-gray-900">{item.name}</h3>
                                <p className="text-sm font-semibold text-emerald-600">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                            <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-400 p-1 hover:bg-red-50 rounded"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                             <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-600 active:scale-95"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="font-medium w-4 text-center">{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-emerald-600 active:scale-95"
                                >
                                    <Plus size={14} />
                                </button>
                             </div>
                             <div className="text-xs text-gray-500">
                                {item.quantity} x {formatCurrency(item.price)}
                             </div>
                        </div>

                        <div className="mt-3">
                            <input 
                                type="text" 
                                placeholder="Observação (ex: sem cebola)"
                                value={item.notes}
                                onChange={(e) => updateItemNotes(item.id, e.target.value)}
                                className="w-full text-sm border-b border-gray-200 py-1 focus:outline-none focus:border-emerald-500 bg-transparent text-gray-600 placeholder-gray-400"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Customer Details Form */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                    <User size={18} /> Seus Dados
                </h2>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome *</label>
                    <input 
                        type="text" 
                        value={customer.name}
                        onChange={(e) => setCustomer({...customer, name: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="Como deseja ser chamado?"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Telefone *</label>
                    <input 
                        type="tel" 
                        value={customer.phone}
                        onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="(11) 99999-9999"
                    />
                </div>
            </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin size={18} /> Entrega
                </h2>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo *</label>
                    <textarea 
                        value={customer.address}
                        onChange={(e) => setCustomer({...customer, address: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none h-24 resize-none"
                        placeholder="Rua, Número, Bairro, Complemento"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência (Opcional)</label>
                    <input 
                        type="text" 
                        value={customer.reference}
                        onChange={(e) => setCustomer({...customer, reference: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="Próximo à..."
                    />
                </div>
            </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign size={18} /> Pagamento
                </h2>
            </div>
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setCustomer({...customer, paymentMethod: 'credit'})}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${customer.paymentMethod === 'credit' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        Cartão de Crédito
                    </button>
                    <button 
                        onClick={() => setCustomer({...customer, paymentMethod: 'debit'})}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${customer.paymentMethod === 'debit' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        Cartão de Débito
                    </button>
                    <button 
                        onClick={() => setCustomer({...customer, paymentMethod: 'pix'})}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${customer.paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        PIX
                    </button>
                    <button 
                        onClick={() => setCustomer({...customer, paymentMethod: 'money'})}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${customer.paymentMethod === 'money' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        Dinheiro
                    </button>
                </div>

                {customer.paymentMethod === 'money' && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precisa de troco para quanto?</label>
                        <input 
                            type="text" 
                            value={customer.changeFor || ''}
                            onChange={(e) => setCustomer({...customer, changeFor: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="Ex: R$ 50,00 ou 'Não precisa'"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* General Notes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-700">Observações Gerais</h2>
            </div>
            <div className="p-4">
                 <textarea 
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none h-20 resize-none"
                    placeholder="Alguma instrução especial para a entrega ou preparo?"
                />
            </div>
        </div>

      </div>

      {/* Footer Totals & Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg z-30">
        <div className="container mx-auto max-w-2xl">
            <div className="space-y-1 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Taxa de Entrega</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-800 pt-2 border-t border-dashed">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal + deliveryFee)}</span>
                </div>
            </div>

            <div className="space-y-2">
                {cartTotal < minOrderValue && (
                     <p className="text-center text-red-500 text-xs bg-red-50 py-1 rounded">
                        Pedido mínimo: {formatCurrency(minOrderValue)}
                    </p>
                )}
                
                <button
                    onClick={handleSendOrder}
                    disabled={!isValid}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                        isValid 
                        ? 'bg-green-600 hover:bg-green-700 active:scale-98' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                    <MessageCircle size={20} />
                    Enviar Pedido pelo WhatsApp
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};