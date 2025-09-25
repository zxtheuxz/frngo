import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-brand-dark flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        {/* Indicador de carregamento simplificado */}
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full mb-8 animate-spin"></div>
        
        {/* Texto de loading */}
        <p className="text-brand-light text-lg font-medium">{message}</p>
      </div>
    </div>
  );
} 