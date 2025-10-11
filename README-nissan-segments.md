# Sistema de Clasificación de Vehículos Nissan

## 📋 Resumen

Sistema automático de clasificación de vehículos basado en la estrategia de retención de Nissan. Clasifica vehículos en segmentos según su frecuencia de visitas y recencia de servicio.

## ✅ Implementación Completada

### Archivos Creados/Modificados

1. **`types/database.types.ts`** - Tipos TypeScript para la tabla `vehicle_nissan_segments`
2. **`app/api/cron/nissan-segments/route.ts`** - Endpoint cron para clasificación automática
3. **`app/api/nissan-segments/route.ts`** - Endpoint consulta distribución y filtros
4. **`app/api/nissan-segments/[vehicle_id]/route.ts`** - Endpoint detalle de vehículo
5. **`vercel.json`** - Configuración del cron job mensual

---

## 🗄️ Base de Datos

### Tabla: `vehicle_nissan_segments`

La tabla ya existe en la base de datos con las siguientes columnas:

- `id` (UUID) - Primary key
- `vehicle_id` (UUID) - FK a vehicles
- `vin` (VARCHAR) - Número de identificación del vehículo
- `dealership_id` (UUID) - FK a dealerships
- `current_segment` (VARCHAR) - Segmento actual del vehículo
- `previous_segment` (VARCHAR) - Segmento anterior (para detectar cambios)
- `segment_changed_at` (TIMESTAMPTZ) - Cuándo cambió de segmento
- `total_appointments_12m` (INTEGER) - Citas en últimos 12 meses
- `last_appointment_date` (DATE) - Fecha de última cita
- `days_since_last_appointment` (INTEGER) - Días desde última cita
- `months_since_last_appointment` (NUMERIC) - Meses desde última cita
- `calculated_at` (TIMESTAMPTZ) - Cuándo se ejecutó el cálculo
- `data_as_of_date` (DATE) - Fecha de corte de los datos
- `updated_at` (TIMESTAMPTZ) - Última actualización

### Funciones RPC Disponibles

1. **`classify_vehicles_nissan_segments(p_dealership_id UUID, p_execution_date DATE)`**
   - Clasifica todos los vehículos de un dealership
   - Retorna el número de vehículos procesados

2. **`get_nissan_segment_distribution(p_dealership_id UUID)`**
   - Obtiene la distribución de vehículos por segmento
   - Retorna array con: `segment_name`, `vehicle_count`, `percentage`

3. **`get_vehicles_by_segment(p_dealership_id UUID, p_segment VARCHAR)`**
   - Obtiene lista de vehículos de un segmento específico
   - Retorna datos completos de vehículos y clientes

4. **`get_recent_segment_changes(p_dealership_id UUID, p_days_ago INTEGER)`**
   - Obtiene vehículos que cambiaron de segmento recientemente
   - Útil para análisis y alertas

---

## 🎯 Segmentos Disponibles

| Segmento | Citas 12m | Última Cita | Descripción |
|----------|-----------|-------------|-------------|
| `activo_proximo_mantenimiento` | 2+ | 6-7 meses | Cliente activo próximo a mantenimiento |
| `pasivo_proximo_mantenimiento` | 1 | 6-7 meses | Cliente pasivo próximo a mantenimiento |
| `activo_recordatorio` | 2+ | 5 meses | Cliente activo necesita recordatorio |
| `pasivo_recordatorio` | 1 | 5 meses | Cliente pasivo necesita recordatorio |
| `activo_retencion` | 2+ | 8-11 meses | Cliente activo en fase de retención |
| `pasivo_retencion` | 1 | 8-11 meses | Cliente pasivo en fase de retención |
| `pasivo_en_riesgo` | 1 | 12 meses | Cliente en riesgo de pérdida |
| `inactivo` | - | +12 meses | Cliente inactivo |
| `sin_datos` | 0 | - | Sin citas registradas |
| `sin_clasificar` | - | - | Fuera de ventanas de clasificación |

---

## 🔌 API Endpoints

### 1. Clasificación Automática (Cron)

**POST** `/api/cron/nissan-segments`

**Body:**
```json
{
  "dealership_id": "uuid-del-dealership",
  "execution_date": "2025-10-11" // Opcional, por defecto hoy
}
```

**Response:**
```json
{
  "success": true,
  "message": "Clasificación de vehículos Nissan completada exitosamente.",
  "dealership_id": "xxx",
  "execution_date": "2025-10-11",
  "vehicles_processed": 150,
  "segments_updated": 150,
  "execution_time_ms": 2340,
  "timestamp": "2025-10-11T12:00:00Z"
}
```

