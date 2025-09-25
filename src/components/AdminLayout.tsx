import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, X, Users, Shield, BarChart3, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path);
    return `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 scale-105'
        : 'text-gray-600 hover:text-red-600 hover:bg-red-50 hover:scale-105 hover:shadow-md'
    }`;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <div className="md:hidden bg-white shadow-sm border-b">
        <div className="flex justify-between items-center px-4 py-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside 
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl ${
          isMobileMenuOpen ? 'fixed inset-0 overflow-y-auto z-50' : ''
        }`}
      >
        {/* Logo Desktop */}
        <div className="hidden md:block p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-500">Sistema de Administração</p>
            </div>
          </div>
        </div>

        {/* Header Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden p-4 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="font-bold text-base bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Menu de navegação */}
        <nav className="flex-1 p-6 space-y-2">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-500">
              Administração
            </p>
            
            <Link to="/admin/dashboard" className={getLinkClass('/admin/dashboard')}>
              <div className={`p-2 rounded-lg ${
                location.pathname.startsWith('/admin/dashboard') 
                  ? 'bg-white/20' 
                  : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                <BarChart3 size={18} />
              </div>
              <span className="font-medium">Dashboard</span>
            </Link>
            
            <Link to="/admin/dashboard" className={getLinkClass('/admin/usuarios')}>
              <div className={`p-2 rounded-lg ${
                location.pathname.startsWith('/admin/usuarios') 
                  ? 'bg-white/20' 
                  : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                <Users size={18} />
              </div>
              <span className="font-medium">Usuários</span>
            </Link>
          </div>
          
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-500">
              Configurações
            </p>
            
            <Link to="/configuracoes" className={getLinkClass('/configuracoes')}>
              <div className={`p-2 rounded-lg ${
                location.pathname === '/configuracoes' 
                  ? 'bg-white/20' 
                  : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                <Settings size={18} />
              </div>
              <span className="font-medium">Configurações</span>
            </Link>
          </div>
        </nav>
        
        {/* Botão de sair */}
        <div className="p-6 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 hover:scale-105 hover:shadow-lg"
          >
            <div className="p-2 rounded-lg bg-red-50 transition-colors group-hover:scale-110 group-hover:bg-red-500/20">
              <LogOut size={18} />
            </div>
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
      
      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}