import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, Heart } from 'lucide-react';

export function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <img
            src="/images/Logo-Consultoria.png"
            alt="Consultoria Extermina Frango"
            className="w-20 h-20 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            EXTERMINA <span className="text-orange-500">FRANGO</span>
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de Gestão de Fitness e Nutrição
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cliente */}
          <Link
            to="/login"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-orange-200 transform hover:-translate-y-2"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Área do Cliente
            </h2>
            <p className="text-gray-600 mb-4">
              Acesse suas avaliações, programações e resultados personalizados
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div>• Programação física</div>
              <div>• Programação nutricional</div>
              <div>• Acompanhamento de resultados</div>
            </div>
          </Link>

          {/* Staff */}
          <Link
            to="/staff"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-blue-200 transform hover:-translate-y-2"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Área Staff
            </h2>
            <p className="text-gray-600 mb-4">
              Acesso restrito para administradores e preparadores
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div>• Gestão de usuários</div>
              <div>• Análise de documentos</div>
              <div>• Controle administrativo</div>
            </div>
          </Link>

          {/* Cadastro */}
          <Link
            to="/cadastro"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-green-200 transform hover:-translate-y-2"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Novo Cliente
            </h2>
            <p className="text-gray-600 mb-4">
              Crie sua conta gratuita e comece sua transformação
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div>• Cadastro gratuito</div>
              <div>• Avaliação inicial</div>
              <div>• Programação personalizada</div>
            </div>
          </Link>
        </div>

        {/* URLs de teste */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">URLs de Acesso:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong className="text-orange-600">Cliente:</strong>
              <br />
              <code className="text-gray-600">/login</code> ou <code className="text-gray-600">/</code>
            </div>
            <div>
              <strong className="text-blue-600">Staff:</strong>
              <br />
              <code className="text-gray-600">/staff</code>
            </div>
            <div>
              <strong className="text-green-600">Cadastro:</strong>
              <br />
              <code className="text-gray-600">/cadastro</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}