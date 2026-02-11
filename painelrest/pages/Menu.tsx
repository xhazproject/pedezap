import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MockService } from '../services/mockData';
import { Category, Product } from '../types';
import { Edit2, Trash2, Plus, Image as ImageIcon, Copy, ArrowUp, ArrowDown } from 'lucide-react';

export const Menu: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Edit States
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const cats = await MockService.getCategories();
    const prods = await MockService.getProducts();
    setCategories(cats.sort((a, b) => a.order - b.order));
    setProducts(prods.sort((a, b) => a.order - b.order));
    if (!activeCategoryId && cats.length > 0) setActiveCategoryId(cats[0].id);
  };

  // --- Category Handlers ---
  const handleSaveCategory = async () => {
    if (editingCategory && editingCategory.name) {
      await MockService.saveCategory(editingCategory as Category);
      setEditingCategory(null);
      loadData();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza? Produtos desta categoria também podem ser afetados.')) {
      await MockService.deleteCategory(id);
      loadData();
    }
  };

  // --- Product Handlers ---
  const handleSaveProduct = async () => {
    if (editingProduct && editingProduct.name && editingProduct.price && editingProduct.categoryId) {
      await MockService.saveProduct(editingProduct as Product);
      setEditingProduct(null);
      loadData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Excluir este produto?')) {
      await MockService.deleteProduct(id);
      loadData();
    }
  };

  const handleDuplicateProduct = async (id: string) => {
    await MockService.duplicateProduct(id);
    loadData();
  };

  const filteredProducts = products.filter(p => p.categoryId === activeCategoryId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Categories Sidebar */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden" title="Categorias" action={
          <Button size="sm" onClick={() => setEditingCategory({ active: true, order: categories.length + 1 })}>
            <Plus size={16} className="mr-1" /> Nova
          </Button>
        }>
          <div className="flex-1 overflow-y-auto space-y-2 p-1">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${activeCategoryId === cat.id ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50 border border-transparent'}`}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cat.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }} className="p-1.5 text-gray-400 hover:text-brand-600 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Products Main Area */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden" 
          title={categories.find(c => c.id === activeCategoryId)?.name || 'Produtos'}
          action={
            <Button size="sm" onClick={() => activeCategoryId && setEditingProduct({ categoryId: activeCategoryId, active: true, order: filteredProducts.length + 1 })}>
              <Plus size={16} className="mr-1" /> Novo Produto
            </Button>
          }
        >
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="bg-gray-100 p-4 rounded-full mb-3"><ImageIcon size={32} /></div>
              <p>Nenhum produto nesta categoria</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 p-1">
              {filteredProducts.map(product => (
                <div key={product.id} className="border border-gray-100 rounded-lg p-4 flex gap-4 bg-white hover:shadow-sm transition-shadow">
                  <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden relative">
                    {product.image ? (
                       <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>
                    )}
                    {!product.active && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs font-bold text-gray-600">INATIVO</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                      <span className="font-bold text-brand-700">R$ {product.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                    <div className="mt-3 flex gap-2">
                       <Button variant="ghost" size="sm" className="px-2" onClick={() => setEditingProduct(product)}>
                         <Edit2 size={14} className="mr-1" /> Editar
                       </Button>
                       <Button variant="ghost" size="sm" className="px-2" onClick={() => handleDuplicateProduct(product.id)}>
                         <Copy size={14} className="mr-1" /> Duplicar
                       </Button>
                       <Button variant="ghost" size="sm" className="px-2 text-red-600 hover:bg-red-50" onClick={() => handleDeleteProduct(product.id)}>
                         <Trash2 size={14} />
                       </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md" title={editingCategory.id ? 'Editar Categoria' : 'Nova Categoria'}>
            <div className="space-y-4">
              <Input 
                label="Nome da Categoria" 
                value={editingCategory.name || ''} 
                onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} 
                autoFocus
              />
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="catActive"
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  checked={editingCategory.active !== false}
                  onChange={e => setEditingCategory({...editingCategory, active: e.target.checked})}
                />
                <label htmlFor="catActive" className="text-sm text-gray-700">Categoria Ativa</label>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                <Button onClick={handleSaveCategory}>Salvar</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" title={editingProduct.id ? 'Editar Produto' : 'Novo Produto'}>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 cursor-pointer border-2 border-dashed border-gray-300 hover:border-brand-500 hover:text-brand-500 transition-colors relative overflow-hidden group">
                   {editingProduct.image ? <img src={editingProduct.image} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}
                   <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10">
                     <span className="text-xs text-transparent group-hover:text-white">Alterar</span>
                   </div>
                </div>
                <div className="flex-1 space-y-4">
                   <Input 
                      label="Nome" 
                      value={editingProduct.name || ''} 
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                   />
                   <Input 
                      label="Preço (R$)" 
                      type="number"
                      step="0.01"
                      value={editingProduct.price || ''} 
                      onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} 
                   />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select 
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={editingProduct.categoryId}
                  onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="prodActive"
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  checked={editingProduct.active !== false}
                  onChange={e => setEditingProduct({...editingProduct, active: e.target.checked})}
                />
                <label htmlFor="prodActive" className="text-sm text-gray-700">Produto Ativo</label>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                <Button onClick={handleSaveProduct}>Salvar Produto</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};