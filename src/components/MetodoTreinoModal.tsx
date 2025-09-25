import React from 'react';
import { X } from 'lucide-react';
import { MetodoTreino } from '../utils/metodosTreino';

interface MetodoTreinoModalProps {
  metodo: MetodoTreino;
  onClose: () => void;
}

export const MetodoTreinoModal: React.FC<MetodoTreinoModalProps> = ({ metodo, onClose }) => {
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
            <X className="w-6 h-6" />
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

export default MetodoTreinoModal; 