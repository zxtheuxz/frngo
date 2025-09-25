import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Cadastro } from '../pages/Cadastro';
import { Dashboard } from '../pages/Dashboard';
import { AvaliacaoNutricionalMasculina } from '../pages/AvaliacaoNutricionalMasculina';
import { AvaliacaoNutricionalFeminina } from '../pages/AvaliacaoNutricionalFeminina';
import { AvaliacaoFisica } from '../pages/AvaliacaoFisica';
import { RedefinirSenha } from '../pages/RedefinirSenha';
import { Resultados } from '../pages/Resultados';
import { ResultadoFisico } from '../pages/ResultadoFisico';
import { PrivateRoute } from '../components/PrivateRoute';
import { AdminRoute } from '../components/AdminRoute';
import { PreparadorRoute } from '../components/PreparadorRoute';
import { NutricionistaRoute } from '../components/NutricionistaRoute';
import { ProtectedFormRoute } from './ProtectedFormRoute';
import { MaintenancePage } from '../pages/MaintenancePage';
import { Layout } from '../components/Layout';

// Importar páginas de Admin, Preparador e Nutricionista
import { AdminDashboard } from '../pages/admin/Dashboard';
import { VisualizarUsuario } from '../pages/admin/VisualizarUsuario';
import { PreparadorDashboard } from '../pages/preparador/Dashboard';
import { AnalisarCliente } from '../pages/preparador/AnalisarCliente';
import { NutricionistaDashboard } from '../pages/nutricionista/Dashboard';

// Componente temporário para configurações
const Configuracoes = () => <div>Página de Configurações</div>;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/configuracoes" 
        element={
          <PrivateRoute>
            <Layout>
              <Configuracoes />
            </Layout>
          </PrivateRoute>
        } 
      />
      

      
      {/* Rotas para resultados */}
      <Route 
        path="/resultados" 
        element={
          <PrivateRoute>
            <Layout>
              <Resultados />
            </Layout>
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/resultado-fisico" 
        element={
          <PrivateRoute>
            <Layout>
              <ResultadoFisico />
            </Layout>
          </PrivateRoute>
        } 
      />
      
      {/* Rotas protegidas para formulários */}
      <Route 
        path="/avaliacao-fisica" 
        element={
          <ProtectedFormRoute component={AvaliacaoFisica} formType="fisica" />
        } 
      />
      <Route 
        path="/avaliacao-nutricional/feminino" 
        element={
          <ProtectedFormRoute component={AvaliacaoNutricionalFeminina} formType="nutricional" />
        } 
      />
      <Route 
        path="/avaliacao-nutricional/masculino" 
        element={
          <ProtectedFormRoute component={AvaliacaoNutricionalMasculina} formType="nutricional" />
        } 
      />
      
      {/* Rotas de Admin */}
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/usuario/:id" 
        element={
          <AdminRoute>
            <VisualizarUsuario />
          </AdminRoute>
        } 
      />
      
      {/* Rotas de Preparador */}
      <Route 
        path="/preparador/dashboard" 
        element={
          <PreparadorRoute>
            <PreparadorDashboard />
          </PreparadorRoute>
        } 
      />
      <Route 
        path="/preparador/analisar/:id" 
        element={
          <PreparadorRoute>
            <AnalisarCliente />
          </PreparadorRoute>
        } 
      />
      
      {/* Rotas de Nutricionista */}
      <Route 
        path="/nutricionista/dashboard" 
        element={
          <NutricionistaRoute>
            <NutricionistaDashboard />
          </NutricionistaRoute>
        } 
      />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
} 