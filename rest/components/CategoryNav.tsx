import React from 'react';
import { CATEGORIES } from '../constants';

interface Props {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  hasCampaignProducts?: boolean;
}

export const CategoryNav: React.FC<Props> = ({ activeCategory, onSelectCategory, hasCampaignProducts = false }) => {
  return (
    <div className="sticky top-0 bg-white z-20 shadow-sm border-b border-gray-100">
      <div className="container-custom">
        <div className="flex overflow-x-auto no-scrollbar py-3 gap-3">
          <button
            onClick={() => onSelectCategory('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {hasCampaignProducts && (
            <button
              onClick={() => onSelectCategory('campaign')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'campaign'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Em campanha
            </button>
          )}
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