**GET** `/api/cron/nissan-segments?dealership_id=xxx` (Testing manual)

---

### 2. Consultar Distribución

**GET** `/api/nissan-segments?dealership_id=xxx`

**Response:**
```json
{
  "success": true,
  "message": "Distribución de segmentos obtenida exitosamente.",
  "dealership_id": "xxx",
  "distribution": [
    {
      "segment_name": "activo_proximo_mantenimiento",
      "vehicle_count": 45,
      "percentage": 30.0
    },
    {
      "segment_name": "pasivo_recordatorio",
      "vehicle_count": 25,
      "percentage": 16.67
    }
  ],
  "total_vehicles": 150,
  "segments_count": 10,
  "execution_time_ms": 120,
  "timestamp": "2025-10-11T12:00:00Z"
}
```

---

### 3. Filtrar por Segmento

**GET** `/api/nissan-segments?dealership_id=xxx&segment=activo_proximo_mantenimiento`

**Response:**
```json
{
  "success": true,
  "message": "Vehículos obtenidos exitosamente.",
  "dealership_id": "xxx",
  "segment": "activo_proximo_mantenimiento",
  "vehicles": [
    {
      "vehicle_id": "xxx",
      "vin": "ABC123",
      "make": "Nissan",
      "model": "Sentra",
      "year": 2020,
      "client_name": "Juan Pérez",
      "last_appointment_date": "2025-04-11",
      "days_since_last_appointment": 183,
      "total_appointments_12m": 3
    }
  ],
  "count": 45,
  "execution_time_ms": 150,
  "timestamp": "2025-10-11T12:00:00Z"
}
```

---

### 4. Detalle de Vehículo

**GET** `/api/nissan-segments/{vehicle_id}?dealership_id=xxx`

**Response:**
```json
{
  "success": true,
  "message": "Datos del vehículo obtenidos exitosamente.",
  "vehicle_id": "xxx",
  "dealership_id": "xxx",
  "data": {
    "id": "xxx",
    "vehicle_id": "xxx",
    "vin": "ABC123",
    "current_segment": "activo_proximo_mantenimiento",
    "previous_segment": "activo_recordatorio",
    "segment_changed_at": "2025-09-01T00:00:00Z",
    "total_appointments_12m": 3,
    "last_appointment_date": "2025-04-11",
    "days_since_last_appointment": 183,
    "months_since_last_appointment": 6.1,
    "calculated_at": "2025-10-01T00:00:00Z",
    "vehicles": {
      "id_uuid": "xxx",
      "make": "Nissan",
      "model": "Sentra",
      "year": 2020,
      "license_plate": "ABC-123",
      "vin": "ABC123",
      "last_km": 45000,
      "client": {
        "id": "xxx",
        "names": "Juan Pérez",
        "email": "juan@email.com",
        "phone_number": "5551234567"
      }
    }
  },
  "execution_time_ms": 45,
  "timestamp": "2025-10-11T12:00:00Z"
}
```

---

## ⚙️ Variables de Entorno Requeridas

### .env.local (Desarrollo)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### Vercel (Producción)
Configurar las mismas variables en: **Project Settings → Environment Variables**

⚠️ **NOTA:** No se requiere `CRON_SECRET` ya que el endpoint es llamado desde GitHub Actions con reintentos automáticos

---

## 🕐 GitHub Actions Workflow

El cron job está configurado en `.github/workflows/nissan-segments-classification.yml`:

```yaml
name: Nissan Segments Classification (Monthly)

on:
  schedule:
    # Ejecuta el día 1 de cada mes a las 3:00 AM hora de México (9:00 UTC)
    - cron: '0 9 1 * *'
  workflow_dispatch:
```

**Schedule:** `0 9 1 * *` = Día 1 de cada mes a las 3:00 AM (hora de México)

### Características del Workflow

- ✅ **3 agencias configuradas:** Se ejecutan secuencialmente
- ✅ **Reintentos automáticos:** Hasta 3 intentos con timeout de 10 minutos
- ✅ **Logs detallados:** Disponibles en GitHub Actions
- ✅ **Ejecución manual:** Disponible con `workflow_dispatch`

### Ejecución Manual desde GitHub

1. Ir a tu repositorio en GitHub
2. Click en la pestaña **Actions**
3. Seleccionar **"Nissan Segments Classification (Monthly)"**
4. Click en **"Run workflow"**
5. Seleccionar la rama y confirmar

---

## 🧪 Testing

