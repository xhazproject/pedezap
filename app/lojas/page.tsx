'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Search,
  Star,
  X
} from 'lucide-react';

type StoreRow = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
  city: string;
  state: string;
  address: string;
  openingHours: string;
  openForOrders: boolean;
  whatsapp: string;
  deliveryFee: number;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
};

type StoresResponse = {
  success: boolean;
  stores: StoreRow[];
};

type GeocodeLookupResponse = {
  success: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
};

type GeocodeSuggestResponse = {
  success: boolean;
  suggestions: Array<{
    label: string;
    latitude: number;
    longitude: number;
  }>;
};

type StoreCategory =
  | 'all'
  | 'lanches'
  | 'pizza'
  | 'japonesa'
  | 'brasileira'
  | 'acai'
  | 'bebidas'
  | 'doces';

const STORE_CATEGORIES: Array<{
  id: StoreCategory;
  label: string;
  emoji: string;
}> = [
  { id: 'all', label: 'Tudo', emoji: '🍽️' },
  { id: 'lanches', label: 'Lanches', emoji: '🍔' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'japonesa', label: 'Japonesa', emoji: '🍣' },
  { id: 'brasileira', label: 'Brasileira', emoji: '🥘' },
  { id: 'acai', label: 'Açaí', emoji: '🍧' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { id: 'doces', label: 'Doces', emoji: '🍰' }
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function inferStoreCategory(store: StoreRow): Exclude<StoreCategory, 'all'> {
  const haystack = normalize(`${store.name} ${store.address}`);
  if (haystack.includes('pizza') || haystack.includes('pizzaria')) return 'pizza';
  if (haystack.includes('sushi') || haystack.includes('japa') || haystack.includes('japones')) return 'japonesa';
  if (haystack.includes('acai')) return 'acai';
  if (haystack.includes('bar') || haystack.includes('bebida') || haystack.includes('adega')) return 'bebidas';
  if (haystack.includes('doce') || haystack.includes('confeitaria') || haystack.includes('sobremesa')) return 'doces';
  if (haystack.includes('brasileira') || haystack.includes('prato')) return 'brasileira';
  return 'lanches';
}

function ratingFromSlug(slug: string) {
  let acc = 0;
  for (const ch of slug) acc += ch.charCodeAt(0);
  return (4.2 + (acc % 9) / 10).toFixed(1);
}

function etaFromHours(openingHours: string) {
  const text = normalize(openingHours);
  if (text.includes('18') || text.includes('19')) return '40-50 min';
  if (text.includes('12') || text.includes('13')) return '30-40 min';
  return '35-45 min';
}

function extractCityLabel(input: string) {
  const clean = input.trim();
  if (!clean) return '';
  const parts = clean.split('-');
  const tail = parts[parts.length - 1]?.trim() || clean;
  const cityOnly = tail.split('/')[0]?.trim();
  return cityOnly || clean;
}

export default function LojasPage() {
  const [locationText, setLocationText] = useState('');
  const [appliedLocationText, setAppliedLocationText] = useState('');
  const [query, setQuery] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestResponse['suggestions']>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm] = useState(10);

  const cityLabel = useMemo(() => {
    const custom = extractCityLabel(appliedLocationText);
    return custom || stores[0]?.city || 'Sua cidade';
  }, [appliedLocationText, stores]);

  const searchStores = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (userLocation) {
        params.set('lat', userLocation.lat.toString());
        params.set('lng', userLocation.lng.toString());
        params.set('radiusKm', radiusKm.toString());
      }
      const response = await fetch(`/api/lojas?${params.toString()}`);
      const payload = (await response.json().catch(() => null)) as StoresResponse | null;
      if (!response.ok || !payload?.success) {
        setError('Não foi possível carregar as lojas agora.');
        setStores([]);
      } else {
        setStores(payload.stores ?? []);
      }
    } catch {
      setError('Não foi possível carregar as lojas agora.');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByAddress = async () => {
    const q = locationText.trim();
    if (!q) {
      setUserLocation(null);
      setAddressSearch('');
      setAppliedLocationText('');
      setShowAddressModal(false);
      searchStores();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/geo/lookup?q=${encodeURIComponent(q)}`);
      const payload = (await response.json().catch(() => null)) as GeocodeLookupResponse | null;
      if (!response.ok || !payload?.success || !payload.location) {
        setError(payload?.message || 'Não foi possível localizar este endereço.');
        setLoading(false);
        return;
      }
      setAddressSearch(q);
      setAppliedLocationText(q);
      setUserLocation({ lat: payload.location.latitude, lng: payload.location.longitude });
      setShowAddressModal(false);
    } catch {
      setError('Não foi possível localizar este endereço.');
      setLoading(false);
    }
  };

  useEffect(() => {
    searchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userLocation) searchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  useEffect(() => {
    const value = locationText.trim();
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/geo/suggest?q=${encodeURIComponent(value)}`);
        const payload = (await response.json().catch(() => null)) as GeocodeSuggestResponse | null;
        if (!response.ok || !payload?.success) return;
        setSuggestions(payload.suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [locationText]);

  const visibleStores = useMemo(() => {
    if (activeCategory === 'all') return stores;
    return stores.filter((store) => inferStoreCategory(store) === activeCategory);
  }, [activeCategory, stores]);

  return (
    <main className="min-h-screen bg-[#f3f5f9] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 md:px-8">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/minilogo.png"
              alt="PedeZap"
              className="h-10 w-auto object-contain md:hidden"
            />
            <img
              src="/pedezappp.png"
              alt="PedeZap"
              className="hidden h-10 w-auto object-contain md:block"
            />
          </Link>

          <button
            onClick={() => setShowAddressModal(true)}
            className="inline-flex max-w-[210px] items-center gap-2 rounded-full border border-slate-200 bg-[#f5f7fb] px-3 py-2 text-left text-sm shadow-sm hover:bg-white md:max-w-none md:px-4"
          >
            <MapPin size={14} className="shrink-0 text-[#ff3f7f]" />
            <span className="truncate font-semibold text-slate-700">
              {appliedLocationText || `Av. Orosimbo Maia, 1000 - ${cityLabel}`}
            </span>
            <ChevronDown size={14} className="shrink-0 text-slate-400" />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-3 pb-8 pt-10 md:px-8 md:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-[40px] font-black leading-[1.08] text-[#101933] md:text-[74px]">
            O que você vai pedir hoje
            <br />
            em{' '}
            <span className="relative inline-block">
              {cityLabel}
              <span className="absolute -bottom-0.5 left-0 h-3 w-full rounded bg-[#ffe13d]" />
            </span>
            ?
          </h1>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgba(16,25,51,0.06)] md:flex md:items-center md:gap-2">
            <div className="flex h-12 items-center gap-2 rounded-xl px-3 md:flex-1">
              <Search size={20} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') searchStores();
                }}
                className="w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400 md:text-[30px]"
                placeholder="Buscar lojas, lanches, bebidas..."
              />
            </div>
            <button
              onClick={searchStores}
              className="mt-2 h-12 w-full rounded-xl bg-[#0e1732] px-6 text-xl font-bold text-white hover:bg-[#111f42] md:mt-0 md:w-auto md:min-w-[150px]"
            >
              Buscar
            </button>
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-[34px] font-black tracking-tight text-[#101933] md:text-[42px]">Categorias</h2>
            <span className="text-sm text-slate-500 md:text-xl">- Filtrar por tipo</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STORE_CATEGORIES.map((category) => {
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-3 text-xl font-bold transition md:text-2xl ${
                    active
                      ? 'border-[#0e1732] bg-[#0e1732] text-white shadow-[0_10px_20px_rgba(14,23,50,0.2)]'
                      : 'border-slate-300 bg-[#f8f9fc] text-slate-700 hover:bg-white'
                  }`}
                >
                  <span>{category.emoji}</span>
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-12">
          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-[34px] font-black tracking-tight text-[#101933] md:text-[46px]">Lojas recomendadas</h3>
            <span className="rounded-full bg-[#e8edf6] px-4 py-1 text-base font-semibold text-slate-600 md:text-xl">
              {loading
                ? 'Buscando...'
                : userLocation || addressSearch
                ? `${visibleStores.length} resultados`
                : `${visibleStores.length} resultados`}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleStores.map((store) => {
              const rating = ratingFromSlug(store.slug);
              const category = inferStoreCategory(store);
              const feeLabel = store.deliveryFee > 0 ? `R$ ${store.deliveryFee.toFixed(2)}` : 'Grátis';
              return (
                <article key={store.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      src={store.coverUrl || 'https://picsum.photos/seed/pedezap-cover/900/380'}
                      alt={`Capa ${store.name}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-[#ff0050] px-3 py-1 text-xs font-bold text-white">
                      Entrega Grátis
                    </div>
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                      <Clock3 size={12} className="text-[#ff3f7f]" />
                      {etaFromHours(store.openingHours)}
                    </div>
                  </div>

                  <div className="px-4 pb-5 pt-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="line-clamp-1 text-[30px] font-black tracking-tight text-[#101933] md:text-[32px]">{store.name}</h4>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#eef2f8] px-2 py-1 text-sm font-bold text-slate-700">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        {rating}
                      </span>
                    </div>
                    <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 md:text-base">
                      <span className="rounded-md bg-[#eef2f8] px-2 py-1 font-bold uppercase text-slate-600">{category}</span>
                      <span>·</span>
                      <span>{etaFromHours(store.openingHours)}</span>
                      <span>·</span>
                      <span className="font-bold text-emerald-600">{feeLabel}</span>
                    </div>
                    <Link
                      href={`/r/${store.slug}`}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0e1732] text-lg font-bold text-white hover:bg-[#111f42]"
                    >
                      Ver Cardápio
                      <ChevronDown size={15} className="-rotate-90" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && !visibleStores.length && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-slate-500">
              Nenhuma loja encontrada para os filtros selecionados.
            </div>
          )}
        </section>
      </section>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-3 py-10 text-slate-600 md:flex-row md:items-center md:px-8">
          <div>
            <div className="inline-flex items-center">
              <img
                src="/minilogo.png"
                alt="PedeZap"
                className="h-9 w-auto object-contain md:hidden"
              />
              <img
                src="/pedezappp.png"
                alt="PedeZap"
                className="hidden h-9 w-auto object-contain md:block"
              />
            </div>
            <p className="mt-3 max-w-sm text-sm text-slate-500">Conectando você aos melhores sabores da sua cidade.</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/inicio#como-funciona" className="hover:text-slate-900">Sobre</a>
            <a href="/inicio#planos" className="hover:text-slate-900">Termos</a>
            <a href="/inicio#duvidas" className="hover:text-slate-900">Privacidade</a>
          </div>
          <p className="text-sm text-slate-400">© 2026 PedeZap.</p>
        </div>
      </footer>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-3 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h4 className="text-2xl font-black text-slate-900">Alterar endereço</h4>
              <button
                onClick={() => setShowAddressModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X size={22} />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <label className="block text-lg font-semibold text-slate-700">Buscar endereço</label>
              <div className="relative">
                <div className="flex h-12 items-center gap-2 rounded-xl border-2 border-[#ff3f7f] px-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={locationText}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onChange={(event) => setLocationText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') searchByAddress();
                    }}
                    className="w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder="Rua, bairro - cidade/UF"
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                    {suggestions.map((item) => (
                      <button
                        key={`${item.latitude}-${item.longitude}-${item.label}`}
                        onClick={() => {
                          setLocationText(item.label);
                          setShowSuggestions(false);
                        }}
                        className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Check size={14} className="mt-0.5 text-emerald-600" />
                        <span className="line-clamp-2">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={searchByAddress}
                className="h-12 w-full rounded-xl bg-[#ff0050] text-lg font-bold text-white shadow-[0_10px_20px_rgba(255,0,80,0.28)] hover:bg-[#e20047]"
              >
                Confirmar endereço
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
