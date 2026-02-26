'use client';

import { useEffect, useState } from 'react';
import { Restaurant } from '@/lib/store-data';
import { configureRestaurantMenuData } from '@/rest/constants';
import { CartProvider } from '@/rest/context/CartContext';
import { AuthPage } from '@/rest/pages/AuthPage';
import { CheckoutPage } from '@/rest/pages/CheckoutPage';
import { MenuPage } from '@/rest/pages/MenuPage';
import { ProfilePage } from '@/rest/pages/ProfilePage';

type CustomerSession = {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  neighborhood: string;
};

type MarketingAttributionSession = {
  trafficSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  couponCode?: string;
  attributionBannerId?: string;
  attributionCampaignId?: string;
  capturedAt: string;
};

function sessionStorageKey(slug: string) {
  return `pedezap_customer_session_${slug}`;
}

function attributionStorageKey(slug: string) {
  return `pedezap_marketing_attribution_${slug}`;
}

export function RestaurantClient({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'menu' | 'auth' | 'checkout' | 'profile'>('menu');
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [marketingAttribution, setMarketingAttribution] = useState<MarketingAttributionSession | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch(`/api/restaurants/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Restaurante nao encontrado.');
        return res.json();
      })
      .then((data: { restaurant: Restaurant }) => {
        if (!mounted) return;
        configureRestaurantMenuData(data.restaurant);
      })
      .catch((reason: unknown) => {
        if (!mounted) return;
        setError(reason instanceof Error ? reason.message : 'Falha ao carregar cardapio.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    try {
      const raw = localStorage.getItem(sessionStorageKey(slug));
      if (raw) {
        const parsed = JSON.parse(raw) as CustomerSession;
        if (parsed?.name && parsed?.whatsapp) {
          setCustomerSession(parsed);
        }
      }
    } catch {}

    try {
      const params = new URLSearchParams(window.location.search);
      const incoming: MarketingAttributionSession = {
        trafficSource: params.get('pz_src') || undefined,
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
        utmContent: params.get('utm_content') || undefined,
        utmTerm: params.get('utm_term') || undefined,
        couponCode: (params.get('cupom') || params.get('coupon') || '').trim().toUpperCase() || undefined,
        attributionBannerId: params.get('banner') || undefined,
        attributionCampaignId: params.get('campaign') || undefined,
        capturedAt: new Date().toISOString()
      };
      const hasIncoming = Object.entries(incoming).some(
        ([key, value]) => key !== 'capturedAt' && !!value
      );

      if (hasIncoming) {
        localStorage.setItem(attributionStorageKey(slug), JSON.stringify(incoming));
        setMarketingAttribution(incoming);
      } else {
        const rawAttribution = localStorage.getItem(attributionStorageKey(slug));
        if (rawAttribution) {
          const parsed = JSON.parse(rawAttribution) as MarketingAttributionSession;
          setMarketingAttribution(parsed);
        }
      }
    } catch {}

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if ((step === 'profile' || step === 'checkout') && !customerSession) {
      setStep('auth');
    }
  }, [step, customerSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando cardapio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restaurante nao encontrado</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="antialiased text-gray-900 bg-gray-50 min-h-screen">
        {step === 'menu' && (
          <MenuPage
            onCheckout={() => {
              setStep(customerSession ? 'checkout' : 'auth');
            }}
            onProfile={() => {
              setStep(customerSession ? 'profile' : 'auth');
            }}
          />
        )}
        {step === 'auth' && (
          <AuthPage
            slug={slug}
            onBackToMenu={() => setStep('menu')}
            onGoCheckout={() => setStep('auth')}
            cartCount={0}
            onAuthenticated={(user) => {
              const sessionData: CustomerSession = {
                name: user.name,
                whatsapp: user.whatsapp,
                email: user.email,
                address: `${user.address}${user.neighborhood ? ` - ${user.neighborhood}` : ''}`,
                neighborhood: user.neighborhood
              };
              localStorage.setItem(sessionStorageKey(slug), JSON.stringify(sessionData));
              setCustomerSession(sessionData);
              setStep('checkout');
            }}
          />
        )}
        {step === 'checkout' && (
          <CheckoutPage
            onBackToMenu={() => setStep('menu')}
            onProfile={() => setStep(customerSession ? 'profile' : 'auth')}
            initialCouponCode={marketingAttribution?.couponCode}
            initialAttribution={marketingAttribution ?? undefined}
            initialCustomerData={{
              name: customerSession?.name,
              phone: customerSession?.whatsapp,
              email: customerSession?.email,
              address: customerSession?.address
            }}
          />
        )}
        {step === 'profile' && customerSession && (
          <ProfilePage
            slug={slug}
            customer={customerSession}
            onMenu={() => setStep('menu')}
            onCheckout={() => setStep('checkout')}
            onLogout={() => {
              localStorage.removeItem(sessionStorageKey(slug));
              setCustomerSession(null);
              setStep('menu');
            }}
          />
        )}
      </div>
    </CartProvider>
  );
}
