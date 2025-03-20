// Valor predeterminado para dealership_id (usado como fallback)
export const DEFAULT_DEALERSHIP_ID = process.env.DEFAULT_DEALERSHIP_ID || '6b58f82d-baa6-44ce-9941-1a61975d20b5';

// Función para determinar el dealership_id basado en múltiples fuentes
export const getDealershipId = async ({
  dealershipId,
  dealershipPhone,
  phoneNumber, // Mantener por compatibilidad
  defaultId = DEFAULT_DEALERSHIP_ID,
  supabase
}: {
  dealershipId?: string | null;
  dealershipPhone?: string | null;
  phoneNumber?: string | null; // Mantener por compatibilidad
  defaultId?: string;
  supabase: any;
}) => {
  // Si se proporciona un dealership_id explícito, usarlo
  if (dealershipId) {
    return dealershipId;
  }
  
  // Usar dealershipPhone o phoneNumber (para compatibilidad)
  const phoneToUse = dealershipPhone || phoneNumber;
  
  // Si hay un número de teléfono, buscar en la tabla de mapeo
  if (phoneToUse && supabase) {
    try {
      const { data, error } = await supabase
        .from('dealership_mapping')
        .select('dealership_id')
        .eq('phone_number', phoneToUse)
        .maybeSingle();
      
      if (!error && data && data.dealership_id) {
        return data.dealership_id;
      }
    } catch (error) {
      console.error('Error al buscar dealership por número de teléfono:', error);
      // Continuar con el valor predeterminado
    }
  }
  
  // Si no se encuentra o hay un error, devolver el valor predeterminado
  return defaultId;
}; 