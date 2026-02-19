import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isSubscriptionBlocked, readStore } from '@/lib/store';
import { Facebook, Instagram, Music2, Twitter, Youtube } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default async function RestaurantBioPage({ params }: { params: { slug: string } }) {
  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);

  if (!restaurant || !restaurant.active || isSubscriptionBlocked(restaurant)) {
    notFound();
  }

  const bio = {
    appearance: restaurant.bioLink?.appearance ?? 'dark',
    headline: restaurant.bioLink?.headline ?? 'Nossos links oficiais',
    whatsappEnabled: restaurant.bioLink?.whatsappEnabled ?? true,
    whatsappValue: restaurant.bioLink?.whatsappValue ?? restaurant.whatsapp,
    instagramEnabled: restaurant.bioLink?.instagramEnabled ?? false,
    instagramValue: restaurant.bioLink?.instagramValue ?? '',
    customEnabled: restaurant.bioLink?.customEnabled ?? false,
    customLabel: restaurant.bioLink?.customLabel ?? 'Meu Site',
    customUrl: restaurant.bioLink?.customUrl ?? ''
  };

  const containerClass =
    bio.appearance === 'light'
      ? 'bg-white text-slate-900'
      : bio.appearance === 'brand'
        ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white'
        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white';

  const cardClass =
    bio.appearance === 'light'
      ? 'border border-slate-200 bg-slate-50 text-slate-900'
      : 'border border-white/20 bg-white/10 text-white';
  const mutedClass = bio.appearance === 'light' ? 'text-slate-500' : 'text-white/75';

  const whatsappHref = bio.whatsappValue.includes('http')
    ? bio.whatsappValue
    : `https://wa.me/${bio.whatsappValue.replace(/\D/g, '')}`;
  const instagramHref = bio.instagramValue.includes('http')
    ? bio.instagramValue
    : `https://instagram.com/${bio.instagramValue.replace('@', '')}`;
  const customHref = normalizeExternalUrl(bio.customUrl);
  const canUseWhatsApp = bio.whatsappEnabled && bio.whatsappValue.replace(/\D/g, '').length >= 10;
  const canUseInstagram = bio.instagramEnabled && bio.instagramValue.trim().length > 0;
  const canUseCustomLink = bio.customEnabled && customHref.length > 0;

  return (
    <main className="relative min-h-screen bg-slate-900 p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,.45) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative mx-auto max-w-md rounded-3xl border-[8px] border-slate-900 bg-black p-2.5 shadow-[0_24px_80px_rgba(2,6,23,.45)]">
        <div className={`relative overflow-hidden rounded-[1.7rem] pb-6 ${containerClass}`}>
          <div className="h-48 w-full overflow-hidden">
            <img
              src={restaurant.coverUrl || 'https://picsum.photos/seed/pedezap-bio-cover/900/500'}
              alt={`Capa ${restaurant.name}`}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="-mt-12 flex justify-center">
            <div className="relative z-10 h-24 w-24 rounded-full bg-white p-1 shadow-lg ring-4 ring-white/70">
              <div className="h-full w-full overflow-hidden rounded-full border border-gray-200 bg-white">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-900">
                    {restaurant.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 text-center">
            <h1 className="mt-4 text-4xl font-bold leading-tight">{restaurant.name}</h1>
            <p className={`mt-1 text-sm font-medium uppercase tracking-wider ${mutedClass}`}>{bio.headline}</p>

            <div className="mt-6 flex items-center justify-center gap-4">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${cardClass}`}>
                <Music2 size={16} />
              </span>
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${cardClass}`}>
                <Youtube size={16} />
              </span>
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${cardClass}`}>
                <Twitter size={16} />
              </span>
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${cardClass}`}>
                <Facebook size={16} />
              </span>
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${cardClass}`}>
                <Instagram size={16} />
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <Link href={`/r/${restaurant.slug}`} className={`flex min-h-[60px] items-center justify-center rounded-md px-5 text-2xl font-semibold ${cardClass}`}>
                Ver Cardapio
              </Link>

              {canUseWhatsApp ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex min-h-[60px] items-center justify-center rounded-md px-5 text-2xl font-semibold ${cardClass}`}
                >
                  Chamar no WhatsApp
                </a>
              ) : null}

              {canUseInstagram ? (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex min-h-[60px] items-center justify-center rounded-md px-5 text-2xl font-semibold ${cardClass}`}
                >
                  Seguir no Instagram
                </a>
              ) : null}

              {canUseCustomLink ? (
                <a
                  href={customHref}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex min-h-[60px] items-center justify-center rounded-md px-5 text-2xl font-semibold ${cardClass}`}
                >
                  {bio.customLabel || 'Link Personalizado'}
                </a>
              ) : null}
            </div>

            <p className="mt-9 text-center text-xs uppercase tracking-widest text-white/40">Made with PedeZap</p>
          </div>
        </div>
      </div>
    </main>
  );
}
