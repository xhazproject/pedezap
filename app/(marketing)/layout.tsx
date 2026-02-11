
import { UtensilsCrossed, Zap } from "lucide-react";
import React from "react";

// Mock Link for preview environment
const Link = ({ href, children, className }: { href: string; children?: React.ReactNode; className?: string }) => (
  <a href={href} className={className}>{children}</a>
);

export default function MarketingLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container-custom flex h-16 items-center justify-between">
          <Link href="/inicio" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center h-9 w-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Zap className="h-5 w-5 text-white fill-white/20" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Pede<span className="text-brand-600">Zap</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="#planos" 
              className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors hidden sm:block"
            >
              Ver planos
            </Link>
            <Link
              href="#contato"
              className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-slate-900/10"
            >
              Quero contratar
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 pt-16">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
             <div className="flex items-center justify-center h-8 w-8 bg-slate-800 rounded-lg border border-slate-700">
              <Zap className="h-4 w-4 text-brand-500" />
            </div>
            <span className="font-bold text-white text-lg">Pede<span className="text-brand-500">Zap</span></span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} PedeZap. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
