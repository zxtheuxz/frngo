import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PreparadorRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, userProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verificar se usuário tem role de preparador
  const isPreparador = userProfile?.role === 'preparador';
  
  if (!isPreparador) {
    // Redirecionar usuários não-preparador para seu dashboard apropriado
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}