import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, CheckCircle, Lock, Mail, User, Phone, Loader2, Check, X, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/global.css';

export function Cadastro() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    telefone: '',
    sexo: '',
    senha: '',
    confirmarSenha: '',
  });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [telefoneStatus, setTelefoneStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [telefoneMessage, setTelefoneMessage] = useState('');
  const telefoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Função para verificar se dois telefones são compatíveis (resolve problema do 9º dígito)
  const telefonesCompativeis = (tel1: string, tel2: string): boolean => {
    // 🚨 PROTEÇÃO CONTRA NULL EM PRODUÇÃO
    if (!tel1 || !tel2 || tel1 === null || tel2 === null) return false;

    const clean1 = tel1.replace(/\D/g, '').trim();
    const clean2 = tel2.replace(/\D/g, '').trim();

    // Busca exata primeiro
    if (clean1 === clean2) return true;

    // Mesmo DDD + mesmos 8 últimos dígitos (ignora 9º dígito)
    if (clean1.length >= 10 && clean2.length >= 10) {
      const ddd1 = clean1.substring(0, 2);
      const ddd2 = clean2.substring(0, 2);
      const ultimos1 = clean1.slice(-8);
      const ultimos2 = clean2.slice(-8);

      return ddd1 === ddd2 && ultimos1 === ultimos2;
    }

    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'telefone') {
      const telefoneValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData({ ...formData, telefone: telefoneValue });
      verificarTelefoneRealTime(telefoneValue);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const verificarTelefoneRealTime = async (telefone: string) => {
    if (telefoneTimeoutRef.current) {
      clearTimeout(telefoneTimeoutRef.current);
    }

    if (!telefone || telefone.length < 10) {
      setTelefoneStatus('idle');
      setTelefoneMessage('');
      return;
    }

    if (telefone.length >= 10 && telefone.length <= 11) {
      setTelefoneStatus('checking');
      
      telefoneTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('==================== INÍCIO DA VERIFICAÇÃO ====================');
          console.log('Iniciando verificação para telefone:', telefone);
          
          // VERIFICAÇÃO ADICIONAL: Listar todos os telefones na tabela de perfis para debug
          console.log('LISTANDO TODOS OS TELEFONES NA TABELA PERFIS...');
          const { data: todosPerfis, error: todosPerfilError } = await supabase
            .from('perfis')
            .select('telefone, id, nome_completo');
          
          if (todosPerfilError) {
            console.error('Erro ao listar todos os perfis:', todosPerfilError);
          } else {
            console.log('Todos os telefones cadastrados em perfis:', todosPerfis);
            console.log('Total de perfis cadastrados:', todosPerfis ? todosPerfis.length : 0);
            
            // Verificação manual para debug (BUSCA FLEXÍVEL)
            if (todosPerfis && todosPerfis.length > 0) {
              const perfilEncontradoManualmente = todosPerfis.find(
                perfil => telefonesCompativeis(perfil.telefone, telefone)
              );

              if (perfilEncontradoManualmente) {
                console.log('PERFIL ENCONTRADO MANUALMENTE:', perfilEncontradoManualmente);
              } else {
                console.log('PERFIL NÃO ENCONTRADO MANUALMENTE');
              }
            }
          }
          
          // PRIMEIRA VERIFICAÇÃO: Verificar se o telefone existe na tabela de compras (BUSCA FLEXÍVEL)
          console.log('VERIFICANDO NA TABELA COMPRAS...');
          console.log('Telefone a verificar:', telefone);
          const { data: compraDados, error: compraError } = await supabase
            .from('compras')
            .select('*');

          if (compraError) {
            console.error('Erro ao verificar compras:', compraError);
            throw compraError;
          }

          console.log('Resultado da consulta na tabela compras:', compraDados);
          console.log('Quantidade de registros encontrados em compras:', compraDados ? compraDados.length : 0);

          // Verifica se o telefone foi encontrado na tabela de compras usando busca flexível
          const telefoneEncontradoCompras = compraDados?.some(compra =>
            telefonesCompativeis(compra.telefone, telefone)
          );

          if (!telefoneEncontradoCompras) {
            console.log('TELEFONE NÃO ENCONTRADO NA BASE DE COMPRADORES:', telefone);
            setTelefoneStatus('invalid');
            setTelefoneMessage('Telefone não encontrado na base de compradores.');
            console.log('==================== FIM DA VERIFICAÇÃO (TELEFONE NÃO ENCONTRADO) ====================');
            return;
          }
          
          // SEGUNDA VERIFICAÇÃO: Verificar se o telefone já está cadastrado em algum perfil (BUSCA FLEXÍVEL)
          console.log('VERIFICANDO SE JÁ TEM CADASTRO...');
          let telefoneJaCadastrado = false;
          let perfilExistente = null;

          if (todosPerfis && todosPerfis.length > 0) {
            perfilExistente = todosPerfis.find(
              perfil => telefonesCompativeis(perfil.telefone, telefone)
            );

            if (perfilExistente) {
              telefoneJaCadastrado = true;
            }
          }
          
          console.log('Verificação manual - Telefone já cadastrado:', telefoneJaCadastrado);
          console.log('Verificação manual - Perfil encontrado:', perfilExistente);
          
          if (telefoneJaCadastrado) {
            console.log('TELEFONE JÁ CADASTRADO EM OUTRO PERFIL:', telefone);
            console.log('Perfil encontrado:', JSON.stringify(perfilExistente));
            setTelefoneStatus('invalid');
            setTelefoneMessage('Este telefone já está cadastrado em outra conta.');
            console.log('==================== FIM DA VERIFICAÇÃO (TELEFONE JÁ CADASTRADO) ====================');
            return;
          }

          // Se chegou aqui, o telefone está na base de compras e não está cadastrado em nenhum perfil
          console.log('TELEFONE VÁLIDO:', telefone);
          console.log('Dados da compra:', JSON.stringify(compraDados));
          setTelefoneStatus('valid');
          setTelefoneMessage('Telefone válido!');
          console.log('==================== FIM DA VERIFICAÇÃO (TELEFONE VÁLIDO) ====================');
        } catch (error) {
          console.error('Erro na verificação do telefone:', error);
          setTelefoneStatus('invalid');
          setTelefoneMessage('Erro ao verificar telefone. Tente novamente.');
          console.log('==================== FIM DA VERIFICAÇÃO (ERRO) ====================');
        }
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    
    try {
      console.log('==================== INÍCIO DO CADASTRO ====================');
      if (formData.senha !== formData.confirmarSenha) {
        throw new Error('As senhas não coincidem');
      }

      if (formData.telefone.length < 10 || formData.telefone.length > 11) {
        throw new Error('O telefone deve ter 10 ou 11 dígitos (DDD + número)');
      }

      // VERIFICAÇÃO ADICIONAL: Listar todos os telefones na tabela de perfis para debug
      console.log('LISTANDO TODOS OS TELEFONES NA TABELA PERFIS (SUBMIT)...');
      const { data: todosPerfis, error: todosPerfilError } = await supabase
        .from('perfis')
        .select('telefone, id, nome_completo');
      
      if (todosPerfilError) {
        console.error('Erro ao listar todos os perfis:', todosPerfilError);
      } else {
        console.log('Todos os telefones cadastrados em perfis:', todosPerfis);
        console.log('Total de perfis cadastrados:', todosPerfis ? todosPerfis.length : 0);
        
        // Verificação manual para debug (BUSCA FLEXÍVEL)
        if (todosPerfis && todosPerfis.length > 0) {
          const perfilEncontradoManualmente = todosPerfis.find(
            perfil => telefonesCompativeis(perfil.telefone, formData.telefone)
          );

          if (perfilEncontradoManualmente) {
            console.log('PERFIL ENCONTRADO MANUALMENTE (SUBMIT):', perfilEncontradoManualmente);
          } else {
            console.log('PERFIL NÃO ENCONTRADO MANUALMENTE (SUBMIT)');
          }
        }
      }

      // PRIMEIRA VERIFICAÇÃO: Verificar se o telefone existe na tabela de compras (BUSCA FLEXÍVEL)
      console.log('VERIFICANDO NA TABELA COMPRAS (SUBMIT)...');
      console.log('Telefone a verificar:', formData.telefone);
      const { data: compraDados, error: compraError } = await supabase
        .from('compras')
        .select('*');

      if (compraError) {
        console.error('Erro ao verificar compras:', compraError);
        throw new Error('Erro ao verificar telefone na base de compradores.');
      }

      console.log('Resultado da consulta na tabela compras:', compraDados);
      console.log('Quantidade de registros encontrados em compras:', compraDados ? compraDados.length : 0);

      // Verificar se o telefone foi encontrado na tabela de compras usando busca flexível
      const telefoneEncontradoComprasSubmit = compraDados?.some(compra =>
        telefonesCompativeis(compra.telefone, formData.telefone)
      );

      if (!telefoneEncontradoComprasSubmit) {
        console.log('TELEFONE NÃO ENCONTRADO NA BASE DE COMPRADORES (SUBMIT)');
        throw new Error('Telefone não encontrado na base de compradores.');
      }
      
      // SEGUNDA VERIFICAÇÃO: Verificar se o telefone já está cadastrado em algum perfil (BUSCA FLEXÍVEL)
      // Usando verificação manual com os dados já obtidos
      let telefoneJaCadastrado = false;
      let perfilExistente = null;

      if (todosPerfis && todosPerfis.length > 0) {
        perfilExistente = todosPerfis.find(
          perfil => telefonesCompativeis(perfil.telefone, formData.telefone)
        );

        if (perfilExistente) {
          telefoneJaCadastrado = true;
        }
      }
      
      console.log('Verificação manual - Telefone já cadastrado (SUBMIT):', telefoneJaCadastrado);
      console.log('Verificação manual - Perfil encontrado (SUBMIT):', perfilExistente);
      
      if (telefoneJaCadastrado) {
        console.log('TELEFONE JÁ CADASTRADO EM OUTRO PERFIL (SUBMIT):', formData.telefone);
        console.log('Perfil encontrado (SUBMIT):', JSON.stringify(perfilExistente));
        throw new Error('Este telefone já está cadastrado em outra conta.');
      }

      console.log('TELEFONE VÁLIDO (SUBMIT):', formData.telefone);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Erro ao criar usuário');

      const { error: profileError } = await supabase
        .from('perfis')
        .insert([
          {
            user_id: signUpData.user.id,
            nome_completo: formData.nomeCompleto,
            telefone: formData.telefone,
            sexo: formData.sexo,
            role: 'cliente',
            liberado: 'nao',
          },
        ])
        .select()
        .single();

      if (profileError) {
        // Nota: Não podemos deletar o usuário aqui sem privilégios admin
        // O Supabase gerenciará usuários órfãos através de policies e triggers
        console.error('Erro ao criar perfil:', profileError);
        throw profileError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro('Erro ao criar conta. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="w-full max-w-md mx-4">
          <div className={`${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          } rounded-2xl shadow-2xl border p-8 text-center space-y-6`}>
            
            <div className={`${
              isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
            } rounded-full p-6 mx-auto w-fit`}>
              <CheckCircle className={`h-16 w-16 ${
                isDarkMode ? 'text-green-400' : 'text-green-500'
              }`} />
            </div>
            
            <div className="space-y-3">
              <h2 className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Cadastro realizado!
              </h2>
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Sua conta foi criada com sucesso. Agora é hora de começar sua jornada fitness!
              </p>
            </div>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-white"
            >
              Fazer Login
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${
      isDarkMode 
        ? 'bg-black' 
        : 'bg-white'
    }`}>
      
      {/* Left Side - Hero Section */}
      <div className={`hidden lg:flex lg:w-1/2 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-black' 
          : 'bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600'
      } relative overflow-hidden`}>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 w-full">
          <div className="max-w-md">
            <img
              src="/images/Logo-Consultoria.png"
              alt="Consultoria Extermina Frango"
              className="w-20 h-20 mx-auto mb-6 drop-shadow-2xl"
            />
            
            <h1 className="text-4xl font-black text-white mb-4 leading-tight">
              JUNTE-SE AO
              <br />
              <span className="text-yellow-300">EXTERMINA</span>
            </h1>
            
            <p className="text-lg text-white/90 mb-6 leading-relaxed">
              Faça parte da nossa comunidade fitness e transforme seu corpo de uma vez por todas.
            </p>
            
            <div className="space-y-3 text-white/80">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Planos personalizados</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Suporte especializado</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Comunidade ativa</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl"></div>
      </div>
      
      {/* Right Side - Registration Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-6 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/images/Logo-Consultoria.png"
              alt="Consultoria Extermina Frango"
              className="w-12 h-12 mx-auto mb-3"
            />
            <h1 className={`text-2xl font-black ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              EXTERMINA <span className="text-orange-500">FRANGO</span>
            </h1>
          </div>
          
          {/* Form Header */}
          <div className="mb-6">
            <h2 className={`text-2xl font-bold mb-1 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Criar sua conta
            </h2>
            <p className={`text-base ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Comece sua transformação hoje mesmo
            </p>
          </div>
          
          {/* Messages */}
          {erro && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{erro}</span>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label htmlFor="nomeCompleto" className={`block text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Nome Completo
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="nomeCompleto"
                  name="nomeCompleto"
                  type="text"
                  required
                  value={formData.nomeCompleto}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="João da Silva"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="joao@email.com"
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className={`block text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Telefone (DDD + Número)
              </label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  required
                  value={formData.telefone}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="11999999999"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {telefoneStatus === 'checking' ? (
                    <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                  ) : telefoneStatus === 'valid' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : telefoneStatus === 'invalid' ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>
              <p className={`mt-1 text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Digite apenas números: DDD + número (10 ou 11 dígitos)
              </p>
              {telefoneMessage && (
                <p className={`mt-1 text-xs flex items-center gap-2 ${
                  telefoneStatus === 'valid' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {telefoneStatus === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {telefoneStatus === 'valid' && <Check className="h-3 w-3" />}
                  {telefoneStatus === 'invalid' && <X className="h-3 w-3" />}
                  {telefoneMessage}
                </p>
              )}
            </div>

            {/* Sexo */}
            <div>
              <label htmlFor="sexo" className={`block text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Sexo
              </label>
              <div className="relative">
                <select
                  id="sexo"
                  name="sexo"
                  required
                  value={formData.sexo}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-8 py-3 rounded-xl border-2 transition-all duration-200 appearance-none ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                >
                  <option value="" disabled>Selecione seu sexo</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className={`h-4 w-4 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="senha" className={`block text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Senha
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="senha"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.senha}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                  } transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmarSenha" className={`block text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                  } transition-colors`}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || telefoneStatus === 'invalid'}
              className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold transition-all duration-200 transform ${
                loading || telefoneStatus === 'invalid'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-lg hover:shadow-xl hover:-translate-y-1'
              } text-white`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cadastrando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Criar conta
                </>
              )}
            </button>
          </form>
          
          {/* Divider */}
          <div className="my-6 relative">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${
                isDarkMode ? 'bg-black text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}>
                Já tem uma conta?
              </span>
            </div>
          </div>
          
          {/* Login Link */}
          <Link
            to="/login"
            className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold border-2 transition-all duration-200 transform hover:-translate-y-1 ${
              isDarkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-900 hover:border-gray-600' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
            }`}
          >
            Fazer login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}