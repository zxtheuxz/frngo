import { useEffect, useRef } from 'react';

interface UsePageVisibilityOptions {
  onVisible?: () => void;
  onHidden?: () => void;
  preventRefetchOnFocus?: boolean;
}

export const usePageVisibility = (options: UsePageVisibilityOptions = {}) => {
  const { onVisible, onHidden, preventRefetchOnFocus = true } = options;
  const wasHiddenRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
        onHidden?.();
      } else {
        // Só chama onVisible se:
        // 1. Não está prevenindo refetch OU
        // 2. É a primeira vez que carrega
        if (!preventRefetchOnFocus || !hasLoadedOnceRef.current) {
          onVisible?.();
          hasLoadedOnceRef.current = true;
        }
        wasHiddenRef.current = false;
      }
    };

    const handleFocus = () => {
      // Previne refetch quando voltar o foco se já carregou uma vez
      if (!preventRefetchOnFocus || !hasLoadedOnceRef.current) {
        if (wasHiddenRef.current) {
          onVisible?.();
          hasLoadedOnceRef.current = true;
        }
      }
    };

    const handleBlur = () => {
      wasHiddenRef.current = true;
      onHidden?.();
    };

    // Adicionar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Marcar como carregado na primeira montagem
    if (!document.hidden) {
      hasLoadedOnceRef.current = true;
    }

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onVisible, onHidden, preventRefetchOnFocus]);

  return {
    isVisible: !document.hidden,
    hasLoadedOnce: hasLoadedOnceRef.current
  };
};