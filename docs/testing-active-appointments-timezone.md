# Testing: Active Appointments con Timezone del Dealership

## 🧪 Guía de Testing para Validar Timezone

### Casos de Prueba Principales

#### 1. **Testing Básico - Timezone México**
```bash
# Llamar al endpoint
curl "http://localhost:3000/api/customers/[CLIENT_ID]/active-appointments"

# Verificar en logs de consola:
# 🌎 Configuración de timezone: {
#   dealershipId: "...",
#   timezone: "America/Mexico_City"
# }
# 📅 Cálculo de fecha local: {
#   utcDate: "2024-12-19T20:30:00.000Z",
#   timezone: "America/Mexico_City", 
#   localDate: "2024-12-19T14:30:00.000Z",  // ← 6 horas menos
#   todayString: "2024-12-19"               // ← Fecha local
# }
```

#### 2. **Testing de Fallback UTC**
Para probar el fallback, temporalmente corrompe la configuración del dealership:
```sql
-- En Supabase, temporalmente cambiar timezone a valor inválido
UPDATE dealership_configuration 
SET timezone = 'Invalid/Timezone'
WHERE dealership_id = 'TU_DEALERSHIP_ID';
```

```bash
# Llamar endpoint nuevamente
curl "http://localhost:3000/api/customers/[CLIENT_ID]/active-appointments"

# Verificar logs de fallback:
# ❌ Error al obtener configuración del dealership
# ⚠️ Usando fallback a UTC para el filtrado de fecha
# 🔍 Parámetros de búsqueda (fallback): {
#   timezone: "UTC (fallback)"
# }
```

#### 3. **Testing de Diferencias Horarias**
Crear citas de prueba para diferentes escenarios:

```sql
-- Insertar citas de prueba en base de datos
INSERT INTO appointment (client_id, appointment_date, status, ...) VALUES
('CLIENT_ID', '2024-12-18', 'pending', ...),  -- Ayer  
('CLIENT_ID', '2024-12-19', 'pending', ...),  -- Hoy
('CLIENT_ID', '2024-12-20', 'confirmed', ...); -- Mañana
```

**Escenarios esperados:**
- **Zona México (UTC-6)**: Si son las 2:00 AM UTC, en México son las 8:00 PM del día anterior
- **El filtro debería usar la fecha local mexicana**, no UTC

### Verificaciones de Comportamiento

#### ✅ **Comportamiento Correcto**
1. **Logs muestran timezone**: `"America/Mexico_City"`
2. **Fecha local calculada**: 6 horas menos que UTC (en invierno)
3. **Filtrado preciso**: Solo citas de "hoy en adelante" según hora local
4. **Fallback funcional**: Si falla config, usa UTC pero sigue funcionando

#### ❌ **Comportamientos a Detectar**
1. **Timezone ausente**: Logs muestran `undefined` o `null`
2. **Fechas incorrectas**: todayString usa UTC en lugar de local
3. **Errores sin fallback**: Endpoint falla completamente sin configuración

### Debugging con Logs

#### Logs Exitosos (Timezone Correcto)
```
🔍 Obteniendo información del cliente...
✅ Cliente encontrado: { clientId: "123", dealershipId: "ABC" }
🌎 Configuración de timezone: {
  dealershipId: "ABC",
  workshopId: "XYZ", 
  timezone: "America/Mexico_City"
}
📅 Cálculo de fecha local: {
  utcDate: "2024-12-19T20:30:00.000Z",
  timezone: "America/Mexico_City",
  localDate: "2024-12-19T14:30:00.000Z",
  todayString: "2024-12-19"
}
```

#### Logs con Fallback (Configuración Falla)
```
❌ Error al obtener configuración del dealership: {
  error: "Invalid timezone",
  dealershipId: "ABC"
}
⚠️ Usando fallback a UTC para el filtrado de fecha
🔍 Parámetros de búsqueda (fallback): {
  timezone: "UTC (fallback)"
}
```

### Comandos de Testing Útiles

#### Verificar Configuración de Dealership
```sql
SELECT dealership_id, timezone, shift_duration 
FROM dealership_configuration 
WHERE dealership_id = 'TU_DEALERSHIP_ID';
```

#### Verificar Citas del Cliente
```sql
SELECT id, appointment_date, appointment_time, status
FROM appointment 
WHERE client_id = 'CLIENT_ID' 
ORDER BY appointment_date DESC;
```

#### Simular Diferentes Zonas Horarias
```sql
-- Cambiar temporalmente timezone para testing
UPDATE dealership_configuration 
SET timezone = 'America/New_York'  -- UTC-5
WHERE dealership_id = 'TU_DEALERSHIP_ID';

-- Restaurar después del test
UPDATE dealership_configuration 
SET timezone = 'America/Mexico_City'  -- UTC-6
WHERE dealership_id = 'TU_DEALERSHIP_ID';
```

### Validación de Resultados

#### Respuesta HTTP Esperada
```json
{
  "appointments": [
    {
      "id": 456,
      "appointment_date": "2024-12-20",  // ← Solo fechas >= hoy (local)
      "appointment_time": "10:00:00",
      "status": "confirmed",
      "services": { ... },
      "vehicles": { ... }
    }
    // NO incluye citas de fechas pasadas según timezone local
  ]
}
```

### Métricas de Performance

#### Latencia Adicional Esperada
- **Consulta configuración**: +10-20ms
- **Cálculo timezone**: +1-2ms  
- **Total adicional**: ~15-25ms

El overhead es mínimo comparado con el beneficio de precisión en zonas horarias.

### Troubleshooting Común

#### Problema: "timezone is not defined"
**Solución**: Verificar que `dealership_configuration` tiene timezone configurado
```sql
UPDATE dealership_configuration 
SET timezone = 'America/Mexico_City' 
WHERE timezone IS NULL;
```

#### Problema: Fechas siempre en UTC
**Solución**: Verificar importaciones y que `date-fns-tz` esté instalado
```bash
npm list date-fns-tz
```

#### Problema: Endpoint muy lento
**Solución**: Verificar índices en base de datos
```sql
-- Asegurar índices en appointment
CREATE INDEX IF NOT EXISTS idx_appointment_client_date_status 
ON appointment(client_id, appointment_date, status);
```