import React, { useEffect, useState } from 'react';

interface MedidasCorporais {
  bracos: number;
  antebracos: number;
  cintura: number;
  quadril: number;
  coxas: number;
  panturrilhas: number;
}

interface AvatarMedidasProps {
  medidas: MedidasCorporais;
  userId: string;
  sexo: 'M' | 'F' | 'masculino' | 'feminino';
}

// Coordenadas específicas para cada gênero
const COORDENADAS_MEDIDAS_MASCULINO = {
  bracos: { x: 88, y: 72 },
  antebracos: { x: 73, y: 113 },
  cintura: { x: 370, y: 197 },
  quadril: { x: 372, y: 238 },
  coxas: { x: 105, y: 320 },
  panturrilhas: { x: 124, y: 360 }
};

const COORDENADAS_MEDIDAS_FEMININO = {
  bracos: { x: 94, y: 86 },
  antebracos: { x: 66, y: 115 },
  cintura: { x: 370, y: 195 },
  quadril: { x: 380, y: 227 },
  coxas: { x: 120, y: 300 },
  panturrilhas: { x: 118, y: 403 }
};

const IMAGE_WIDTH = 512;
const IMAGE_HEIGHT = 512;

const AvatarMedidas: React.FC<AvatarMedidasProps> = ({ medidas, userId, sexo }) => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateAvatar();
  }, [medidas]);

  const generateAvatar = async () => {
    console.log('🚀 Gerando avatar dinâmico:', { medidas, userId, sexo });
    setLoading(true);
    setError(null);

    try {
      // Normalizar sexo com fallback para masculino
      const sexoNormalizado = (sexo === 'M' || sexo?.toLowerCase?.() === 'masculino') ? 'M' : 'F';
      
      // Criar canvas dinamicamente
      const canvas = document.createElement('canvas');
      canvas.width = IMAGE_WIDTH;
      canvas.height = IMAGE_HEIGHT;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Contexto 2D não disponível');

      // Carregar imagem base
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Desenhar imagem base
          ctx.drawImage(img, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

          // Desenhar medidas sobre a imagem
          drawMedidasOnCanvas(ctx, medidas, sexoNormalizado);

          // Converter canvas para data URL e exibir
          const dataUrl = canvas.toDataURL('image/png');
          setImageDataUrl(dataUrl);
          
          console.log('✅ Avatar gerado com sucesso');
        } catch (error) {
          console.error('Erro ao processar canvas:', error);
          setError('Erro ao processar imagem do avatar');
        } finally {
          setLoading(false);
        }
      };

      img.onerror = (error) => {
        console.error('Erro ao carregar imagem base:', error);
        setError('Erro ao carregar imagem base');
        setLoading(false);
      };

      // Selecionar imagem baseada no gênero
      const imagemSrc = sexoNormalizado === 'M' 
        ? '/images/versao-masculina.png'
        : '/images/versao-feminina.png';
      
      console.log('📷 Carregando imagem:', imagemSrc, 'para sexo original:', sexo, 'normalizado:', sexoNormalizado);
      img.src = imagemSrc;
      
    } catch (error) {
      console.error('Erro ao gerar avatar:', error);
      setError('Erro ao processar imagem do avatar');
      setLoading(false);
    }
  };

  const drawMedidasOnCanvas = (ctx: CanvasRenderingContext2D, medidas: MedidasCorporais, sexo: 'M' | 'F') => {
    // Configurações de estilo
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Selecionar coordenadas baseadas no gênero
    const coordenadas = sexo === 'M' ? COORDENADAS_MEDIDAS_MASCULINO : COORDENADAS_MEDIDAS_FEMININO;

    // Desenhar cada medida
    Object.entries(medidas).forEach(([nome, valor]) => {
      const coordenada = coordenadas[nome as keyof MedidasCorporais];
      if (coordenada && valor > 0) {
        const nomeFormatado = nome === 'bracos' ? 'Braço' : 
                             nome === 'antebracos' ? 'Antebraço' : 
                             nome === 'coxas' ? 'Coxa' : 
                             nome === 'panturrilhas' ? 'Panturrilha' : 
                             nome.charAt(0).toUpperCase() + nome.slice(1);
        const valorFormatado = valor.toFixed(1).replace('.', ',');
        drawMedidaLabel(ctx, `${nomeFormatado}: ${valorFormatado}cm`, coordenada.x, coordenada.y);
      }
    });
  };

  const drawMedidaLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
    // Configurações simples para texto preto
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Texto preto simples, sem fundo
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x, y);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">Gerando avatar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">      
      {imageDataUrl && (
        <div className="relative">
          <img 
            src={imageDataUrl} 
            alt="Avatar com medidas corporais"
            className="max-w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: '500px' }}
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Avatar Dinâmico
          </div>
        </div>
      )}
      
      {/* Legenda das medidas */}
      <div className="mt-6 text-center max-w-lg mx-auto">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            <span className="text-green-600 dark:text-green-400 font-bold">📏 Avatar Dinâmico:</span> 
            Imagem gerada automaticamente com suas medidas corporais em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvatarMedidas;