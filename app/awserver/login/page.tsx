'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiredByInactivity, setExpiredByInactivity] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setExpiredByInactivity(params.get('expired') === '1');
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const payload = (await response.json().catch(() => null)) as
      | { success: boolean; message?: string; user?: { email: string; name: string; role?: string; permissions?: string[] } }
      | null;

    if (!response.ok || !payload?.success || !payload.user) {
      setError(payload?.message ?? 'Falha no login.');
      setLoading(false);
      return;
    }

    localStorage.setItem('pedezap_admin_session', JSON.stringify(payload.user));
    router.push('/awserver');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] shadow-[0_30px_80px_-24px_rgba(15,23,42,0.95)] backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]">
          <section className="hidden border-r border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-transparent p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <BrandLogo
                className="mb-8 flex items-center"
                imageClassName="h-14 w-auto object-contain brightness-0 invert"
                src="/pedezappp.png"
              />
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                <Sparkles size={14} />
                Painel Admin PedeZap
              </div>
              <h1 className="mt-6 text-4xl font-black leading-tight text-white">
                Controle total da sua operacao em um unico lugar.
              </h1>
              <p className="mt-4 max-w-md text-sm text-slate-300">
                Acompanhe restaurantes, financeiro e suporte com seguranca de nivel empresarial.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <ShieldCheck size={16} className="text-emerald-300" />
                Sessao protegida e acesso monitorado.
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <Lock size={16} className="text-cyan-300" />
                Permissoes por perfil e trilha de auditoria.
              </div>
            </div>
          </section>

          <section className="bg-white p-6 text-slate-900 sm:p-9 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 flex justify-center lg:hidden">
                <BrandLogo className="flex items-center" imageClassName="h-12 w-auto object-contain" src="/pedezappp.png" />
              </div>
              <h2 className="text-center text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-left">Bem-vindo de volta</h2>
              <p className="mt-2 text-center text-sm text-slate-500 lg:text-left">Acesse o painel de controle administrativo.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {expiredByInactivity && !error && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Sua sessao expirou por inatividade (30 minutos). Entre novamente para continuar.
                  </p>
                )}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Corporativo</label>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-slate-900">
                    <Mail size={16} className="text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="admin@pedezap.ai"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Senha</label>
                    <a href="mailto:support@pedezap.site" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-slate-900">
                    <Lock size={16} className="text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                    Lembrar acesso
                  </label>
                </div>

                {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar no Sistema'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
                Acesso restrito. Protegido por criptografia de ponta a ponta.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
