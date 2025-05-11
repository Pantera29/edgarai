export const stringToSafeDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  try {
    // Parseamos la fecha directamente en formato YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    // Creamos una fecha a las 12 del mediodía para evitar problemas de zona horaria
    // Nota: month-1 porque en JavaScript los meses van de 0-11
    return new Date(year, month-1, day, 12, 0, 0);
  } catch (error) {
    console.error('Error al convertir fecha:', error);
    return new Date();
  }
}; 