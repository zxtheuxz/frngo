import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, Phone, Users, UserCheck } from 'lucide-react';
import { logUserActivity } from '../utils/adminActions';

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

interface EditClienteModalProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClienteModal({ cliente, isOpen, onClose, onSuccess }: EditClienteModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
    sexo: '',
    role: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cliente && isOpen) {
      setFormData({
        nome_completo: cliente.nome_completo || '',
        telefone: cliente.telefone || '',
        sexo: cliente.sexo || '',
        role: cliente.role || 'cliente'
      });
      setErrors({});
    }
  }, [cliente, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else if (!/^\d{10,11}$/.test(formData.telefone.replace(/\D/g, ''))) {
      newErrors.telefone = 'Telefone deve ter 10 ou 11 dígitos';
    }

    if (!formData.sexo) {
      newErrors.sexo = 'Sexo é obrigatório';
    }

    if (!formData.role) {
      newErrors.role = 'Role é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkTelefoneAutorizado = async (telefone: string) => {
    if (!telefone) return false;
    
    const { data, error } = await supabase
      .from('compras')
      .select('telefone')
      .eq('telefone', telefone.replace(/\D/g, ''))
      .single();

    return !error && data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !cliente) return;

    setLoading(true);

    try {
      // Se o telefone mudou, verificar se está autorizado
      const telefoneFormatado = formData.telefone.replace(/\D/g, '');
      const telefoneOriginal = cliente.telefone?.replace(/\D/g, '');
      
      if (telefoneFormatado !== telefoneOriginal) {
        const isAutorizado = await checkTelefoneAutorizado(telefoneFormatado);
        if (!isAutorizado) {
          setErrors({ telefone: 'Este telefone não está autorizado para cadastro' });
          setLoading(false);
          return;
        }
      }

      // Atualizar dados do perfil
      const { error } = await supabase
        .from('perfis')
        .update({
          nome_completo: formData.nome_completo.trim(),
          telefone: telefoneFormatado,
          sexo: formData.sexo,
          role: formData.role
        })
        .eq('id', cliente.id);

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        setErrors({ geral: 'Erro ao atualizar dados. Tente novamente.' });
        return;
      }

      // Buscar ID do admin atual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Criar log da atividade
      await logUserActivity(
        cliente.user_id,
        'profile_edit',
        `Perfil editado por admin: ${formData.nome_completo}`,
        currentUser?.id,
        {
          changes: {
            nome_completo: formData.nome_completo.trim(),
            telefone: telefoneFormatado,
            sexo: formData.sexo,
            role: formData.role
          },
          original: {
            nome_completo: cliente.nome_completo,
            telefone: cliente.telefone,
            sexo: cliente.sexo,
            role: cliente.role
          }
        }
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      setErrors({ geral: 'Erro inesperado. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuario começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editar Usuário</h2>
              <p className="text-sm text-gray-600">Alterar informações do perfil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.geral && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {errors.geral}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome Completo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                  className={`pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nome_completo ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome completo"
                />
              </div>
              {errors.nome_completo && (
                <p className="text-red-600 text-xs mt-1">{errors.nome_completo}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formatTelefone(formData.telefone)}
                  onChange={(e) => handleInputChange('telefone', e.target.value.replace(/\D/g, ''))}
                  className={`pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.telefone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                />
              </div>
              {errors.telefone && (
                <p className="text-red-600 text-xs mt-1">{errors.telefone}</p>
              )}
            </div>

            {/* Sexo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sexo *
              </label>
              <select
                value={formData.sexo}
                onChange={(e) => handleInputChange('sexo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.sexo ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione...</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
              {errors.sexo && (
                <p className="text-red-600 text-xs mt-1">{errors.sexo}</p>
              )}
            </div>

            {/* Role */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuário (Role) *
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={`pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.role ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="cliente">Cliente</option>
                  <option value="preparador">Preparador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {errors.role && (
                <p className="text-red-600 text-xs mt-1">{errors.role}</p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informações importantes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Se alterar o telefone, ele deve estar na lista de telefones autorizados</li>
                  <li>• Mudanças de role afetam as permissões do usuário no sistema</li>
                  <li>• O email não pode ser alterado (vinculado à conta de autenticação)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}