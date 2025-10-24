/**
 * Función de merge inteligente para conversaciones
 * Optimiza re-renders comparando timestamps antes de actualizar
 * 
 * Basado en la estrategia de Kapso para reducir re-renders innecesarios
 */

/**
 * Merge inteligente de conversaciones que solo actualiza items que realmente cambiaron
 * @param prev - Array anterior de conversaciones
 * @param newData - Array nuevo de conversaciones del servidor
 * @param idField - Campo que identifica únicamente cada conversación (ej: 'id')
 * @param timestampField - Campo que indica cuándo fue la última actualización (ej: 'last_message_time')
 * @returns Array optimizado que minimiza re-renders
 */
export function mergeConversations<T extends Record<string, any>>(
  prev: T[],
  newData: T[],
  idField: keyof T,
  timestampField: keyof T
): T[] {
  // Si no hay datos previos, devolver los nuevos directamente
  if (prev.length === 0) {
    return newData;
  }

  // Si no hay datos nuevos, devolver los previos (sin cambios)
  if (newData.length === 0) {
    return prev;
  }

  // Crear mapa de conversaciones existentes para búsqueda O(1)
  const prevMap = new Map<string, T>();
  prev.forEach(item => {
    const id = String(item[idField]);
    prevMap.set(id, item);
  });

  // Variables para tracking de cambios
  let hasChanges = false;
  const mergedMap = new Map<string, T>();

  // Procesar cada conversación nueva
  newData.forEach(newItem => {
    const id = String(newItem[idField]);
    const existingItem = prevMap.get(id);

    if (!existingItem) {
      // ✅ Nueva conversación - agregar
      mergedMap.set(id, newItem);
      hasChanges = true;
      console.log(`🆕 [Merge] Nueva conversación: ${id}`);
    } else {
      // Verificar si el timestamp cambió
      const prevTimestamp = existingItem[timestampField];
      const newTimestamp = newItem[timestampField];

      if (prevTimestamp !== newTimestamp) {
        // ✅ Timestamp cambió - actualizar
        mergedMap.set(id, newItem);
        hasChanges = true;
        console.log(`🔄 [Merge] Conversación actualizada: ${id} (${prevTimestamp} → ${newTimestamp})`);
      } else {
        // ⏭️ Sin cambios - mantener el objeto existente (misma referencia en memoria)
        mergedMap.set(id, existingItem);
        console.log(`⏭️ [Merge] Sin cambios: ${id}`);
      }
    }
  });

  // Si no hubo cambios, devolver el array original (React no re-renderiza)
  if (!hasChanges) {
    console.log(`✅ [Merge] No hay cambios - manteniendo array anterior (${prev.length} items)`);
    return prev;
  }

  // Convertir mapa a array y ordenar por timestamp descendente
  const result = Array.from(mergedMap.values()).sort((a, b) => {
    const timestampA = new Date(a[timestampField] || 0).getTime();
    const timestampB = new Date(b[timestampField] || 0).getTime();
    return timestampB - timestampA; // Más reciente primero
  });

  console.log(`🔄 [Merge] Cambios detectados - nuevo array con ${result.length} items`);
  return result;
}

/**
 * Función especializada para merge de conversaciones con campos por defecto
 * Usa 'id' como campo identificador y 'last_message_time' como timestamp
 */
export function mergeConversationList<T extends Record<string, any>>(
  prev: T[],
  newData: T[]
): T[] {
  return mergeConversations(prev, newData, 'id', 'last_message_time');
}

/**
 * Función especializada para merge de conversaciones de acción humana
 * Usa 'id' como campo identificador y 'last_message_time' como timestamp
 */
export function mergeActionHumanConversations<T extends Record<string, any>>(
  prev: T[],
  newData: T[]
): T[] {
  return mergeConversations(prev, newData, 'id', 'last_message_time');
}
