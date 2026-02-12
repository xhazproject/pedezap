'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChefHat } from 'lucide-react';

export default function MasterLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/master/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const payload = (await response.json().catch(() => null)) as
      | { success: boolean; message?: string; user?: { restaurantSlug: string; restaurantName: string; email: string } }
      | null;

    if (!response.ok || !payload?.success || !payload.user) {
      setError(payload?.message ?? 'Falha ao entrar.');
      setLoading(false);
      return;
    }

    localStorage.setItem('pedezap_master_session', JSON.stringify(payload.user));
    router.push('/master');
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="mx-auto grid min-h-screen max-w-[1280px] lg:grid-cols-[1fr_1fr]">
        <section
          className="relative hidden overflow-hidden lg:block"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,.38), rgba(0,0,0,.88)), url('/imgpainelloginmaster.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/80" />

          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black shadow-sm">
                <ChefHat size={20} />
              </span>
              <span className="text-4xl font-bold">PedeZap</span>
            </div>

            <div className="max-w-lg">
              <h1 className="text-6xl font-extrabold leading-tight">
                Gestao inteligente para restaurantes de alta performance.
              </h1>
              <p className="mt-6 text-2xl text-white/80">
                Domine seus pedidos, fidelize clientes e escale sua operacao com a plataforma mais completa do mercado.
              </p>
            </div>

            <p className="text-base text-white/75">© 2026 PedeZap Enterprise.</p>
          </div>
        </section>

        <section className="flex min-h-screen items-start justify-center px-5 py-8 sm:py-10 lg:items-center lg:px-10">
          <div className="w-full max-w-[520px]">
            <div
              className="mb-10 overflow-hidden rounded-2xl border border-slate-200 lg:hidden"
              style={{
            backgroundImage:
                  "linear-gradient(to bottom, rgba(0,0,0,.38), rgba(0,0,0,.72)), url('/imgpainelloginmaster.jpeg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="flex h-36 items-end p-5">
                <div className="flex items-center gap-2 text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black">
                    <ChefHat size={17} />
                  </span>
                  <span className="text-3xl font-bold">PedeZap</span>
                </div>
              </div>
            </div>

            <h2 className="text-center text-5xl font-extrabold text-slate-950 sm:text-6xl lg:text-left">Bem-vindo de volta</h2>
            <p className="mt-3 text-center text-lg text-slate-600 lg:text-left">
              Digite suas credenciais para acessar o painel administrativo.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <div>
                <label className="mb-2 block text-base font-semibold text-slate-900">Email Corporativo</label>
                <input
                  className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-black"
                  placeholder="admin@restaurante.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-base font-semibold text-slate-900">Senha</label>
                  <a href="/master/reset-password" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                    Esqueceu?
                  </a>
                </div>
                <input
                  type="password"
                  className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-black"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-6 text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar no Painel'}
                {!loading && <ArrowRight size={18} />}
              </button>

              <div className="pt-3">
                <hr className="border-slate-200" />
                <p className="pt-5 text-center text-xs text-slate-400 sm:text-sm">
                  Acesso restrito. Protegido por criptografia de ponta a ponta.
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
