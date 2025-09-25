import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { encontrarMetodoTreino } from '../utils/metodosTreino';

interface BotaoMetodoTreinoProps {
  nomeExercicio: string;
}

type MetodoTreino = {
  nome: string;
  descricao: string;
};

const METODO_PADRAO: MetodoTreino = {
  nome: "DEMO",
  descricao: "Este é um método de treino de demonstração. Na versão completa, você teria informações específicas sobre cada método, explicando como executá-lo corretamente para obter os melhores resultados."
};

// Modal de método de treino
const MetodoTreinoModal = ({ metodo, onClose }: { metodo: MetodoTreino; onClose: () => void }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
      onClick={(e) => {
        // Fechar o modal quando clicar fora do conteúdo
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            MÉTODO {metodo.nome}
          </h2>
          
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {metodo.descricao}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BotaoMetodoTreino: React.FC<BotaoMetodoTreinoProps> = ({ nomeExercicio }) => {
  const [modalAberto, setModalAberto] = useState(false);
  
  // Encontrar o método de treino no nome do exercício
  // Se não encontrar método, não mostrar o botão
  const metodoTreino = encontrarMetodoTreino ? encontrarMetodoTreino(nomeExercicio) : null;
  
  // Se não encontrar método, não renderiza nada
  if (!metodoTreino) return null;
  
  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md flex items-center transition-colors flex-shrink-0"
        title={`Ver informações sobre o método ${metodoTreino.nome}`}
      >
        <Info className="w-3 h-3 mr-1" /> MÉTODO
      </button>
      
      {modalAberto && (
        <MetodoTreinoModal
          metodo={metodoTreino}
          onClose={() => setModalAberto(false)}
        />
      )}
    </>
  );
};

export default BotaoMetodoTreino; 