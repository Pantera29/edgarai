# docs/api-services-specific-by-model.md

## Endpoint Details

**GET** `/api/services/specific-by-model`

Devuelve todos los servicios específicos (specific_services) activos para un modelo de vehículo y agencia determinados.

### Parámetros (query string)
- `model_id` (**string**, obligatorio): ID del modelo de vehículo.
- `dealership_id` (**string**, obligatorio): ID de la agencia (dealership).

### Ejemplo de Request
```http
GET /api/services/specific-by-model?model_id=123&dealership_id=456
```

### Ejemplo de Response (200 OK)
```json
{
  "specific_services": [
    {
      "id": "789",
      "service_name": "Cambio de aceite 10,000km",
      "price": 1200,
      "kilometers": 10000,
      "months": 12,
      "additional_description": "Incluye filtro premium",
      "service_id": "abc123"
    },
    {
      "id": "790",
      "service_name": "Ajuste de frenos",
      "price": 900,
      "kilometers": 20000,
      "months": 24,
      "additional_description": null,
      "service_id": "def456"
    }
  ]
}
```

### Respuestas de Error
- **400 Bad Request**: Faltan parámetros requeridos
  ```json
  { "error": "Faltan parámetros requeridos: model_id y dealership_id son obligatorios." }
  ```
- **500 Internal Server Error**: Error inesperado en el servidor
  ```json
  { "error": "Error al consultar servicios específicos." }
  ```

## Authentication Requirements
- Requiere autenticación por token JWT (mismo patrón que otros endpoints internos).

## Error Handling
- Todos los errores se devuelven en formato JSON con un campo `error` descriptivo.
- Los logs del endpoint están en español y usan emojis para facilitar debugging en consola. 