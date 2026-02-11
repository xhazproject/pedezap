import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Restaurants } from './pages/Restaurants';
import { Financial } from './pages/Financial';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import { Role, User } from './types';

// Mock User for Demo
const MOCK_USER: User = {
  id: 'u1',
  name: 'Admin Master',
  email: 'admin@pedezap.ai',
  role: Role.MASTER,
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-600 mb-2">PedeZap</h1>
            <p className="text-slate-500">Acesso Administrativo</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" placeholder="admin@pedezap.ai" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input type="password" placeholder="••••••••" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/10">
                Entrar
            </button>
        </form>
        <div className="mt-6 text-center">
            <a href="#" className="text-sm text-indigo-600 hover:underline">Esqueceu a senha?</a>
        </div>
    </div>
  </div>
);

// Wrapper for layout usage
const LayoutWrapper = ({ children, user, onLogout }: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Simple way to get current page ID from path
    const currentPage = location.pathname.substring(1) || 'dashboard';

    const handleNavigate = (page: string) => {
        navigate(`/${page}`);
    };

    return (
        <Layout user={user} onLogout={onLogout} currentPage={currentPage} onNavigate={handleNavigate}>
            {children}
        </Layout>
    );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Router>
        <LayoutWrapper user={MOCK_USER} onLogout={handleLogout}>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/support" element={<Support />} />
                <Route path="/settings" element={<Settings />} />
                {/* Fallbacks for routes not fully implemented in this demo but in menu */}
                <Route path="*" element={<div className="p-8 text-center text-slate-500">Página em construção ou não encontrada.</div>} />
            </Routes>
        </LayoutWrapper>
    </Router>
  );
};

export default App;