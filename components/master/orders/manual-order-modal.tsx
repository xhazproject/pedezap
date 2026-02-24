'use client';

import { X } from 'lucide-react';

type ManualOrderPaymentMethod = 'money' | 'card' | 'pix';

type ManualOrderItem = {
  productId: string;
  quantity: number;
};

type ManualOrderForm = {
  customerName: string;
  customerWhatsapp: string;
  customerAddress: string;
  paymentMethod: ManualOrderPaymentMethod;
  items: ManualOrderItem[];
};

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type Props = {
  open: boolean;
  form: ManualOrderForm;
  setForm: (updater: (prev: ManualOrderForm) => ManualOrderForm) => void;
  selectedProductId: string;
  setSelectedProductId: (value: string) => void;
  selectedQuantity: number;
  setSelectedQuantity: (value: number) => void;
  products: ProductOption[];
  total: number;
  creating: boolean;
  onClose: () => void;
  onAddItem: () => void;
  onRemoveItem: (productId: string) => void;
  onCreate: () => void;
};

export function ManualOrderModal({
  open,
  form,
  setForm,
  selectedProductId,
  setSelectedProductId,
  selectedQuantity,
  setSelectedQuantity,
  products,
  total,
  creating,
  onClose,
  onAddItem,
  onRemoveItem,
  onCreate
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-gray-900">Novo Pedido Manual</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 flex-1 overflow-y-auto">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Dados do Cliente</h4>
            <div>
              <label className="text-sm text-gray-700">Nome do Cliente</label>
              <input
                value={form.customerName}
                onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
                placeholder="Ex: Joao Silva"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Telefone / WhatsApp</label>
              <input
                value={form.customerWhatsapp}
                onChange={(event) => setForm((prev) => ({ ...prev, customerWhatsapp: event.target.value }))}
                placeholder="Ex: 11999999999"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Endereco de Entrega</label>
              <textarea
                value={form.customerAddress}
                onChange={(event) => setForm((prev) => ({ ...prev, customerAddress: event.target.value }))}
                placeholder="Rua, Numero, Bairro, Complemento..."
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Forma de Pagamento</label>
              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: event.target.value as ManualOrderPaymentMethod
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                <option value="money">Dinheiro</option>
                <option value="card">Cartao</option>
                <option value="pix">PIX</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Itens do Pedido</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_82px_auto]">
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                <option value="">Selecione um produto...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - R$ {product.price.toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={selectedQuantity}
                onChange={(event) => setSelectedQuantity(Number(event.target.value) || 1)}
                className="w-full rounded-lg border border-gray-300 px-2 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={onAddItem}
                className="w-full rounded-lg bg-slate-100 px-3 py-2.5 text-slate-900 text-sm font-semibold hover:bg-slate-200"
              >
                Adicionar
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 min-h-[180px] max-h-[220px] overflow-y-auto p-3">
              {form.items.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">Nenhum item adicionado</div>
              ) : (
                <div className="space-y-2">
                  {form.items.map((item) => {
                    const product = products.find((entry) => entry.id === item.productId);
                    if (!product) return null;
                    return (
                      <div
                        key={item.productId}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.quantity}x {product.name}
                          </p>
                          <p className="text-xs text-gray-500">R$ {(product.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.productId)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Remover
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-gray-800">TOTAL DO PEDIDO</span>
              <span className="text-2xl font-bold text-slate-900 sm:text-3xl">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            onClick={onCreate}
            disabled={creating}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60 sm:w-auto"
          >
            {creating ? 'Criando...' : 'Criar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

