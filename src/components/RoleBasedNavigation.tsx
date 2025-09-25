import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Home, 
  Users, 
  Shield, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Activity,
  BarChart3,
  UserCheck
} from 'lucide-react';

interface UserProfile {
  role: string;
  nome_completo: string;
}

export function RoleBasedNavigation() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('role, nome_completo')
          .eq('user_id', user.id)
          .single();

        if (perfil) {
          setUserProfile(perfil);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getNavigationItems = () => {
    if (!userProfile) return [];

    const baseItems = [
      { name: 'Configurações', href: '/configuracoes', icon: Settings }
    ];

    switch (userProfile.role) {
      case 'admin':
        return [
          { name: 'Dashboard Admin', href: '/admin/dashboard', icon: Shield },
          { name: 'Usuários', href: '/admin/dashboard', icon: Users },
          { name: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
          ...baseItems
        ];
      
      case 'preparador':
        return [
          { name: 'Dashboard', href: '/preparador/dashboard', icon: Activity },
          { name: 'Análises', href: '/preparador/dashboard', icon: FileText },
          { name: 'Histórico', href: '/preparador/historico', icon: UserCheck },
          ...baseItems
        ];
      
      case 'cliente':
      default:
        return [
          { name: 'Dashboard', href: '/dashboard', icon: Home },
          { name: 'Programações', href: '/dashboard', icon: Activity },
          { name: 'Resultados', href: '/resultados', icon: BarChart3 },
          ...baseItems
        ];
    }
  };

  const getRoleColor = () => {
    switch (userProfile?.role) {
      case 'admin':
        return 'from-red-600 to-red-700';
      case 'preparador':
        return 'from-purple-600 to-purple-700';
      case 'cliente':
      default:
        return 'from-blue-600 to-blue-700';
    }
  };

  const getRoleTitle = () => {
    switch (userProfile?.role) {
      case 'admin':
        return 'Administrador';
      case 'preparador':
        return 'Preparador';
      case 'cliente':
      default:
        return 'Cliente';
    }
  };

  if (loading) {
    return null; // Não mostrar nada enquanto carrega
  }

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Header para Desktop */}
      <div className="hidden md:block bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getRoleColor()}`}>
                {getRoleTitle()}
              </div>
              <span className="text-gray-700 font-medium">
                {userProfile?.nome_completo || 'Usuário'}
              </span>
            </div>
            
            <nav className="flex space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Header Mobile */}
      <div className="md:hidden bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`px-2 py-1 rounded text-white text-xs font-medium bg-gradient-to-r ${getRoleColor()}`}>
                {getRoleTitle()}
              </div>
              <span className="text-gray-700 text-sm font-medium truncate">
                {userProfile?.nome_completo || 'Usuário'}
              </span>
            </div>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Menu Mobile */}
          {isMenuOpen && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sair</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}