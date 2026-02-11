import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  CreditCard, 
  PieChart, 
  LifeBuoy, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  ShieldAlert
} from 'lucide-react';
import { Role, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.MASTER, Role.FINANCIAL, Role.SUPPORT, Role.OPERATION] },
    { id: 'restaurants', label: 'Restaurantes', icon: Store, roles: [Role.MASTER, Role.SUPPORT, Role.OPERATION] },
    { id: 'leads', label: 'Onboarding / Leads', icon: Users, roles: [Role.MASTER, Role.OPERATION] },
    { id: 'financial', label: 'Financeiro & Planos', icon: CreditCard, roles: [Role.MASTER, Role.FINANCIAL] },
    { id: 'analytics', label: 'Estatísticas', icon: PieChart, roles: [Role.MASTER, Role.FINANCIAL] },
    { id: 'support', label: 'Suporte & Tickets', icon: LifeBuoy, roles: [Role.MASTER, Role.SUPPORT] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: [Role.MASTER] },
    { id: 'audit', label: 'Segurança & Logs', icon: ShieldAlert, roles: [Role.MASTER] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-emerald-400">PedeZap</span>
            <span className="text-slate-100">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="mb-6 px-2">
            <div className="text-xs uppercase text-slate-500 font-semibold mb-2 tracking-wider">Menu Principal</div>
            {filteredMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1
                  ${currentPage === item.id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon size={18} className="mr-3" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-auto px-2 pt-6 border-t border-slate-800">
             <div className="flex items-center gap-3 px-3 py-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.role}</p>
                </div>
             </div>
             <button 
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <LogOut size={18} className="mr-3" />
                Sair do Sistema
              </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
          >
            <Menu size={20} />
          </button>

          <div className="hidden md:flex flex-1 max-w-md ml-4">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={16} className="text-slate-400" />
              </span>
              <input 
                type="text"
                placeholder="Busca global (restaurante, ticket, lead)..."
                className="w-full py-2 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
