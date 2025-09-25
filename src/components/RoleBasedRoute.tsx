import { Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}: RoleBasedRouteProps) {
  const { isAuthenticated, loading, profileLoading, hasRole, userProfile } = useAuth();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Para roles críticos (admin/preparador/nutricionista), identificar se é um caso especial
  const isCriticalRole = allowedRoles.some(role => ['admin', 'preparador', 'nutricionista'].includes(role));

  // Timeout otimizado para loading
  useEffect(() => {
    if (loading || profileLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
      }, 5000); // Reduzido para 5 segundos
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setHasTimedOut(false);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, profileLoading]);

  // Aguardar tanto o carregamento da sessão quanto do perfil
  if ((loading || profileLoading) && !hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          {isCriticalRole && (
            <p className="text-sm text-gray-600">
              Carregando perfil administrativo...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Se tiver dado timeout, redirecionar baseado no contexto
  if (hasTimedOut) {
    if (isCriticalRole && userProfile?.role) {
      const roleRoute = userProfile.role === 'admin' ? '/admin/dashboard' : 
                       userProfile.role === 'preparador' ? '/preparador/dashboard' :
                       userProfile.role === 'nutricionista' ? '/nutricionista/dashboard' : 
                       '/dashboard';
      return <Navigate to={roleRoute} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar se o perfil foi carregado completamente
  if (!userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  const userHasAccess = hasRole(allowedRoles);
  if (!userHasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}