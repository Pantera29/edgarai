/**
 * Funciones auxiliares para el Motor de Disponibilidad
 */

/**
 * Convierte "2025-10-15" a número de día de semana (1=lunes, 7=domingo)
 * @param dateString Fecha en formato "YYYY-MM-DD"
 * @returns Número del día de la semana (1-7)
 */
export function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + 'T12:00:00'); // Evitar problemas de zona horaria
  const jsDay = date.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
  // Convertir a 1=lunes, 7=domingo
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Convierte "HH:mm:ss" o "HH:mm" a minutos desde medianoche
 * @param time Tiempo en formato "HH:mm:ss" o "HH:mm"
 * @returns Minutos desde medianoche
 */
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a "HH:mm"
 * @param minutes Minutos desde medianoche
 * @returns Tiempo en formato "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Suma minutos a un tiempo
 * @param time Tiempo base en formato "HH:mm" o "HH:mm:ss"
 * @param minutes Minutos a sumar
 * @returns Nuevo tiempo en formato "HH:mm"
 * @example addMinutesToTime("07:00", 20) => "07:20"
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const baseMinutes = timeToMinutes(time);
  const newMinutes = baseMinutes + minutes;
  return minutesToTime(newMinutes);
}

/**
 * Verifica si un tiempo está dentro de un rango (inclusivo)
 * @param time Tiempo a verificar
 * @param start Inicio del rango
 * @param end Fin del rango
 * @returns true si el tiempo está dentro del rango
 * @example isTimeInRange("08:00", "07:00", "12:00") => true
 */
export function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMin = timeToMinutes(time);
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  return timeMin >= startMin && timeMin < endMin;
}

/**
 * Calcula la posición del slot dado un tiempo y hora de inicio
 * @param slotTime Tiempo del slot "HH:mm"
 * @param shiftStart Hora de inicio del turno "HH:mm:ss" o "HH:mm"
 * @param duration Duración de cada slot en minutos
 * @returns Posición del slot (1-based)
 * @example calculateSlotPosition("08:00", "07:00", 20) => 4
 */
export function calculateSlotPosition(
  slotTime: string,
  shiftStart: string,
  duration: number
): number {
  const slotMinutes = timeToMinutes(slotTime);
  const startMinutes = timeToMinutes(shiftStart);
  const position = Math.floor((slotMinutes - startMinutes) / duration) + 1;
  return position;
}

/**
 * Verifica si una lista de números es consecutiva desde 1
 * @param positions Array de posiciones
 * @returns true si las posiciones son consecutivas desde 1
 * @example
 * areConsecutiveFromOne([1, 2, 3, 4]) => true
 * areConsecutiveFromOne([1, 2, 4]) => false (falta el 3)
 * areConsecutiveFromOne([2, 3, 4]) => false (no empieza en 1)
 */
export function areConsecutiveFromOne(positions: number[]): boolean {
  if (positions.length === 0) return true;
  
  // Ordenar las posiciones
  const sorted = [...positions].sort((a, b) => a - b);
  
  // Verificar que empiece en 1
  if (sorted[0] !== 1) return false;
  
  // Verificar que sean consecutivos
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      return false;
    }
  }
  
  return true;
}

