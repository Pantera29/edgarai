import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Parámetros de configuración para el hook useAutoPolling
 */
interface UseAutoPollingOptions {
  /** Intervalo en milisegundos entre ejecuciones (default: 5000) */
  interval?: number;
  /** Si el polling está habilitado (default: true) */
  enabled?: boolean;
  /** Función async que se ejecutará en cada intervalo */
  onPoll: () => Promise<void> | void;
  /** ✅ FASE 3: Función opcional para calcular intervalo dinámico */
  dynamicInterval?: () => number;
}

/**
 * Valores retornados por el hook useAutoPolling
 */
interface UseAutoPollingReturn {
  /** Indica si el polling está actualmente activo */
  isPolling: boolean;
  /** Indica si el polling está pausado por pestaña oculta */
  isPaused: boolean;
}

/**
 * Hook reutilizable para auto-polling con pausa automática cuando la pestaña está oculta
 * 
 * Características:
 * - Ejecuta onPoll inmediatamente al montar
 * - Pausa automáticamente cuando la pestaña está oculta
 * - Reanuda cuando el usuario vuelve a la pestaña
 * - Cleanup robusto al desmontar
 * - Manejo de errores sin detener el polling
 * 
 * @param options - Configuración del polling
 * @returns Objeto con estado del polling
 */
export const useAutoPolling = ({
  interval = 5000,
  enabled = true,
  onPoll,
  dynamicInterval, // ✅ FASE 3: Nuevo parámetro
}: UseAutoPollingOptions): UseAutoPollingReturn => {
  // Estados del hook
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Referencias para evitar stale closures
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  /**
   * Función que ejecuta el polling
   * Incluye manejo de errores para no detener el polling
   */
  const executePoll = useCallback(async () => {
    try {
      console.log('🔄 Ejecutando polling...');
      await onPoll();
      console.log('✅ Polling ejecutado exitosamente');
    } catch (error) {
      console.error('❌ Error en polling:', error);
      // No detenemos el polling por errores, continuamos con el siguiente intervalo
    }
  }, [onPoll]);

  // Effect principal: maneja el inicio/parada del polling (estilo Kapso)
  useEffect(() => {
    if (!enabled) {
      setIsPolling(false);
      isPollingRef.current = false;
      return;
    }
    
    console.log('🚀 Polling iniciado');
    setIsPolling(true);
    isPollingRef.current = true;
    
    // Ejecutar inmediatamente
    executePoll();
    
    // ✅ FASE 3: Función que ejecuta poll y recalcula intervalo
    const scheduleNextPoll = () => {
      // Calcular intervalo dinámico o usar el fijo
      const currentInterval = dynamicInterval?.() ?? interval;
      
      intervalRef.current = setTimeout(() => {
        if (!isPausedRef.current && isPollingRef.current) {
          executePoll();
          scheduleNextPoll(); // Recursivo para recalcular intervalo
        }
      }, currentInterval);
    };
    
    // Iniciar ciclo de polling
    scheduleNextPoll();
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('🛑 Polling detenido');
      setIsPolling(false);
      isPollingRef.current = false;
    };
  }, [enabled, interval, executePoll, dynamicInterval]);

  // Effect para manejar la visibilidad de la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!isPausedRef.current) {
          console.log('⏸️ Polling pausado (pestaña oculta)');
          setIsPaused(true);
          isPausedRef.current = true;
        }
      } else {
        if (isPausedRef.current) {
          console.log('▶️ Polling reanudado (pestaña visible)');
          setIsPaused(false);
          isPausedRef.current = false;
          
          // Ejecutar inmediatamente al reanudar
          if (isPollingRef.current) {
            executePoll();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [executePoll]);

  return {
    isPolling,
    isPaused,
  };
};

export default useAutoPolling;
