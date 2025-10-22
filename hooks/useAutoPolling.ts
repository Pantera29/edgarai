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

  /**
   * Inicia el polling
   */
  const startPolling = useCallback(() => {
    if (!enabled || isPollingRef.current) {
      return;
    }

    console.log('🚀 Polling iniciado');
    setIsPolling(true);
    isPollingRef.current = true;

    // Ejecutar inmediatamente al iniciar
    executePoll();

    // Configurar el intervalo
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        executePoll();
      }
    }, interval);
  }, [enabled, interval, executePoll]);

  /**
   * Detiene el polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log('🛑 Polling detenido');
    setIsPolling(false);
    isPollingRef.current = false;
  }, []);

  /**
   * Pausa el polling (cuando la pestaña está oculta)
   */
  const pausePolling = useCallback(() => {
    if (!isPausedRef.current) {
      console.log('⏸️ Polling pausado (pestaña oculta)');
      setIsPaused(true);
      isPausedRef.current = true;
    }
  }, []);

  /**
   * Reanuda el polling (cuando el usuario vuelve a la pestaña)
   */
  const resumePolling = useCallback(() => {
    if (isPausedRef.current) {
      console.log('▶️ Polling reanudado (pestaña visible)');
      setIsPaused(false);
      isPausedRef.current = false;
      
      // Ejecutar inmediatamente al reanudar
      if (isPollingRef.current) {
        executePoll();
      }
    }
  }, [executePoll]);

  /**
   * Maneja el cambio de visibilidad de la pestaña
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      pausePolling();
    } else {
      resumePolling();
    }
  }, [pausePolling, resumePolling]);

  // Effect principal: maneja el inicio/parada del polling
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup al desmontar o cambiar enabled
    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  // Effect para manejar cambios en el intervalo
  useEffect(() => {
    if (isPollingRef.current && enabled) {
      // Reiniciar el polling con el nuevo intervalo
      stopPolling();
      startPolling();
    }
  }, [interval, enabled, startPolling, stopPolling]);

  // Effect para manejar cambios en la función onPoll
  useEffect(() => {
    if (isPollingRef.current && enabled) {
      // Reiniciar el polling con la nueva función
      stopPolling();
      startPolling();
    }
  }, [onPoll, enabled, startPolling, stopPolling]);

  // Effect para manejar la visibilidad de la pestaña
  useEffect(() => {
    // Agregar listener para detectar cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup del listener
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Cleanup final al desmontar el componente
  useEffect(() => {
    return () => {
      // Limpiar interval si existe
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Remover listener de visibilidad
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      console.log('🧹 Cleanup completo del hook useAutoPolling');
    };
  }, [handleVisibilityChange]);

  return {
    isPolling,
    isPaused,
  };
};

export default useAutoPolling;