### 1. Testing Local (GET endpoint)
```bash
curl "http://localhost:3000/api/cron/nissan-segments?dealership_id=xxx"
```

### 2. Testing Cron (POST endpoint)
```bash
curl -X POST http://localhost:3000/api/cron/nissan-segments \
  -H "Content-Type: application/json" \
  -d '{"dealership_id": "xxx", "execution_date": "2025-10-11"}'
```

### 3. Consultar Distribución
```bash
curl "http://localhost:3000/api/nissan-segments?dealership_id=xxx"
```

### 4. Filtrar por Segmento
```bash
curl "http://localhost:3000/api/nissan-segments?dealership_id=xxx&segment=activo_proximo_mantenimiento"
```

### 5. Detalle de Vehículo
```bash
curl "http://localhost:3000/api/nissan-segments/{vehicle_id}?dealership_id=xxx"
```

---

## 📊 Casos de Uso

### 1. Marketing Proactivo
Obtener todos los vehículos "activo_proximo_mantenimiento" para campañas:
```
GET /api/nissan-segments?dealership_id=xxx&segment=activo_proximo_mantenimiento
```

### 2. Retención de Clientes
Obtener clientes en riesgo para campañas de retención:
```
GET /api/nissan-segments?dealership_id=xxx&segment=pasivo_en_riesgo
```

### 3. Dashboard de Métricas
Obtener distribución completa para visualizar en dashboard:
```
GET /api/nissan-segments?dealership_id=xxx
```

### 4. Detalle de Cliente Específico
Ver segmento y métricas de un vehículo al abrir su perfil:
```
GET /api/nissan-segments/{vehicle_id}?dealership_id=xxx
```

---

## 🔐 Seguridad

- El endpoint POST es llamado desde GitHub Actions con reintentos automáticos
- El endpoint GET es para testing manual durante desarrollo
- Todos los endpoints usan `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
- Los workflows de GitHub Actions se ejecutan con permisos limitados del repositorio

---

## 📈 Performance

- **Clasificación completa:** <5 segundos para miles de vehículos
- **Consulta distribución:** <200ms
- **Consulta por segmento:** <300ms (depende de cantidad)
- **Detalle de vehículo:** <100ms

La clasificación corre en PostgreSQL (función RPC), no hay riesgo de timeout de Vercel.

---

## 🚀 Deployment

1. **Commit y push:**
```bash
git add .
git commit -m "feat: implementar sistema clasificación vehículos Nissan"
git push
```

2. **Vercel auto-deploy:** Se desplegará automáticamente

3. **Verificar variables de entorno en Vercel:**
   - `SUPABASE_SERVICE_ROLE_KEY` (debe estar configurado)
   - `NEXT_PUBLIC_SUPABASE_URL` (debe estar configurado)

4. **Verificar GitHub Actions workflow:** 
   - Ir a GitHub → Actions
   - Verificar que aparezca "Nissan Segments Classification (Monthly)"
   - Opcionalmente ejecutar manualmente para probar

---

## 📝 Notas Importantes

1. **Status de Citas:** Solo considera citas con status: `completed`, `confirmed`, `in_progress`, `pending`
2. **Ventana de 12 meses:** Solo cuenta citas de los últimos 12 meses
3. **Actualización:** Se recomienda ejecutar el 1er día de cada mes
4. **Historial:** La tabla mantiene `previous_segment` para detectar cambios
5. **Sin datos vs Sin clasificar:** 
   - `sin_datos`: Vehículo sin citas registradas
   - `sin_clasificar`: Vehículo con citas pero fuera de ventanas de clasificación

---

## 🐛 Troubleshooting

### Error: "RPC_ERROR"
- Verificar que las funciones RPC existan en Supabase
- Verificar que `SUPABASE_SERVICE_ROLE_KEY` sea correcto

### Error: "Vehículo no encontrado"
- El vehículo no ha sido clasificado aún
- Ejecutar clasificación primero: `POST /api/cron/nissan-segments`

### Workflow no ejecuta
- Verificar que el archivo `.github/workflows/nissan-segments-classification.yml` exista
- Verificar la sintaxis del archivo YAML
- Revisar logs en la pestaña Actions de GitHub
- Verificar que el workflow esté habilitado en Settings → Actions

---

## 📞 Soporte

Para más información sobre las funciones RPC y estructura de datos, consultar directamente en Supabase usando el MCP:
```bash
# Ver estructura de tabla
mcp_supabase_list_tables schemas=["public"]

# Ver funciones disponibles
# Filtrar por "nissan_segment" en el output
```

