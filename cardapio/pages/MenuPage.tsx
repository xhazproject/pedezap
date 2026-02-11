import React, { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { CategoryNav } from '../components/CategoryNav';
import { ProductCard } from '../components/ProductCard';
import { StickyCart } from '../components/StickyCart';
import { PRODUCTS, CATEGORIES } from '../constants';

export const MenuPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return PRODUCTS;
    return PRODUCTS.filter((p) => p.categoryId === activeCategory);
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header />
      <CategoryNav 
        activeCategory={activeCategory} 
        onSelectCategory={setActiveCategory} 
      />

      <div className="container mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Cardápio</h2>
            <span className="text-xs text-gray-500">{filteredProducts.length} itens</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
                <p>Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </div>
      
      <StickyCart />
    </div>
  );
};