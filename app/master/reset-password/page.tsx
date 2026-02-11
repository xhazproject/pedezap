'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type VerifyResponse = {
  success: boolean;
  message?: string;
  restaurantName?: string;
};

function MasterResetPasswordContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';
  const token = searchParams.get('token') ?? '';

  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = useMemo(
    () => password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword,
    [password, confirmPassword]
  );

  useEffect(() => {
    if (!slug || !token) {
      setError('Link invalido.');
      setValidLink(false);
      setLoading(false);
      return;
    }

    fetch(`/api/master/password-reset?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`)
      .then((res) => res.json().catch(() => null))
      .then((payload: VerifyResponse | null) => {
        if (!payload?.success) {
          setError(payload?.message ?? 'Nao foi possivel validar o link.');
          setValidLink(false);
          return;
        }
        setRestaurantName(payload.restaurantName ?? '');
        setValidLink(true);
      })
      .catch(() => {
        setError('Falha ao validar o link.');
        setValidLink(false);
      })
      .finally(() => setLoading(false));
  }, [slug, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !validLink) return;

    setSaving(true);
    const response = await fetch('/api/master/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        token,
        newPassword: password
      })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok || !payload?.success) {
      setError(payload?.message ?? 'Nao foi possivel redefinir a senha.');
      return;
    }

    setDone(true);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Redefinir Senha</h1>
        <p className="mt-1 text-sm text-slate-500">Painel do restaurante</p>

        {loading && (
          <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Validando link...
          </p>
        )}

        {!loading && !validLink && (
          <div className="mt-6 space-y-3">
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error || 'Link invalido ou expirado.'}
            </p>
            <Link
              href="/master/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Voltar para login
            </Link>
          </div>
        )}

        {!loading && validLink && !done && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {restaurantName ? `Restaurante: ${restaurantName}` : 'Link valido.'}
            </p>

            <div>
              <label className="text-sm font-medium text-slate-700">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Minimo 6 caracteres"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Confirmar senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Repita a nova senha"
              />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600">As senhas nao coincidem.</p>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        {!loading && validLink && done && (
          <div className="mt-6 space-y-3">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Senha redefinida com sucesso.
            </p>
            <Link
              href="/master/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Ir para login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MasterResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Redefinir Senha</h1>
            <p className="mt-1 text-sm text-slate-500">Painel do restaurante</p>
            <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Carregando...
            </p>
          </div>
        </div>
      }
    >
      <MasterResetPasswordContent />
    </Suspense>
  );
}
