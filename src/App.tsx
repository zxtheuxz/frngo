import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { LoginStaff } from './pages/LoginStaff';
import { Dashboard } from './pages/Dashboard';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { Dashboard as PreparadorDashboard } from './pages/preparador/Dashboard';
import { Dashboard as NutricionistaDashboard } from './pages/nutricionista/Dashboard';
import { AvaliacaoFisica } from './pages/AvaliacaoFisica';
import { AvaliacaoNutricionalFeminina, AvaliacaoNutricionalMasculina } from './pages/avaliacao-nutricional';
import { Resultados } from './pages/Resultados';
import { Fotos } from './pages/Fotos';
import { AnaliseCorporal } from './pages/AnaliseCorporal';
import { Cadastro } from './pages/Cadastro';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { Configuracoes } from './pages/Configuracoes';
import { ResultadoFisico } from './pages/ResultadoFisico';
import { ResultadoNutricional } from './pages/ResultadoNutricional';
import { PrivateRoute } from './components/PrivateRoute';
import { PrivateRouteStaff } from './components/PrivateRouteStaff';
import { RoleBasedRoute } from './components/RoleBasedRoute';
import { ProtectedFormRoute } from './routes/ProtectedFormRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ActivityLoggerProvider } from './providers/ActivityLoggerProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import UpdateNotification from './components/UpdateNotification';
import './styles/global.css';

// Logs de debug removidos para evitar poluição do console

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ActivityLoggerProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="app-container">
                <UpdateNotification />
                <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/staff" element={<LoginStaff />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/admin/dashboard" element={<PrivateRouteStaff><RoleBasedRoute allowedRoles={['admin']}><AdminDashboard /></RoleBasedRoute></PrivateRouteStaff>} />
                <Route path="/preparador/dashboard" element={<PrivateRouteStaff><RoleBasedRoute allowedRoles={['preparador']}><PreparadorDashboard /></RoleBasedRoute></PrivateRouteStaff>} />
                <Route path="/nutricionista/dashboard" element={<PrivateRouteStaff><RoleBasedRoute allowedRoles={['nutricionista']}><NutricionistaDashboard /></RoleBasedRoute></PrivateRouteStaff>} />
                <Route path="/avaliacao-fisica" element={<PrivateRoute><AvaliacaoFisica /></PrivateRoute>} />
                <Route path="/avaliacao-nutricional/feminino" element={<ProtectedFormRoute component={AvaliacaoNutricionalFeminina} formType="nutricional" />} />
                <Route path="/avaliacao-nutricional/masculino" element={<ProtectedFormRoute component={AvaliacaoNutricionalMasculina} formType="nutricional" />} />
                <Route path="/resultados" element={<PrivateRoute><Resultados /></PrivateRoute>} />
                <Route path="/fotos" element={<PrivateRoute><Fotos /></PrivateRoute>} />
                <Route path="/analise-corporal" element={<PrivateRoute><AnaliseCorporal /></PrivateRoute>} />
                <Route path="/resultado-fisico" element={<PrivateRoute><ResultadoFisico /></PrivateRoute>} />
                <Route path="/resultado-nutricional" element={<PrivateRoute><ResultadoNutricional /></PrivateRoute>} />
                <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ActivityLoggerProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
