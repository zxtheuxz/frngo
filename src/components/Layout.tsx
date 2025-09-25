import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Settings, X, Sun, Moon, BarChart3, Image, Brain } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const isDark = theme === 'dark';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log('Layout: Iniciando processo de logout...');
      
      // Usar o método signOut do AuthContext que já gerencia tudo
      await signOut();
      
      // Pequeno delay para garantir que o estado foi limpo
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Layout: Logout concluído, redirecionando...');
      // Redirecionar para login após logout
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Layout: Erro durante logout:', error);
      // Mesmo com erro, redirecionar para login
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 scale-105'
        : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'} hover:scale-105 hover:shadow-md`
    }`;
  };



  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Header onMenuClick={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      
      {/* Sidebar Modernizada - visível em desktop ou quando o menu móvel está aberto */}
      <aside 
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-72 lg:w-80 ${
          isDark 
            ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800' 
            : 'bg-gradient-to-b from-white via-gray-50 to-gray-100'
        } ${
          isDark ? 'border-gray-700/50' : 'border-gray-200/50'
        } border-r backdrop-blur-sm flex flex-col z-10 shadow-xl ${
          isMobileMenuOpen ? 'fixed inset-0 overflow-y-auto' : ''
        }`}
      >
        {/* Logo modernizado - visível apenas em desktop */}
        <div className={`hidden md:block p-6 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className="flex flex-col items-center space-y-3">
            <img
              src="/images/Logo-Consultoria.png"
              alt="Consultoria Extermina Frango"
              className="w-40 h-40 rounded-xl shadow-lg ring-2 ring-orange-500/20"
            />
            <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sua jornada fitness
            </p>
          </div>
        </div>
        
        {/* Header mobile modernizado - visível apenas em mobile quando o menu está aberto */}
        {isMobileMenuOpen && (
          <div className={`md:hidden p-4 flex justify-between items-center border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <div className="flex items-center justify-center flex-1">
              <img
                src="/images/Logo-Consultoria.png"
                alt="Consultoria Extermina Frango"
                className="w-16 h-16 rounded-xl shadow-lg ring-2 ring-orange-500/20"
              />
            </div>
            <button 
              onClick={toggleMobileMenu}
              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              } flex-shrink-0`}
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Menu de navegação modernizado */}
        <nav className="flex-1 p-6 space-y-2">
          {/* Seção Principal */}
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Principal
            </p>
            
            <Link to="/dashboard" className={getLinkClass('/dashboard')}>
              <div className={`p-2 rounded-lg ${
                location.pathname === '/dashboard' 
                  ? 'bg-white/20' 
                  : isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                <Home size={18} className="flex-shrink-0" />
              </div>
              <span className="truncate font-medium">Início</span>
            </Link>
            
            <Link to="/resultados" className={getLinkClass('/resultados')}>
              <div className={`p-2 rounded-lg ${
                location.pathname === '/resultados' 
                  ? 'bg-white/20' 
                  : isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                <BarChart3 size={18} className="flex-shrink-0" />
              </div>
              <span className="truncate font-medium">Resultados</span>
            </Link>
            
            <Link to="/fotos" className={getLinkClass('/fotos')}>
              <div className={`p-2 rounded-lg ${
                location.pathname === '/fotos' 
                  ? 'bg-white/20' 
                  : isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                <Image size={18} className="flex-shrink-0" />
              </div>
              <span className="truncate font-medium">Fotos</span>
            </Link>
            
            <Link to="/analise-corporal" className={getLinkClass('/analise-corporal')}>
              <div className={`p-2 rounded-lg ${
                location.pathname === '/analise-corporal' 
                  ? 'bg-white/20' 
                  : isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                <Brain size={18} className="flex-shrink-0" />
              </div>
              <span className="truncate font-medium">Análise Corporal</span>
            </Link>
          </div>
          
          {/* Seção Configurações */}
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Configurações
            </p>
            
            <Link to="/configuracoes" className={getLinkClass('/configuracoes')}>
              <div className={`p-2 rounded-lg ${
                location.pathname === '/configuracoes' 
                  ? 'bg-white/20' 
                  : isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                <Settings size={18} className="flex-shrink-0" />
              </div>
              <span className="truncate font-medium">Configurações</span>
            </Link>
            
            <button
              onClick={toggleTheme}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full ${
                isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              } hover:scale-105 hover:shadow-md`}
            >
              <div className={`p-2 rounded-lg ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              } transition-colors group-hover:scale-110`}>
                {isDark ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
              </div>
              <span className="truncate font-medium">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            

          </div>
        </nav>
        
        {/* Botão de sair modernizado */}
        <div className={`p-6 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full ${
              isLoggingOut
                ? 'opacity-75 cursor-not-allowed'
                : ''
            } ${
              isDark 
                ? 'text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40' 
                : 'text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500'
            } ${!isLoggingOut ? 'hover:scale-105 hover:shadow-lg' : ''}`}
          >
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-red-500/10' : 'bg-red-50'
            } transition-colors group-hover:scale-110 group-hover:bg-red-500/20`}>
              {isLoggingOut ? (
                <div className="w-[18px] h-[18px] border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LogOut size={18} className="flex-shrink-0" />
              )}
            </div>
            <span className="truncate font-medium">
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </span>
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