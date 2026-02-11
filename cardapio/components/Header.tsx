import React from 'react';
import { RESTAURANT_DATA } from '../constants';
import { Clock, MapPin } from 'lucide-react';

export const Header: React.FC = () => {
  const { name, coverUrl, isOpen, openingHours, address } = RESTAURANT_DATA;

  return (
    <div className="bg-white shadow-sm pb-4">
      <div 
        className="h-32 md:h-48 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${coverUrl})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>
      
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isOpen ? 'Aberto agora' : 'Fechado'}
                    </span>
                </div>
                
                <div className="mt-2 text-sm text-gray-600 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{openingHours}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};