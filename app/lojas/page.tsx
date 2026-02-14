'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Clock3,
  IceCreamIcon,
  MapPin,
  Pizza,
  Search,
  Star,
  Store,
  type LucideIcon,
  UtensilsCrossed,
  Wine
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

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
};

type StoresResponse = {
  success: boolean;
  stores: StoreRow[];
};

type StoreCategory =
  | 'all'
  | 'lanches'
  | 'pizza'
  | 'japonesa'
  | 'brasileira'
  | 'acai'
  | 'bebidas';

const STORE_CATEGORIES: Array<{
  id: StoreCategory;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'all', label: 'Tudo', icon: UtensilsCrossed },
  { id: 'lanches', label: 'Lanches', icon: Store },
  { id: 'pizza', label: 'Pizza', icon: Pizza },
  { id: 'japonesa', label: 'Japonesa', icon: UtensilsCrossed },
  { id: 'brasileira', label: 'Brasileira', icon: UtensilsCrossed },
  { id: 'acai', label: 'Acai', icon: IceCreamIcon },
  { id: 'bebidas', label: 'Bebidas', icon: Wine }
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
  if (text.includes('18') || text.includes('19')) return '35-45 min';
  if (text.includes('12') || text.includes('13')) return '25-35 min';
  return '30-40 min';
}

export default function LojasPage() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('all');
  const [showLocationEditor, setShowLocationEditor] = useState(false);

  const cityLabel = useMemo(() => city.trim() || stores[0]?.city || 'Sua cidade', [city, stores]);

  const searchStores = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (city.trim()) params.set('city', city.trim());
      if (state.trim()) params.set('state', state.trim().toUpperCase());
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/lojas?${params.toString()}`);
      const payload = (await response.json().catch(() => null)) as StoresResponse | null;
      if (!response.ok || !payload?.success) {
        setError('Nao foi possivel carregar as lojas agora.');
        setStores([]);
      } else {
        setStores(payload.stores ?? []);
      }
    } catch {
      setError('Nao foi possivel carregar as lojas agora.');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleStores = useMemo(() => {
    if (activeCategory === 'all') return stores;
    return stores.filter((store) => inferStoreCategory(store) === activeCategory);
  }, [activeCategory, stores]);

  return (
    <main className="min-h-screen bg-[#f8f9fb]">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <BrandLogo
            src="/pedezappp.png"
            className="flex items-center"
            imageClassName="h-8 w-auto object-contain"
          />
          <div className="relative">
            <button
              onClick={() => setShowLocationEditor((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-left shadow-sm"
            >
              <MapPin size={14} className="text-rose-500" />
              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Voce esta em</p>
                <p className="text-sm font-semibold text-gray-800">{cityLabel}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showLocationEditor && (
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
                <div className="grid grid-cols-[1fr_72px] gap-2">
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Cidade"
                  />
                  <input
                    value={state}
                    onChange={(event) => setState(event.target.value.toUpperCase())}
                    maxLength={2}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
                    placeholder="UF"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowLocationEditor(false);
                    searchStores();
                  }}
                  className="mt-2 w-full rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                >
                  Aplicar localizacao
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-gray-200 bg-[radial-gradient(circle_at_20%_20%,#eef2ff,transparent_45%),radial-gradient(circle_at_80%_25%,#fef9c3,transparent_35%),#f8f9fb]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] text-slate-900 md:text-7xl">
            O que voce vai pedir hoje em{' '}
            <span className="relative inline-block">
              {cityLabel}
              <span className="absolute bottom-1 left-0 h-3 w-full -rotate-1 rounded bg-yellow-200/70" />
            </span>
            ?
          </h1>

          <div className="mt-8 max-w-2xl rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Search size={18} className="ml-2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') searchStores();
                }}
                className="h-12 w-full rounded-xl px-1 text-base text-gray-700 outline-none"
                placeholder="Buscar lojas, lanches, bebidas..."
              />
              <button
                onClick={searchStores}
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
              >
                Buscar
              </button>
            </div>
          </div>

          <div className="mt-12">
            <div className="mb-4 flex items-center gap-2">
              <p className="text-3xl font-bold text-slate-900">Categorias</p>
              <span className="text-sm text-gray-500">- Filtrar por tipo</span>
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
              {STORE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const active = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                      active
                        ? 'border-black bg-black text-white shadow-lg shadow-black/10'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
          <h2 className="text-4xl font-black text-slate-900">Lojas recomendadas</h2>
          <span className="text-sm text-gray-500">
            {loading ? 'buscando...' : `${visibleStores.length} resultados`}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleStores.map((store) => {
            const rating = ratingFromSlug(store.slug);
            const category = inferStoreCategory(store);
            const feeLabel = store.deliveryFee > 0 ? `R$ ${store.deliveryFee.toFixed(2)}` : 'Gratis';
            return (
              <article key={store.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={store.coverUrl || 'https://picsum.photos/seed/pedezap-cover/800/300'}
                    alt={`Capa ${store.name}`}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold ${
                      store.openForOrders ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {store.openForOrders ? 'ONLINE' : 'FECHADO'}
                  </span>
                  <img
                    src={store.logoUrl || 'https://picsum.photos/seed/pedezap-logo/120/120'}
                    alt={`Logo ${store.name}`}
                    className="absolute -bottom-6 left-4 h-14 w-14 rounded-2xl border-4 border-white bg-white object-cover shadow"
                  />
                </div>

                <div className="px-4 pb-4 pt-8">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-2xl font-extrabold text-slate-900">{store.name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      {rating}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-md bg-gray-100 px-2 py-1 font-semibold uppercase text-gray-600">
                      {category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {etaFromHours(store.openingHours)}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-600">{feeLabel}</span>
                  </div>

                  <Link
                    href={`/r/${store.slug}`}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-black"
                  >
                    Ver Cardapio
                    <ChevronDown size={14} className="-rotate-90" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && !visibleStores.length && (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
            Nenhuma loja encontrada para os filtros selecionados.
          </div>
        )}
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 md:flex-row md:items-center md:px-8">
          <div>
            <BrandLogo
              src="/pedezappp.png"
              className="flex items-center"
              imageClassName="h-8 w-auto object-contain"
            />
            <p className="mt-3 max-w-sm text-sm text-gray-500">
              Conectando voce aos melhores sabores da sua cidade com apenas alguns cliques.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="/inicio#como-funciona" className="hover:text-gray-900">Sobre</a>
            <a href="/inicio#planos" className="hover:text-gray-900">Termos</a>
            <a href="/inicio#duvidas" className="hover:text-gray-900">Privacidade</a>
          </div>
          <p className="text-sm text-gray-400">© 2026 PedeZap.</p>
        </div>
      </footer>
    </main>
  );
}



