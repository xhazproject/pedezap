import React from 'react';
import { BrandLogo } from '@/components/brand-logo';

const Link = ({ href, children, className }: { href: string; children?: React.ReactNode; className?: string }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

export default function MarketingLayout({
  children
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container-custom flex h-16 items-center justify-between">
          <Link href="/inicio" className="flex items-center gap-2.5">
            <BrandLogo src="/pedezappp.png" imageClassName="h-8 w-auto object-contain" />
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="#planos" className="hidden text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:block">
              Ver planos
            </Link>
            <Link
              href="#contato"
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-colors hover:bg-slate-900"
            >
              Comecar agora
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="mt-auto">
        <div className="h-10 bg-black"></div>
        <div className="border-t border-slate-200 bg-slate-100 py-6">
          <div className="container-custom flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="flex items-center gap-2.5">
              <BrandLogo src="/pedezappp.png" imageClassName="h-6 w-auto object-contain md:h-7" />
            </div>
            <p className="text-center text-xs text-slate-500 md:text-right md:text-sm">
              &copy; {new Date().getFullYear()} PedeZap. Minimalismo para seu delivery.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
