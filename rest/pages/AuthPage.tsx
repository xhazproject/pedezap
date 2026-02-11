import React, { useMemo, useState } from 'react';
import { AlertCircle, UserRound } from 'lucide-react';

type AuthUser = {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  neighborhood: string;
  password: string;
};

interface AuthPageProps {
  slug: string;
  onAuthenticated: (user: AuthUser) => void;
  onBackToMenu: () => void;
  onGoCheckout: () => void;
  cartCount: number;
}

function usersStorageKey(slug: string) {
  return `pedezap_customers_${slug}`;
}

function sessionStorageKey(slug: string) {
  return `pedezap_customer_session_${slug}`;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  slug,
  onAuthenticated,
  onBackToMenu,
  onGoCheckout,
  cartCount
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerWhatsapp, setRegisterWhatsapp] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerAddress, setRegisterAddress] = useState('');
  const [registerNeighborhood, setRegisterNeighborhood] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const users = useMemo(() => {
    if (typeof window === 'undefined') return [] as AuthUser[];
    const raw = localStorage.getItem(usersStorageKey(slug));
    if (!raw) return [] as AuthUser[];
    try {
      return JSON.parse(raw) as AuthUser[];
    } catch {
      return [] as AuthUser[];
    }
  }, [slug]);

  const saveSession = (user: AuthUser) => {
    fetch(`/api/master/customers/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        whatsapp: user.whatsapp
      })
    }).catch(() => undefined);

    localStorage.setItem(sessionStorageKey(slug), JSON.stringify(user));
    onAuthenticated(user);
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const found = users.find(
      (item) =>
        item.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        item.password === loginPassword
    );
    if (!found) {
      setError('Conta nao encontrada. Verifique email e senha ou crie uma conta.');
      return;
    }
    saveSession(found);
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (
      !registerName.trim() ||
      !registerWhatsapp.trim() ||
      !registerEmail.trim() ||
      !registerAddress.trim() ||
      !registerNeighborhood.trim() ||
      registerPassword.trim().length < 4
    ) {
      setError('Preencha todos os campos para criar a conta.');
      return;
    }

    const emailExists = users.some(
      (item) => item.email.toLowerCase() === registerEmail.trim().toLowerCase()
    );
    if (emailExists) {
      setError('Este email ja possui conta. Use a aba Entrar.');
      return;
    }

    const newUser: AuthUser = {
      name: registerName.trim(),
      whatsapp: registerWhatsapp.trim(),
      email: registerEmail.trim(),
      address: registerAddress.trim(),
      neighborhood: registerNeighborhood.trim(),
      password: registerPassword
    };
    localStorage.setItem(usersStorageKey(slug), JSON.stringify([newUser, ...users]));
    saveSession(newUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-md px-4 pt-6">
        <div className="mb-4 flex justify-center">
          <div className="rounded-2xl bg-emerald-600 p-4 text-white shadow-lg">
            <UserRound size={30} />
          </div>
        </div>
        <h1 className="text-center text-4xl font-black text-slate-900">Bem-vindo(a)</h1>
        <p className="mt-1 text-center text-base text-slate-500">Acesse sua conta para continuar</p>

        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-700">
          <p className="flex items-center gap-2 font-bold">
            <AlertCircle size={16} />
            Finalizar Pedido
          </p>
          <p className="mt-1 text-sm">Voce precisa entrar ou criar uma conta para concluir seu pedido.</p>
        </div>

        <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-200 p-1 text-sm font-semibold">
          <button
            onClick={() => setMode('login')}
            className={`rounded-lg py-2.5 ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode('register')}
            className={`rounded-lg py-2.5 ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Criar Conta
          </button>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
            <label className="block text-sm font-semibold text-slate-700">Senha</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="******"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
            <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white hover:bg-emerald-700">
              Entrar
            </button>
            <p className="text-center text-xs text-slate-400">
              Para fins de demonstracao, crie uma conta e depois use o mesmo email/senha.
            </p>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="mt-5 space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Nome Completo</label>
            <input
              value={registerName}
              onChange={(event) => setRegisterName(event.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
            <label className="block text-sm font-semibold text-slate-700">WhatsApp</label>
            <input
              value={registerWhatsapp}
              onChange={(event) => setRegisterWhatsapp(event.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
            <label className="block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={registerEmail}
              onChange={(event) => setRegisterEmail(event.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
            <label className="block text-sm font-semibold text-slate-700">Endereco (Rua e Numero)</label>
            <input
              value={registerAddress}
              onChange={(event) => setRegisterAddress(event.target.value)}
              placeholder="Rua das Flores, 123"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
            <label className="block text-sm font-semibold text-slate-700">Bairro</label>
            <input
              value={registerNeighborhood}
              onChange={(event) => setRegisterNeighborhood(event.target.value)}
              placeholder="Centro"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
            <label className="block text-sm font-semibold text-slate-700">Senha</label>
            <input
              type="password"
              value={registerPassword}
              onChange={(event) => setRegisterPassword(event.target.value)}
              placeholder="Minimo 4 caracteres"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
            <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white hover:bg-emerald-700">
              Criar Conta
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-around px-6">
          <button onClick={onBackToMenu} className="flex flex-col items-center gap-1 text-slate-500 hover:text-emerald-600">
            <span className="text-lg">🏠</span>
            <span className="text-xs font-semibold">Cardapio</span>
          </button>
          <button onClick={onGoCheckout} className="relative flex flex-col items-center gap-1 text-slate-500 hover:text-emerald-600">
            <span className="text-lg">🛍️</span>
            <span className="text-xs font-semibold">Carrinho</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-1 min-w-5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button className="flex flex-col items-center gap-1 text-emerald-600">
            <span className="text-lg">👤</span>
            <span className="text-xs font-semibold">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
