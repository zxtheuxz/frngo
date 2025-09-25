import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, userProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verificar se usuário tem role de admin
  const isAdmin = userProfile?.role === 'admin';
  
  if (!isAdmin) {
    // Redirecionar usuários não-admin para seu dashboard apropriado
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}