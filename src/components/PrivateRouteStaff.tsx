import { useEffect, useRef, memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

function PrivateRouteStaffComponent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, userProfile } = useAuth();
  
  // Proteção anti-loop: timeout máximo para loading
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    // Garantir que o fundo seja escuro para área staff
    const setBackground = () => {
      document.documentElement.style.background = 'linear-gradient(135deg, #1f2937 0%, #111827 100%)';
      document.documentElement.style.backgroundColor = '#1f2937';
      document.body.style.background = 'linear-gradient(135deg, #1f2937 0%, #111827 100%)';
      document.body.style.backgroundColor = '#1f2937';
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
    // Proteção anti-loop: timeout de 8 segundos para loading - REDIRECIONA PARA STAFF LOGIN
    if (loading && !hasTimedOut.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        hasTimedOut.current = true;
        // Forçar redirecionamento para login STAFF após timeout
        window.location.href = '/staff';
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
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'}}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div className="flex items-center text-gray-300">
            <Shield className="w-5 h-5 mr-2" />
            <span>Verificando permissões staff...</span>
          </div>
        </div>
      </div>
    );
  }

  // Se não autenticado, redirecionar para login staff
  if (!isAuthenticated) {
    return <Navigate to="/staff" replace />;
  }

  // Se autenticado mas não é staff, redirecionar para login staff com erro
  if (userProfile && !['admin', 'preparador', 'nutricionista'].includes(userProfile.role)) {
    return (
      <Navigate 
        to="/staff" 
        state={{ 
          message: 'Acesso negado. Esta área é restrita ao staff.',
          email: '' 
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
}

// Implementar memo para evitar re-renders desnecessários
export const PrivateRouteStaff = memo(PrivateRouteStaffComponent);