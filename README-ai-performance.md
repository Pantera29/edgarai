# README-ai-performance.md

## 🎯 Objetivo
Exponer un endpoint `/api/ai-performance` que retorna el performance semanal del agente AI (citas agendadas por AI vs manuales) para un dealership, usando la función RPC `get_weekly_ai_performance`.

## 📁 Archivos Creados/Modificados
- `app/api/ai-performance/route.ts`: Nuevo endpoint GET con cache in-memory y logs en español.
- `README-ai-performance.md`: Este archivo de documentación.

## 🚀 Implementación
- Endpoint: `GET /api/ai-performance?dealership_id=...&months=...`
- Parámetros:
  - `dealership_id` (requerido)
  - `months` (opcional, default 3, máximo 12)
- Llama a la función RPC `get_weekly_ai_performance(p_dealership_id, p_months)` en Supabase.
- Respuesta:
```json
{
  "weeks": [
    {
      "semana": "21/07 - 27/07/2025",
      "fecha_inicio": "2025-07-21",
      "fecha_fin": "2025-07-27",
      "agenteai_citas": 11,
      "manual_citas": 4,
      "total_citas": 15,
      "agenteai_percentage": "73.3"
    }
  ]
}
```
- Cache in-memory por dealership/meses (TTL 5 minutos).
- Logs con emojis para debugging.
- Manejo de errores y validaciones idéntico a `/api/conversations/kpis`.

## 🧪 Testing
1. Realizar petición GET:
   - `/api/ai-performance?dealership_id=DEALERSHIP_ID`
   - `/api/ai-performance?dealership_id=DEALERSHIP_ID&months=6`
2. Verificar logs en consola:
   - 📊 Obteniendo performance del agente AI para dealership: ...
   - 🚀 AI Performance cache hit
   - 💾 Computing fresh AI performance data
   - ✅ Performance AI calculada exitosamente
   - ❌ Error ejecutando get_weekly_ai_performance: ...
3. Validar respuesta:
   - Formato `{ weeks: [...] }`
   - Error 400 si falta dealership_id
   - Error 500 si falla la RPC

## 📈 Impacto
- Permite visualizar el impacto del agente AI en la generación de citas por semana.
- Facilita dashboards y reportes de adopción AI para cada dealership.
- Mejora performance con cache y reduce llamadas a la base de datos. 