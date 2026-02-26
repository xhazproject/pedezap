import React, { useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { Header } from '../components/Header';
import { OffersCarousel } from '../components/OffersCarousel';
import { CategoryNav } from '../components/CategoryNav';
import { ProductCard } from '../components/ProductCard';
import { FeaturedProductCard } from '../components/FeaturedProductCard';
import { BottomNav } from '../components/BottomNav';
import { ProductModal } from '../components/ProductModal';
import { StoreInfoModal } from '../components/StoreInfoModal';
import { CATEGORIES, OFFERS, PRODUCTS, RESTAURANT_DATA } from '../constants';
import { useCart } from '../context/CartContext';
import { Offer, PizzaCrust, PizzaFlavor, Product, ProductComplement, SelectedAcaiOption } from '../types';

interface MenuPageProps {
  onCheckout: () => void;
  onProfile: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ onCheckout, onProfile }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStoreInfoOpen, setIsStoreInfoOpen] = useState(false);
  const { addToCart, cartCount } = useCart();
  const { slug } = RESTAURANT_DATA;
  const campaignProductsCount = useMemo(() => PRODUCTS.filter((item) => item.isInCampaign).length, []);

  const filteredProducts = useMemo(() => {
    let base = PRODUCTS;
    if (activeOffer?.productIds?.length) {
      const linkedIds = new Set(activeOffer.productIds);
      base = base.filter((item) => linkedIds.has(item.id));
    }
    if (activeCategory === 'campaign') {
      base = base.filter((item) => item.isInCampaign);
    } else if (activeCategory !== 'all') {
      base = base.filter((item) => item.categoryId === activeCategory);
    }
    return base;
  }, [activeCategory, activeOffer]);

  const featuredProducts = useMemo(() => PRODUCTS.filter((item) => item.isFeatured), []);

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleConfirmProduct = (payload: {
    quantity: number;
    notes: string;
    flavors?: PizzaFlavor[];
    crust?: PizzaCrust;
    complements?: ProductComplement[];
    acaiOptions?: SelectedAcaiOption[];
  }) => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, {
      quantity: payload.quantity,
      notes: payload.notes,
      flavors: payload.flavors,
      crust: payload.crust,
      complements: payload.complements,
      acaiOptions: payload.acaiOptions
    });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header onOpenStoreInfo={() => setIsStoreInfoOpen(true)} />
      {OFFERS.length > 0 && (
        <div className="border-b border-slate-100 bg-white">
          <OffersCarousel
            onSelectOffer={(offer) => {
              try {
                if (slug) {
                  localStorage.setItem(
                    `pedezap_marketing_attribution_${slug}`,
                    JSON.stringify({
                      trafficSource: 'banner',
                      utmSource: offer.utmSource || 'catalogo',
                      utmMedium: offer.utmMedium || 'banner',
                      utmCampaign: offer.utmCampaign || offer.campaignId || undefined,
                      utmContent: offer.utmContent || offer.id,
                      couponCode: offer.couponCode,
                      attributionBannerId: offer.id,
                      attributionCampaignId: offer.campaignId,
                      capturedAt: new Date().toISOString()
                    })
                  );
                  void fetch(`/api/restaurants/${slug}/banner-click`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      bannerId: offer.id,
                      campaignId: offer.campaignId
                    })
                  }).catch(() => undefined);
                }
              } catch {}
              setActiveOffer(offer);
              setActiveCategory('all');
              window.scrollTo({ top: 320, behavior: 'smooth' });
            }}
          />
        </div>
      )}
      <CategoryNav
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        hasCampaignProducts={campaignProductsCount > 0}
      />

      <div className="container-custom mt-8 space-y-10">
        {activeOffer && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Filtro por banner: {activeOffer.title}</p>
              <p className="text-xs text-emerald-700">Mostrando produtos vinculados a esta promocao.</p>
            </div>
            <button
              onClick={() => setActiveOffer(null)}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Ver todos
            </button>
          </div>
        )}

        {activeCategory === 'all' && featuredProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pl-1">
              <div className="rounded-full bg-orange-100 p-1.5">
                <Flame className="fill-orange-500 text-orange-500" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Destaques da Casa</h2>
            </div>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4 pt-1">
              {featuredProducts.map((product) => (
                <FeaturedProductCard
                  key={`featured-${product.id}`}
                  product={product}
                  onOpenModal={handleOpenModal}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-6 flex items-center justify-between border-l-4 border-emerald-500 pl-1">
            <h2 className="pl-3 text-xl font-bold text-slate-800">
              {activeCategory === 'all'
                ? 'Cardapio Completo'
                : activeCategory === 'campaign'
                ? 'Produtos em Campanha'
                : CATEGORIES.find((item) => item.id === activeCategory)?.name}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
              {filteredProducts.length} itens
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onOpenModal={handleOpenModal} />
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <div className="mb-2 text-6xl text-slate-300">🍽️</div>
                <p className="font-medium text-slate-500">Nenhum produto encontrado nesta categoria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav
        activeTab="menu"
        onMenu={() => {}}
        onCheckout={onCheckout}
        onProfile={onProfile}
        cartCount={cartCount}
      />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmProduct}
        />
      )}

      <StoreInfoModal isOpen={isStoreInfoOpen} onClose={() => setIsStoreInfoOpen(false)} />
    </div>
  );
};
