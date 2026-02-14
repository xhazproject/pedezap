import React, { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, Square, X } from 'lucide-react';
import { AcaiComplementGroup, PizzaCrust, PizzaFlavor, Product, ProductComplement, SelectedAcaiOption } from '../types';
import { formatCurrency } from './Formatters';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    quantity: number;
    notes: string;
    flavors?: PizzaFlavor[];
    crust?: PizzaCrust;
    complements?: ProductComplement[];
    acaiOptions?: SelectedAcaiOption[];
  }) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  const [selectedCrustId, setSelectedCrustId] = useState<string>('');
  const [selectedComplementIds, setSelectedComplementIds] = useState<string[]>([]);
  const [selectedAcaiItems, setSelectedAcaiItems] = useState<Record<string, Record<string, number>>>({});

  const isPizza = Boolean(product.isPizza && product.pizzaFlavors?.length);
  const pizzaFlavors = product.pizzaFlavors ?? [];
  const pizzaCrusts = product.pizzaCrusts ?? [];
  const complements = product.complements ?? [];
  const acaiGroups = product.acaiComplementGroups ?? [];
  const isAcai = product.kind === 'acai' && acaiGroups.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    setQuantity(1);
    setNotes('');
    setSelectedFlavorIds([]);
    setSelectedCrustId('');
    setSelectedComplementIds([]);
    setSelectedAcaiItems({});
  }, [isOpen, product.id]);

  const selectedFlavors = useMemo(
    () => pizzaFlavors.filter((flavor) => selectedFlavorIds.includes(flavor.id)),
    [pizzaFlavors, selectedFlavorIds]
  );

  const selectedCrust = useMemo(
    () => pizzaCrusts.find((crust) => crust.id === selectedCrustId),
    [pizzaCrusts, selectedCrustId]
  );

  const selectedComplements = useMemo(
    () => complements.filter((complement) => selectedComplementIds.includes(complement.id)),
    [complements, selectedComplementIds]
  );

  const selectedAcaiOptions = useMemo<SelectedAcaiOption[]>(() => {
    if (!isAcai) return [];
    return acaiGroups
      .map((group: AcaiComplementGroup) => {
        const groupSelection = selectedAcaiItems[group.id] ?? {};
        const items = group.items
          .map((item) => ({
            ...item,
            quantity: groupSelection[item.id] ?? 0
          }))
          .filter((item) => item.quantity > 0);
        return {
          groupId: group.id,
          groupName: group.name,
          items
        };
      })
      .filter((group) => group.items.length > 0);
  }, [isAcai, acaiGroups, selectedAcaiItems]);

  const unitPrice = useMemo(() => {
    const complementsTotal = selectedComplements.reduce((sum, item) => sum + (item.price ?? 0), 0);
    const acaiOptionsTotal = selectedAcaiOptions.reduce(
      (groupsTotal, group) =>
        groupsTotal +
        group.items.reduce((itemsTotal, item) => itemsTotal + (item.price ?? 0) * (item.quantity ?? 0), 0),
      0
    );

    if (!isPizza) return product.price + complementsTotal + acaiOptionsTotal;
    if (!selectedFlavors.length) return 0;
    const totalFlavorPrice = selectedFlavors.reduce((sum, flavor) => sum + (flavor.price ?? 0), 0);
    const pizzaPrice = totalFlavorPrice / selectedFlavors.length;
    return pizzaPrice + (selectedCrust?.price ?? 0) + complementsTotal + acaiOptionsTotal;
  }, [isPizza, product.price, selectedFlavors, selectedCrust, selectedComplements, selectedAcaiOptions]);

  const total = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const acaiRulesValid = useMemo(() => {
    if (!isAcai) return true;
    return acaiGroups.every((group) => {
      const groupSelection = selectedAcaiItems[group.id] ?? {};
      const totalChosen = Object.values(groupSelection).reduce((sum, qty) => sum + qty, 0);
      return totalChosen >= group.minSelect && totalChosen <= group.maxSelect;
    });
  }, [isAcai, acaiGroups, selectedAcaiItems]);

  const canAdd = (!isPizza || selectedFlavors.length > 0) && acaiRulesValid;

  const toggleFlavor = (flavorId: string) => {
    setSelectedFlavorIds((prev) => {
      if (prev.includes(flavorId)) {
        return prev.filter((item) => item !== flavorId);
      }
      if (prev.length >= 2) return prev;
      return [...prev, flavorId];
    });
  };

  const toggleComplement = (complementId: string) => {
    setSelectedComplementIds((prev) =>
      prev.includes(complementId)
        ? prev.filter((item) => item !== complementId)
        : [...prev, complementId]
    );
  };

  const changeAcaiItemQty = (groupId: string, itemId: string, delta: number) => {
    setSelectedAcaiItems((prev) => {
      const group = acaiGroups.find((entry) => entry.id === groupId);
      const item = group?.items.find((entry) => entry.id === itemId);
      if (!group || !item) return prev;

      const currentGroup = { ...(prev[groupId] ?? {}) };
      const currentQty = currentGroup[itemId] ?? 0;
      const nextQty = Math.max(0, currentQty + delta);
      const groupTotalWithoutCurrent =
        Object.entries(currentGroup).reduce((sum, [id, qty]) => (id === itemId ? sum : sum + qty), 0);

      if (nextQty > item.maxQty) return prev;
      if (groupTotalWithoutCurrent + nextQty > group.maxSelect) return prev;

      const nextGroup = { ...currentGroup, [itemId]: nextQty };
      if (nextQty === 0) delete nextGroup[itemId];
      return { ...prev, [groupId]: nextGroup };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-3xl font-black text-slate-900">{product.name}</h3>
            <p className="text-sm text-slate-500">Detalhes do item</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          {product.imageUrl && (
            <div className="h-48 w-full overflow-hidden rounded-xl bg-slate-100">
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-base leading-relaxed text-slate-600">{product.description}</p>

          {isPizza && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Escolha os sabores</p>
                <p className="text-xs text-slate-500">
                  Selecione 1 sabor inteiro ou 2 para meia/meia. O valor da pizza fica pela media dos sabores.
                </p>
              </div>
              <div className="space-y-2">
                {pizzaFlavors.map((flavor) => {
                  const active = selectedFlavorIds.includes(flavor.id);
                  return (
                    <button
                      key={flavor.id}
                      type="button"
                      onClick={() => toggleFlavor(flavor.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{flavor.name}</p>
                          <p className="text-xs text-slate-500">{flavor.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-700">{formatCurrency(flavor.price ?? 0)}</p>
                          {active && <Check size={15} className="ml-auto mt-1 text-emerald-600" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {pizzaCrusts.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-sm font-semibold text-slate-900">Borda recheada (opcional)</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCrustId('')}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        !selectedCrustId ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      Sem borda
                    </button>
                    {pizzaCrusts.map((crust) => (
                      <button
                        key={crust.id}
                        type="button"
                        onClick={() => setSelectedCrustId(crust.id)}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                          selectedCrustId === crust.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">{crust.name}</span>
                          <span className="font-bold text-emerald-700">+ {formatCurrency(crust.price)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {complements.length > 0 && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Complementos</p>
                <p className="text-xs text-slate-500">Selecione os adicionais desejados.</p>
              </div>
              <div className="space-y-2">
                {complements.map((complement) => {
                  const active = selectedComplementIds.includes(complement.id);
                  return (
                    <button
                      key={complement.id}
                      type="button"
                      onClick={() => toggleComplement(complement.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-900">{complement.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-700">+ {formatCurrency(complement.price)}</span>
                          {active && <Check size={15} className="text-emerald-600" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isAcai && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Complementos do Acai</p>
                <p className="text-xs text-slate-500">
                  Siga os limites de cada categoria. Item com valor R$ 0,00 nao adiciona custo.
                </p>
              </div>
              <div className="space-y-3">
                {acaiGroups.map((group) => {
                  const groupSelection = selectedAcaiItems[group.id] ?? {};
                  const groupTotal = Object.values(groupSelection).reduce((sum, qty) => sum + qty, 0);
                  const groupValid = groupTotal >= group.minSelect && groupTotal <= group.maxSelect;
                  return (
                    <div key={group.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{group.name}</p>
                          <p className="text-xs text-slate-500">
                            Escolha de {group.minSelect} ate {group.maxSelect} itens | Selecionados: {groupTotal}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            groupValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {groupValid ? 'OK' : 'Ajustar'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((item) => {
                          const qty = groupSelection[item.id] ?? 0;
                          return (
                            <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-500">
                                  + {formatCurrency(item.price)} | max {item.maxQty}x
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => changeAcaiItemQty(group.id, item.id, -1)}
                                  className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold text-slate-900">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => changeAcaiItemQty(group.id, item.id, 1)}
                                  className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-3">
            <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Square size={14} />
              Alguma observacao?
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex: Tirar a cebola, maionese a parte, ponto da carne..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="px-3 py-2 text-slate-500 hover:text-slate-700"
              >
                <Minus size={18} />
              </button>
              <span className="min-w-10 text-center text-lg font-bold text-slate-900">{quantity}</span>
              <button onClick={() => setQuantity((prev) => prev + 1)} className="px-3 py-2 text-emerald-600 hover:text-emerald-700">
                <Plus size={18} />
              </button>
            </div>
            <button
              onClick={() =>
                onConfirm({
                  quantity,
                  notes,
                  flavors: selectedFlavors.length ? selectedFlavors : undefined,
                  crust: selectedCrust,
                  complements: selectedComplements.length ? selectedComplements : undefined,
                  acaiOptions: selectedAcaiOptions.length ? selectedAcaiOptions : undefined
                })
              }
              disabled={!canAdd}
              className="flex flex-1 items-center justify-between rounded-xl bg-emerald-600 px-5 py-3 text-left font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <span>{canAdd ? 'Adicionar' : isPizza && !selectedFlavors.length ? 'Selecione ao menos 1 sabor' : 'Revise as regras dos complementos'}</span>
              <span className="text-xl">{formatCurrency(total)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
