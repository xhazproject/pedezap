import React from 'react';
import { OFFERS } from '../constants';
import { Offer } from '../types';

interface OffersCarouselProps {
  onSelectOffer?: (offer: Offer) => void;
}

export const OffersCarousel: React.FC<OffersCarouselProps> = ({ onSelectOffer }) => {
  return (
    <div className="mt-5 mb-3">
      <div className="container-custom">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {OFFERS.map((offer) => (
            <button
              key={offer.id} 
              type="button"
              onClick={() => onSelectOffer?.(offer)}
              className="relative min-w-[260px] w-[260px] md:min-w-[300px] md:w-[300px] h-28 md:h-32 rounded-2xl overflow-hidden shadow-md flex-shrink-0"
            >
              <img 
                src={offer.imageUrl} 
                alt={offer.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                <h3 className="text-white font-bold text-xl leading-none">{offer.title}</h3>
                <p className="text-gray-200 text-sm font-medium">{offer.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
