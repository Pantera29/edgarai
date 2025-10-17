/**
 * Validación de parámetros para templates de WhatsApp
 */

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface Template {
  body_text: string;
  parameter_format: string;
  parameter_count: number;
}

/**
 * Valida que los parámetros proporcionados coincidan con los requeridos por el template
 * 
 * @param template - Template de WhatsApp con body_text, parameter_format y parameter_count
 * @param parameters - Parámetros a validar (objeto para NAMED, array para POSITIONAL)
 * @returns ValidationResult con valid=true o valid=false con mensaje de error
 */
export function validateTemplateParameters(
  template: Template,
  parameters: Record<string, any> | any[]
): ValidationResult {
  
  if (template.parameter_format === 'NAMED') {
    // Validar que parameters sea un objeto
    if (Array.isArray(parameters)) {
      return {
        valid: false,
        error: 'Parameters debe ser un objeto para templates con formato NAMED'
      };
    }

    // Extraer parámetros requeridos del body_text usando regex
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [...template.body_text.matchAll(regex)];
    const requiredParams = matches.map(m => m[1]);

    // Verificar que todos los parámetros requeridos estén presentes
    const providedParams = Object.keys(parameters);
    const missingParams = requiredParams.filter(param => !providedParams.includes(param));

    if (missingParams.length > 0) {
      return {
        valid: false,
        error: `Parámetros faltantes: ${missingParams.join(', ')}`
      };
    }

    return { valid: true };
  } 
  
  if (template.parameter_format === 'POSITIONAL') {
    // Validar que parameters sea un array
    if (!Array.isArray(parameters)) {
      return {
        valid: false,
        error: 'Parameters debe ser un array para templates con formato POSITIONAL'
      };
    }

    // Verificar que la cantidad de parámetros coincida
    if (parameters.length !== template.parameter_count) {
      return {
        valid: false,
        error: `Se esperaban ${template.parameter_count} parámetros, se recibieron ${parameters.length}`
      };
    }

    return { valid: true };
  }

  // Formato desconocido
  return {
    valid: false,
    error: `Formato de parámetros desconocido: ${template.parameter_format}`
  };
}

