import { normalizePhoneNumber } from "@/lib/utils";

// Valor predeterminado para dealership_id (usado como fallback SOLO cuando se solicita explícitamente)
export const DEFAULT_DEALERSHIP_ID = process.env.DEFAULT_DEALERSHIP_ID || '6b58f82d-baa6-44ce-9941-1a61975d20b5';

// Función para determinar el dealership_id basado en múltiples fuentes
export const getDealershipId = async ({
  dealershipId,
  dealershipPhone,
  phoneNumber, // Mantener por compatibilidad
  defaultId = DEFAULT_DEALERSHIP_ID,
  supabase,
  useFallback = false // ← NUEVO: Controlar si usar fallback
}: {
  dealershipId?: string | null;
  dealershipPhone?: string | null;
  phoneNumber?: string | null; // Mantener por compatibilidad
  defaultId?: string;
  supabase: any;
  useFallback?: boolean; // ← NUEVO: Por defecto NO usar fallback
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
      // Normalizar el número de teléfono usando la función de utilidad
      const normalizedPhone = normalizePhoneNumber(phoneToUse);
      
      console.log('🔍 Buscando dealership por teléfono:', {
        original: phoneToUse,
        normalized: normalizedPhone
      });
      
      const { data, error } = await supabase
        .from('dealership_mapping')
        .select('dealership_id')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();
      
      if (!error && data && data.dealership_id) {
        console.log('✅ Dealership encontrado:', {
          dealership_id: data.dealership_id,
          phone: normalizedPhone
        });
        return data.dealership_id;
      }
      
      if (!error && !data) {
        console.log('ℹ️ Dealership no encontrado para teléfono:', {
          original: phoneToUse,
          normalized: normalizedPhone
        });
      }
    } catch (error) {
      console.error('Error al buscar dealership por número de teléfono:', error);
      // NO continuar con el valor predeterminado automáticamente
    }
  }
  
  // Si no se encuentra y NO se permite fallback, retornar null
  if (!useFallback) {
    console.log('❌ No se encontró dealership y no se permite fallback');
    return null;
  }
  
  // Solo usar fallback si se solicita explícitamente
  console.log('🔄 Usando dealership_id por defecto (fallback solicitado):', defaultId);
  return defaultId;
};