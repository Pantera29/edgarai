# Campo removed_additional en Modal de Citas

## 🎯 Objetivo
Agregar el campo `removed_additional` al modal de detalle de citas en la vista de calendario para mostrar el estado de los servicios adicionales.

## 📁 Archivos Modificados

### `app/backoffice/citas/calendario/page.tsx`
- **Línea 125**: Agregado `removed_additional` explícitamente en la consulta SQL
- **Líneas 580-586**: Agregado campo en el modal de detalle de citas

## 🔧 Cambios Realizados

### 1. Consulta de Datos
```typescript
// Antes
.select(`
  *,
  client:client_id (names, phone_number, email),
  vehicle:vehicle_id (make, model, license_plate, year),
  service:service_id (service_name, duration_minutes, price)
`)

// Después  
.select(`
  *,
  removed_additional,
  client:client_id (names, phone_number, email),
  vehicle:vehicle_id (make, model, license_plate, year),
  service:service_id (service_name, duration_minutes, price)
`)
```

### 2. Modal de Detalle
```typescript
// Agregado después del campo "Canal" y antes del "Estado"
<div className="font-medium">Servicios adicionales:</div>
<div>
  {selectedCita.removed_additional ? (
    <span className="text-red-600">❌ Removidos por cliente</span>
  ) : (
    <span className="text-green-600">✅ Incluidos</span>
  )}
</div>
```

## 🎨 Estilo y UX

### Estados Visuales
- **✅ Incluidos** (verde): Cuando `removed_additional = false` o `null`
- **❌ Removidos por cliente** (rojo): Cuando `removed_additional = true`

### Posicionamiento
- Ubicado después del campo "Canal" y antes del "Estado" en el modal
- La "Nota" aparece después de "Servicios adicionales" (si existe)
- El "Estado" aparece al final como campo editable
- Mantiene el estilo consistente con el resto de campos
- Usa el mismo grid layout (2 columnas)

## 🧪 Testing

### Para verificar que funciona:
1. Abrir el calendario de citas
2. Hacer clic en cualquier cita existente
3. Verificar que aparece el campo "Servicios adicionales"
4. Confirmar que muestra el estado correcto según el valor en la base de datos

### Casos de prueba:
- ✅ Cita con `removed_additional = false` → "✅ Incluidos"
- ✅ Cita con `removed_additional = true` → "❌ Removidos por cliente"  
- ✅ Cita con `removed_additional = null` → "✅ Incluidos"

## 📊 Impacto

### Beneficios
- **Visibilidad**: Los usuarios pueden ver rápidamente si los servicios adicionales fueron removidos
- **Consistencia**: Mantiene el estilo visual del resto del modal
- **Claridad**: Usa iconos y colores para distinguir fácilmente los estados

### Archivos afectados
- Solo `app/backoffice/citas/calendario/page.tsx`
- No requiere cambios en otros componentes
- No afecta la funcionalidad existente

## 📝 Notas

- El campo ya estaba disponible en los datos (usando `*` en la consulta)
- Se agregó explícitamente para mayor claridad en el código
- El modal ya manejaba todos los campos de la base de datos automáticamente
- No se requieren cambios en la base de datos 