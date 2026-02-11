import React, { useState } from 'react';
import { ArrowLeft, DollarSign, FileText, MapPin, MessageCircle, Minus, Plus, Trash2, User } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency } from '../components/Formatters';
import { RESTAURANT_DATA } from '../constants';
import { useCart } from '../context/CartContext';
import { CustomerData } from '../types';

interface CheckoutPageProps {
  onBackToMenu: () => void;
  initialCustomerData?: Partial<CustomerData>;
  onProfile?: () => void;
}

type ApiOrderPayload = {
  success: boolean;
  whatsappUrl?: string;
  message?: string;
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToMenu, initialCustomerData, onProfile }) => {
  const { cart, cartCount, removeFromCart, updateQuantity, updateItemNotes, clearCart, cartTotal } = useCart();
  const { deliveryFee, minOrderValue, slug, isOpen } = RESTAURANT_DATA;
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generalNotes, setGeneralNotes] = useState('');
  const [customer, setCustomer] = useState<CustomerData>({
    name: initialCustomerData?.name || '',
    phone: initialCustomerData?.phone || '',
    address: initialCustomerData?.address || '',
    paymentMethod: 'credit',
    changeFor: '',
    reference: ''
  });

  const isValid =
    customer.name.trim().length > 1 &&
    customer.phone.trim().length > 7 &&
    customer.address.trim().length > 5 &&
    cart.length > 0 &&
    cartTotal >= minOrderValue;
  const canSubmitOrder = isValid && isOpen;

  async function handleSendOrder() {
    if (!canSubmitOrder || !slug) return;
    setSubmitting(true);

    const paymentMethodMap = {
      credit: 'card',
      debit: 'card',
      pix: 'pix',
      money: 'money'
    } as const;

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: slug,
        customerName: customer.name,
        customerWhatsapp: customer.phone,
        customerAddress: customer.address,
        paymentMethod: paymentMethodMap[customer.paymentMethod],
        generalNotes: [generalNotes, customer.reference ? `Ref: ${customer.reference}` : '', customer.changeFor ? `Troco: ${customer.changeFor}` : '']
          .filter(Boolean)
          .join(' | '),
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: [
            item.selectedFlavors?.length
              ? `Sabores: ${item.selectedFlavors.map((flavor) => flavor.name).join(' / ')}`
              : '',
            item.selectedCrust ? `Borda: ${item.selectedCrust.name}` : '',
            item.notes
          ]
            .filter(Boolean)
            .join(' | ')
        }))
      })
    });

    const payload = (await response.json().catch(() => null)) as ApiOrderPayload | null;
    if (!response.ok || !payload?.success) {
      alert(payload?.message || 'Nao foi possivel enviar o pedido.');
      setSubmitting(false);
      return;
    }

    if (payload.whatsappUrl) {
      window.open(payload.whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    clearCart();
    setShowConfirmation(true);
    setSubmitting(false);
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <MessageCircle size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pedido Enviado!</h1>
        <p className="text-gray-600 mb-8">Seu pedido foi criado e enviado para o restaurante.</p>
        <button
          onClick={() => {
            setShowConfirmation(false);
            onBackToMenu();
          }}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:bg-emerald-700 transition-colors"
        >
          Voltar ao Cardapio
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <h1 className="text-2xl font-bold text-slate-900">Carrinho</h1>
        </div>
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-400">
            <Trash2 size={28} />
          </div>
          <h2 className="mb-2 text-4xl font-black text-slate-900">Seu carrinho esta vazio</h2>
          <p className="mb-6 text-base text-slate-500">Adicione itens deliciosos do nosso cardapio.</p>
          <button
            onClick={onBackToMenu}
            className="rounded-xl bg-emerald-600 px-7 py-3.5 font-bold text-white shadow hover:bg-emerald-700"
          >
            Ver Cardapio
          </button>
        </div>

        <BottomNav
          activeTab="cart"
          onMenu={onBackToMenu}
          onCheckout={() => {}}
          onProfile={onProfile ?? onBackToMenu}
          cartCount={cartCount}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-[220px]">
      <div className="bg-white sticky top-0 z-20 shadow-sm px-4 py-3 flex items-center border-b">
        <button onClick={onBackToMenu} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="ml-2 font-bold text-lg text-gray-800">Finalizar Pedido</h1>
      </div>

      <div className="container mx-auto max-w-2xl p-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={18} /> Resumo do Pedido
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.cartId} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {(item.selectedFlavors?.length || item.selectedCrust) && (
                      <p className="mt-1 text-xs text-gray-500">
                        {item.selectedFlavors?.length ? `Sabores: ${item.selectedFlavors.map((flavor) => flavor.name).join(' / ')}` : ''}
                        {item.selectedFlavors?.length && item.selectedCrust ? ' | ' : ''}
                        {item.selectedCrust ? `Borda: ${item.selectedCrust.name}` : ''}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-emerald-600 mt-1">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.cartId, -1)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full">
                      <Minus size={14} />
                    </button>
                    <span className="font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartId, 1)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-emerald-600">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Observacao do item"
                  value={item.notes}
                  onChange={(e) => updateItemNotes(item.cartId, e.target.value)}
                  className="w-full text-sm border-b border-gray-200 py-1 focus:outline-none focus:border-emerald-500 bg-transparent text-gray-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <User size={18} /> Seus Dados
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <input type="text" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" placeholder="Seu nome" />
            <input type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" placeholder="WhatsApp" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <MapPin size={18} /> Entrega
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <textarea value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg h-24 resize-none" placeholder="Endereco completo" />
            <input type="text" value={customer.reference} onChange={(e) => setCustomer({ ...customer, reference: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" placeholder="Ponto de referencia (opcional)" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign size={18} /> Pagamento
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCustomer({ ...customer, paymentMethod: 'credit' })} className={`p-3 rounded-lg border text-sm font-medium ${customer.paymentMethod === 'credit' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>Cartao Credito</button>
              <button onClick={() => setCustomer({ ...customer, paymentMethod: 'debit' })} className={`p-3 rounded-lg border text-sm font-medium ${customer.paymentMethod === 'debit' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>Cartao Debito</button>
              <button onClick={() => setCustomer({ ...customer, paymentMethod: 'pix' })} className={`p-3 rounded-lg border text-sm font-medium ${customer.paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>Pix</button>
              <button onClick={() => setCustomer({ ...customer, paymentMethod: 'money' })} className={`p-3 rounded-lg border text-sm font-medium ${customer.paymentMethod === 'money' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>Dinheiro</button>
            </div>
            {customer.paymentMethod === 'money' && (
              <input type="text" value={customer.changeFor || ''} onChange={(e) => setCustomer({ ...customer, changeFor: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" placeholder="Troco para quanto?" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Observacoes Gerais</h2>
          </div>
          <div className="p-4">
            <textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg h-20 resize-none" placeholder="Observacao geral do pedido" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg z-30">
        <div className="container mx-auto max-w-2xl">
          <div className="space-y-1 mb-4 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Taxa de Entrega</span><span>{formatCurrency(deliveryFee)}</span></div>
            <div className="flex justify-between font-bold text-lg text-gray-800 pt-2 border-t border-dashed"><span>Total</span><span>{formatCurrency(cartTotal + deliveryFee)}</span></div>
          </div>
          {cartTotal < minOrderValue && (
            <p className="text-center text-red-500 text-xs bg-red-50 py-1 rounded mb-2">Pedido minimo: {formatCurrency(minOrderValue)}</p>
          )}
          {!isOpen && (
            <p className="text-center text-red-500 text-xs bg-red-50 py-1 rounded mb-2">Loja fechada no momento para novos pedidos.</p>
          )}
          <button
            onClick={handleSendOrder}
            disabled={!canSubmitOrder || submitting}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${
              canSubmitOrder && !submitting ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <MessageCircle size={20} />
            {submitting ? 'Enviando...' : 'Enviar Pedido'}
          </button>
        </div>
      </div>

      <BottomNav
        activeTab="cart"
        onMenu={onBackToMenu}
        onCheckout={() => {}}
        onProfile={onProfile ?? onBackToMenu}
        cartCount={cartCount}
      />
    </div>
  );
};
