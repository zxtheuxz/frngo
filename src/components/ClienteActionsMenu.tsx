import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit, Key, Activity, AlertCircle, UserCheck, UserX } from 'lucide-react';
import { EditClienteModal } from './EditClienteModal';
import { ActivityHistoryModal } from './ActivityHistoryModal';
import { resetUserPassword, getUserEmail, logUserActivity } from '../utils/adminActions';
import { supabase } from '../lib/supabase';

interface Cliente {
  id: string;
  user_id: string;
  nome_completo: string;
  telefone: string;
  sexo: string;
  role: string;
  liberado: string;
  laudo_aprovado: string;
  created_at: string;
  email?: string;
}

interface ClienteActionsMenuProps {
  cliente: Cliente;
  onViewDetails: (cliente: Cliente) => void;
  onToggleStatus: (clienteId: string, novoStatus: 'sim' | 'nao') => void;
  onSuccess?: () => void;
}

export function ClienteActionsMenu({ cliente, onViewDetails, onToggleStatus, onSuccess }: ClienteActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    horizontal: 'right' | 'left';
    vertical: 'down' | 'up';
  }>({ horizontal: 'right', vertical: 'down' });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      // Calcular posição antes de abrir o menu
      const rect = buttonRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const dropdownWidth = 224; // w-56 = 14rem = 224px
      const dropdownHeight = 280; // altura aproximada do dropdown
      
      // Calcular posição horizontal
      const horizontal = rect.right + dropdownWidth > screenWidth ? 'left' : 'right';
      
      // Calcular posição vertical
      const vertical = rect.bottom + dropdownHeight > screenHeight ? 'up' : 'down';
      
      setDropdownPosition({ horizontal, vertical });
    }
    setIsOpen(!isOpen);
  };

  const handleAction = async (action: string) => {
    setIsOpen(false);
    
    switch (action) {
      case 'view':
        onViewDetails(cliente);
        break;
      case 'toggle-status':
        onToggleStatus(cliente.id, cliente.liberado === 'sim' ? 'nao' : 'sim');
        break;
      case 'edit':
        setShowEditModal(true);
        break;
      case 'reset-password':
        await handleResetPassword();
        break;
      case 'view-activity':
        setShowActivityModal(true);
        break;
    }
  };

  const handleResetPassword = async () => {
    if (!confirm(`Confirma o envio de email de reset de senha para ${cliente.nome_completo}?`)) {
      return;
    }

    setLoading('reset-password');

    try {
      // Primeiro tentar usar o email que já temos
      let email = cliente.email;
      
      // Se não tiver email ou for 'N/A', buscar via RPC
      if (!email || email === 'N/A') {
        email = await getUserEmail(cliente.user_id);
      }

      if (!email) {
        alert('Não foi possível encontrar o email deste usuário');
        return;
      }

      const result = await resetUserPassword(email);
      
      if (result.success) {
        // Buscar ID do admin atual
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Criar log da atividade
        await logUserActivity(
          cliente.user_id,
          'password_reset',
          `Reset de senha solicitado por admin para: ${email}`,
          currentUser?.id,
          { email }
        );
        
        alert(result.message);
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      alert('Erro inesperado ao resetar senha');
    } finally {
      setLoading(null);
    }
  };

  const handleEditSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
        title="Mais opções"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={`absolute w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50 ${
          dropdownPosition.horizontal === 'right' ? 'right-0' : 'left-0'
        } ${
          dropdownPosition.vertical === 'down' ? 'mt-1' : 'mb-1 bottom-full'
        }`}>
          <div className="py-1">
            {/* Ver Detalhes */}
            <button
              onClick={() => handleAction('view')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <Eye className="w-4 h-4" />
              Ver Detalhes Completos
            </button>

            {/* Editar */}
            <button
              onClick={() => handleAction('edit')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <Edit className="w-4 h-4" />
              Editar Informações
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Toggle Status */}
            <button
              onClick={() => handleAction('toggle-status')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3 ${
                cliente.liberado === 'sim' ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {cliente.liberado === 'sim' ? (
                <>
                  <UserX className="w-4 h-4" />
                  Bloquear Acesso
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Liberar Acesso
                </>
              )}
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Reset Senha */}
            <button
              onClick={() => handleAction('reset-password')}
              disabled={loading === 'reset-password'}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              {loading === 'reset-password' ? 'Enviando...' : 'Resetar Senha'}
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Ver Atividades */}
            <button
              onClick={() => handleAction('view-activity')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <Activity className="w-4 h-4" />
              Histórico de Atividades
            </button>

            {/* Alertas (se houver problemas) */}
            {(cliente.laudo_aprovado === 'rejeitado' || cliente.liberado === 'nao') && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  {cliente.laudo_aprovado === 'rejeitado' && 'Laudo rejeitado'}
                  {cliente.liberado === 'nao' && 'Acesso bloqueado'}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      <EditClienteModal
        cliente={cliente}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Modal de Histórico de Atividades */}
      <ActivityHistoryModal
        cliente={cliente}
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
      />
    </div>
  );
}