// Utilitários para gerenciar cache da aplicação

// Cache global para useAnaliseCorpData
const dataCache = new Map<string, {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}>();

// Função para limpar cache específico do usuário para análise corporal
export const clearAnaliseCorpCache = (userId: string) => {
  const cacheKey = `analise_corp_${userId}`;
  
  // Limpar cache em memória
  dataCache.delete(cacheKey);
  
  // Limpar cache do sessionStorage
  try {
    sessionStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn('Erro ao limpar cache da sessão:', error);
  }
  
  console.log(`🧹 Cache da análise corporal limpo para usuário: ${userId}`);
};

// Função para limpar todos os caches relacionados ao usuário
export const clearAllUserCache = (userId: string) => {
  clearAnaliseCorpCache(userId);
  
  // Adicionar outros caches futuros aqui conforme necessário
  // clearOtherCache(userId);
};

export { dataCache };