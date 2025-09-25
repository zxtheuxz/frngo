import { useEffect, useRef, memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWhyDidYouUpdate } from '../hooks/useWhyDidYouUpdate';

function PrivateRouteComponent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Debug para rastrear mudanças
  useWhyDidYouUpdate('PrivateRoute', {
    isAuthenticated,
    loading,
    childrenType: typeof children
  });
  
  // Proteção anti-loop: timeout máximo para loading
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    // Garantir que o fundo seja claro com gradiente (apenas uma vez)
    const setBackground = () => {
      document.documentElement.style.background = 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)';
      document.documentElement.style.backgroundColor = '#f5f7ff';
      document.body.style.background = 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)';
      document.body.style.backgroundColor = '#f5f7ff';
    };
    setBackground();
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []); // Executar apenas uma vez na montagem

  // Separar timeout em useEffect próprio para evitar re-mount
  useEffect(() => {
    // Proteção anti-loop: timeout de 8 segundos para loading (padronizado com RoleBasedRoute)
    if (loading && !hasTimedOut.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        hasTimedOut.current = true;
        // Forçar redirecionamento para login após timeout
        window.location.href = '/login';
      }, 8000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading]);

  // Reset timeout quando loading termina
  useEffect(() => {
    if (!loading && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      hasTimedOut.current = false;
    }
  }, [loading]);

  if (loading && !hasTimedOut.current) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)'}}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <div className="ml-4 text-gray-600">
          Carregando...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Implementar memo para evitar re-renders desnecessários
export const PrivateRoute = memo(PrivateRouteComponent); 