import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Phone, Plus, Search, Trash2, Edit, Users, CheckCircle, XCircle } from 'lucide-react';

interface TelefoneAutorizado {
  id: string;
  telefone: string;
  created_at: string;
}

interface TelefonesAutorizadosProps {
  onTelefoneSelect?: (telefone: TelefoneAutorizado) => void;
}

export function TelefonesAutorizados({ onTelefoneSelect }: TelefonesAutorizadosProps) {
  const [telefones, setTelefones] = useState<TelefoneAutorizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTelefone, setEditingTelefone] = useState<TelefoneAutorizado | null>(null);
  const [newTelefone, setNewTelefone] = useState('');
  const [stats, setStats] = useState({
    totalAutorizados: 0,
    totalCadastrados: 0
  });

  useEffect(() => {
    loadTelefones();
    loadStats();
  }, []);

  const loadTelefones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar telefones:', error);
        return;
      }

      setTelefones(data || []);
    } catch (error) {
      console.error('Erro ao carregar telefones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Total de telefones autorizados
      const { count: totalAutorizados } = await supabase
        .from('compras')
        .select('*', { count: 'exact', head: true });

      // Total de telefones que já fizeram cadastro
      const { count: totalCadastrados } = await supabase
        .from('perfis')
        .select('telefone', { count: 'exact', head: true })
        .not('telefone', 'is', null);

      setStats({
        totalAutorizados: totalAutorizados || 0,
        totalCadastrados: totalCadastrados || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleAddTelefone = async () => {
    if (!newTelefone.trim()) return;

    try {
      const { error } = await supabase
        .from('compras')
        .insert([{ telefone: newTelefone.trim() }]);

      if (error) {
        console.error('Erro ao adicionar telefone:', error);
        alert('Erro ao adicionar telefone. Verifique se não está duplicado.');
        return;
      }

      setNewTelefone('');
      setShowAddModal(false);
      await loadTelefones();
      await loadStats();
    } catch (error) {
      console.error('Erro ao adicionar telefone:', error);
    }
  };

  const handleEditTelefone = async (id: string, novoTelefone: string) => {
    if (!novoTelefone.trim()) return;

    try {
      const { error } = await supabase
        .from('compras')
        .update({ telefone: novoTelefone.trim() })
        .eq('id', id);

      if (error) {
        console.error('Erro ao editar telefone:', error);
        alert('Erro ao editar telefone. Verifique se não está duplicado.');
        return;
      }

      setEditingTelefone(null);
      await loadTelefones();
    } catch (error) {
      console.error('Erro ao editar telefone:', error);
    }
  };

  const handleDeleteTelefone = async (id: string, telefone: string) => {
    if (!confirm(`Tem certeza que deseja remover o telefone ${telefone}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('compras')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar telefone:', error);
        alert('Erro ao deletar telefone.');
        return;
      }

      await loadTelefones();
      await loadStats();
    } catch (error) {
      console.error('Erro ao deletar telefone:', error);
    }
  };

  const filteredTelefones = telefones.filter(item =>
    item.telefone.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Telefones Autorizados
            </h3>
            <p className="text-sm text-slate-600">
              {filteredTelefones.length} telefones encontrados
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Telefone
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Telefones Autorizados</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalAutorizados}</p>
              </div>
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Usuários Cadastrados</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalCadastrados}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Lista de Telefones */}
      <div className="p-6">
        {filteredTelefones.length === 0 ? (
          <div className="text-center py-8">
            <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum telefone encontrado</h4>
            <p className="text-gray-600">
              {searchTerm ? 'Tente ajustar os termos de busca.' : 'Adicione o primeiro telefone autorizado.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTelefones.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingTelefone?.id === item.id ? (
                        <input
                          type="text"
                          defaultValue={item.telefone}
                          onBlur={(e) => handleEditTelefone(item.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTelefone(item.id, e.currentTarget.value);
                            }
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {item.telefone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3" />
                        Autorizado
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingTelefone(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Editar telefone"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTelefone(item.id, item.telefone)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Remover telefone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Adicionar Telefone */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Adicionar Novo Telefone
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Telefone
              </label>
              <input
                type="tel"
                value={newTelefone}
                onChange={(e) => setNewTelefone(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite apenas números, sem espaços ou símbolos
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTelefone('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTelefone}
                disabled={!newTelefone.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}