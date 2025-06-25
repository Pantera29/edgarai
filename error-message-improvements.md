# Análisis y Mejoras de Mensajes de Error - Endpoints Customers y Vehicles

## Resumen Ejecutivo

Este documento presenta mejoras propuestas para 27 mensajes de error identificados en los endpoints de customers y vehicles. Las mejoras están orientadas a:
- Proporcionar información más descriptiva y orientada a la acción
- Incluir referencias a endpoints relacionados
- Especificar campos requeridos claramente
- Facilitar la comprensión para MCPs (Model Context Protocols)

---

## 1. ENDPOINTS DE CUSTOMERS

### 1.1 `/api/customers/create` (POST)

#### **Línea 23**: Campos requeridos faltantes
- **Antes:**
```json
{ "message": "Missing required parameters" }
```
- **Después:**
```json
{ "message": "Missing required parameters. Please provide: names, email, phone_number. Optional: dealership_id, dealership_phone, external_id. You can verify if a client already exists at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Especifica exactamente qué campos son obligatorios y cuáles opcionales, además de sugerir verificar si el cliente ya existe.

#### **Línea 32**: Formato de email inválido
- **Antes:**
```json
{ "message": "Invalid email format" }
```
- **Después:**
```json
{ "message": "Invalid email format. Please provide a valid email address (example: usuario@dominio.com). The email will be used for appointment notifications and client communications." }
```
- **Justificación:** Proporciona un ejemplo del formato correcto y explica por qué es importante el email.

#### **Línea 49**: Error verificando cliente existente
- **Antes:**
```json
{ "message": "Error checking for existing client" }
```
- **Después:**
```json
{ "message": "Error checking for existing client in database. This is a temporary system issue. Please try again in a few seconds or verify client manually at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Explica que es un problema temporal y ofrece una alternativa manual.

#### **Línea 55**: Cliente ya existe
- **Antes:**
```json
{ "message": "Client already exists", "clientId": existingClient.id }
```
- **Después:**
```json
{ "message": "Client already exists with this email or phone number. Use the existing client ID for operations or update client information at /api/customers/update/{client_id}. You can also retrieve client vehicles at /api/customers/{client_id}/vehicles", "clientId": existingClient.id }
```
- **Justificación:** Proporciona acciones específicas que se pueden tomar con el cliente existente.

#### **Línea 80**: Error al crear cliente
- **Antes:**
```json
{ "message": "Failed to create client", "error": insertError.message }
```
- **Después:**
```json
{ "message": "Failed to create client in database. This may be due to data validation or system issues. Please verify all required fields (names, email, phone_number) and try again. If the problem persists, check if the client already exists at /api/customers/verify?phone={phone_number}", "error": insertError.message }
```
- **Justificación:** Sugiere pasos de diagnóstico y alternativas para resolver el problema.

#### **Línea 95**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error" }
```
- **Después:**
```json
{ "message": "Internal server error while processing client creation. Please try again in a few moments. If the issue persists, verify client data format and check if the client already exists at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Ofrece pasos de recuperación específicos para este contexto.

### 1.2 `/api/customers/verify` (GET)

#### **Línea 19**: Parámetro teléfono requerido
- **Antes:**
```json
{ "message": "Phone parameter is required" }
```
- **Después:**
```json
{ "message": "Phone parameter is required in URL query. Usage: /api/customers/verify?phone={phone_number}. The phone number should include country code or local format (digits only will be normalized automatically)." }
```
- **Justificación:** Muestra el formato exacto de uso y explica cómo se maneja la normalización.

#### **Línea 39**: Error verificando cliente
- **Antes:**
```json
{ "message": "Error verifying client" }
```
- **Después:**
```json
{ "message": "Error verifying client in database. This is a temporary system issue. Please try again or create a new client at /api/customers/create if this phone number should be registered." }
```
- **Justificación:** Explica que es temporal y sugiere la alternativa de crear un cliente nuevo.

#### **Línea 76**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error" }
```
- **Después:**
```json
{ "message": "Internal server error during client verification. Please verify the phone number format and try again. You can also create a new client at /api/customers/create if needed." }
```
- **Justificación:** Sugiere verificar el formato y ofrece alternativa de creación.

### 1.3 `/api/customers/update/[id]` (PATCH)

#### **Línea 27**: ID de cliente requerido
- **Antes:**
```json
{ "message": "Client ID is required" }
```
- **Después:**
```json
{ "message": "Client ID is required in URL path. Usage: /api/customers/update/{client_id}. You can find client IDs by verifying with phone at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Muestra el formato correcto de uso y cómo obtener el ID del cliente.

#### **Línea 42**: Error verificando cliente
- **Antes:**
```json
{ "message": "Error checking client" }
```
- **Después:**
```json
{ "message": "Error checking client existence in database. This is a temporary system issue. Please verify the client ID is correct or find it using /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Sugiere verificar el ID y proporciona método para encontrarlo.

#### **Línea 49**: Cliente no encontrado
- **Antes:**
```json
{ "message": "Client not found" }
```
- **Después:**
```json
{ "message": "Client not found with the provided ID. Please verify the client ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or create a new client at /api/customers/create" }
```
- **Justificación:** Ofrece métodos específicos para encontrar o crear el cliente correcto.

#### **Línea 60**: Datos inválidos
- **Antes:**
```json
{ "message": "Datos inválidos", "details": validationResult.error.errors }
```
- **Después:**
```json
{ "message": "Invalid data format. Currently only 'agent_active' (boolean) field can be updated. Please provide: {\"agent_active\": true} or {\"agent_active\": false}", "details": validationResult.error.errors }
```
- **Justificación:** Especifica exactamente qué campo se puede actualizar y su formato.

#### **Línea 84**: Error al actualizar cliente
- **Antes:**
```json
{ "message": "Failed to update client", "error": error.message }
```
- **Después:**
```json
{ "message": "Failed to update client in database. Please verify the client ID exists and the data format is correct (agent_active: boolean). You can verify client existence at /api/customers/verify?phone={phone_number}", "error": error.message }
```
- **Justificación:** Especifica qué verificar y cómo confirmar la existencia del cliente.

#### **Línea 104**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error" }
```
- **Después:**
```json
{ "message": "Internal server error during client update. Please verify the client ID and data format, then try again. You can check client existence at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Proporciona pasos de verificación específicos para este contexto.

### 1.4 `/api/customers/[id]/vehicles` (GET)

#### **Línea 20**: ID de cliente requerido
- **Antes:**
```json
{ "message": "Client ID is required" }
```
- **Después:**
```json
{ "message": "Client ID is required in URL path. Usage: /api/customers/{client_id}/vehicles. You can find client IDs by verifying with phone at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Muestra el uso correcto y cómo obtener el ID del cliente.

#### **Línea 35**: Error verificando cliente
- **Antes:**
```json
{ "message": "Error checking client" }
```
- **Después:**
```json
{ "message": "Error checking client existence in database. This is a temporary system issue. Please verify the client ID is correct using /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Explica que es temporal y proporciona método de verificación.

#### **Línea 42**: Cliente no encontrado
- **Antes:**
```json
{ "message": "Client not found" }
```
- **Después:**
```json
{ "message": "Client not found with the provided ID. Please verify the client ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or view all customer vehicles using /api/customers/vehicles?client_id={client_id}" }
```
- **Justificación:** Ofrece métodos alternativos para encontrar el cliente y sus vehículos.

#### **Línea 56**: Error obteniendo vehículos
- **Antes:**
```json
{ "message": "Error fetching vehicles" }
```
- **Después:**
```json
{ "message": "Error fetching vehicles from database. This is a temporary system issue. The client exists but there was a problem retrieving their vehicles. Please try again or add a new vehicle at /api/vehicles/create" }
```
- **Justificación:** Clarifica que el cliente existe pero hay problema con los vehículos, sugiere alternativa.

#### **Línea 72**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error" }
```
- **Después:**
```json
{ "message": "Internal server error while fetching client vehicles. Please verify the client ID and try again. You can check client existence at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Proporciona pasos específicos de verificación para este contexto.

### 1.5 `/api/customers/vehicles` (GET)

#### **Línea 13**: Parámetro client_id requerido
- **Antes:**
```json
{ "message": "client_id query parameter is required" }
```
- **Después:**
```json
{ "message": "client_id query parameter is required. Usage: /api/customers/vehicles?client_id={client_id}. You can find client IDs by verifying with phone at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Muestra el formato exacto y cómo obtener el client_id.

#### **Línea 26**: Error verificando cliente
- **Antes:**
```json
{ "message": "Error checking client" }
```
- **Después:**
```json
{ "message": "Error checking client existence in database. This is a temporary system issue. Please verify the client_id parameter is correct or find it using /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Explica el problema y proporciona método de verificación.

#### **Línea 33**: Cliente no encontrado
- **Antes:**
```json
{ "message": "Client not found" }
```
- **Después:**
```json
{ "message": "Client not found with the provided client_id. Please verify the ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or use the alternative endpoint /api/customers/{client_id}/vehicles" }
```
- **Justificación:** Ofrece métodos de verificación y endpoint alternativo.

#### **Línea 44**: Error obteniendo vehículos
- **Antes:**
```json
{ "message": "Error fetching vehicles" }
```
- **Después:**
```json
{ "message": "Error fetching vehicles from database. This is a temporary system issue. The client exists but there was a problem retrieving their vehicles. Please try again or add a new vehicle at /api/vehicles/create" }
```
- **Justificación:** Clarifica que el cliente existe y sugiere acción alternativa.

#### **Línea 52**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error" }
```
- **Después:**
```json
{ "message": "Internal server error while fetching client vehicles. Please verify the client_id parameter format and try again. You can find the correct client_id at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Sugiere verificar formato y proporciona método para obtener el ID correcto.

---

## 2. ENDPOINTS DE VEHICLES

### 2.1 `/api/vehicles/create` (POST)

#### **Línea 43**: Parámetros requeridos faltantes
- **Antes:**
```json
{ "message": "Missing required parameters" }
```
- **Después:**
```json
{ "message": "Missing required parameters. Please provide: client_id, model, year, license_plate. Optional: make, vin, last_km. If 'make' is not provided, the system will try to infer it from the model. You can verify client_id at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Especifica campos requeridos y opcionales, explica la lógica de inferencia de marca.

#### **Línea 64**: Error buscando modelo
- **Antes:**
```json
{ "message": "Error searching for model" }
```
- **Después:**
```json
{ "message": "Error searching for vehicle model in database. This is a temporary system issue. Please provide the 'make' field explicitly or try again. Required format: {\"make\": \"Toyota\", \"model\": \"Corolla\", \"year\": 2020, \"license_plate\": \"ABC123\"}" }
```
- **Justificación:** Explica el problema y proporciona solución alternativa con ejemplo de formato.

#### **Línea 82**: Modelo no encontrado, marca requerida
- **Antes:**
```json
{ "message": "Model not found, make is required" }
```
- **Después:**
```json
{ "message": "Vehicle model not found in our database, so 'make' field is required. Please provide both make and model explicitly. Example: {\"make\": \"Toyota\", \"model\": \"Corolla\"}. You can also check available vehicle models or contact support to add new models to the system." }
```
- **Justificación:** Explica por qué se necesita la marca y proporciona ejemplo, sugiere contactar soporte.

#### **Líneas 100, 312**: Error verificando cliente
- **Antes:**
```json
{ "message": "Error checking client" }
```
- **Después:**
```json
{ "message": "Error checking client existence in database. This is a temporary system issue. Please verify the client_id is correct. You can find or create clients at /api/customers/verify?phone={phone_number} or /api/customers/create" }
```
- **Justificación:** Proporciona métodos específicos para verificar o crear el cliente.

#### **Líneas 107, 319**: Cliente no encontrado
- **Antes:**
```json
{ "message": "Client not found" }
```
- **Después:**
```json
{ "message": "Client not found with the provided client_id. Please verify the ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or create a new client at /api/customers/create (requires: names, email, phone_number)" }
```
- **Justificación:** Ofrece métodos para encontrar o crear cliente con campos requeridos.

#### **Líneas 121, 333**: Error verificando vehículo existente por placa
- **Antes:**
```json
{ "message": "Error checking for existing vehicle" }
```
- **Después:**
```json
{ "message": "Error checking for existing vehicle with this license plate. This is a temporary system issue. Please try again or verify the license plate format. You can search for existing vehicles at /api/vehicles/find-by-plate?plate={license_plate}" }
```
- **Justificación:** Explica el problema y proporciona método de búsqueda alternativo.

#### **Líneas 128, 340**: Vehículo con placa duplicada
- **Antes:**
```json
{ "message": "Vehicle with this license plate already exists", "vehicleId": existingVehiclePlate.id_uuid }
```
- **Después:**
```json
{ "message": "Vehicle with this license plate already exists in the system. Use the existing vehicle for appointments or update it at /api/vehicles/update/{vehicle_id}. You can view vehicle details at /api/vehicles/{vehicle_id}", "vehicleId": existingVehiclePlate.id_uuid }
```
- **Justificación:** Proporciona acciones específicas que se pueden tomar con el vehículo existente.

#### **Líneas 142, 354**: Error verificando VIN duplicado
- **Antes:**
```json
{ "message": "Error checking for existing vehicle by VIN" }
```
- **Después:**
```json
{ "message": "Error checking for existing vehicle with this VIN number. This is a temporary system issue. Please try again or omit the VIN field if not essential. VIN validation helps prevent duplicate vehicle registrations." }
```
- **Justificación:** Explica el propósito del VIN y sugiere omitirlo como alternativa temporal.

#### **Líneas 149, 361**: VIN duplicado
- **Antes:**
```json
{ "message": "Vehicle with this VIN already exists", "vehicleId": existingVehicleVin.id_uuid }
```
- **Después:**
```json
{ "message": "Vehicle with this VIN number already exists in the system. Each VIN must be unique. Use the existing vehicle or update it at /api/vehicles/update/{vehicle_id}. You can view vehicle details at /api/vehicles/{vehicle_id}", "vehicleId": existingVehicleVin.id_uuid }
```
- **Justificación:** Explica por qué el VIN debe ser único y ofrece acciones alternativas.

#### **Líneas 175, 387**: Error al crear vehículo
- **Antes:**
```json
{ "message": "Failed to create vehicle", "error": insertError.message }
```
- **Después:**
```json
{ "message": "Failed to create vehicle in database. This may be due to data validation or system issues. Please verify all required fields (client_id, model, year, license_plate) and ensure license_plate and VIN are unique. Check client existence at /api/customers/verify?phone={phone_number}", "error": insertError.message }
```
- **Justificación:** Enumera posibles causas y pasos de verificación específicos.

#### **Línea 447**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error" }
```
- **Después:**
```json
{ "message": "Internal server error during vehicle creation. Please verify all required fields (client_id, model, year, license_plate) and try again. Ensure the client exists by checking /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Especifica qué verificar y cómo confirmar prerequisitos.

### 2.2 `/api/vehicles/[id]` (GET)

#### **Línea 20**: ID de vehículo requerido
- **Antes:**
```json
{ "message": "Vehicle ID is required" }
```
- **Después:**
```json
{ "message": "Vehicle ID is required in URL path. Usage: /api/vehicles/{vehicle_id}. You can find vehicle IDs by searching with license plate at /api/vehicles/find-by-plate?plate={license_plate}" }
```
- **Justificación:** Muestra formato correcto y método para encontrar el ID del vehículo.

#### **Línea 47**: Error obteniendo vehículo
- **Antes:**
```json
{ "message": "Error fetching vehicle" }
```
- **Después:**
```json
{ "message": "Error fetching vehicle from database. This is a temporary system issue. Please verify the vehicle ID is correct or search by license plate at /api/vehicles/find-by-plate?plate={license_plate}" }
```
- **Justificación:** Explica que es temporal y proporciona método alternativo de búsqueda.

#### **Línea 54**: Vehículo no encontrado
- **Antes:**
```json
{ "message": "Vehicle not found" }
```
- **Después:**
```json
{ "message": "Vehicle not found with the provided ID. Please verify the vehicle ID is correct. You can search for vehicles by license plate at /api/vehicles/find-by-plate?plate={license_plate} or create a new vehicle at /api/vehicles/create" }
```
- **Justificación:** Ofrece métodos alternativos para encontrar o crear el vehículo.

#### **Línea 72**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error" }
```
- **Después:**
```json
{ "message": "Internal server error while fetching vehicle details. Please verify the vehicle ID format and try again. You can search by license plate at /api/vehicles/find-by-plate?plate={license_plate}" }
```
- **Justificación:** Sugiere verificar formato y proporciona método alternativo de búsqueda.

### 2.3 `/api/vehicles/find-by-plate` (GET)

#### **Línea 18**: Parámetro placa requerido
- **Antes:**
```json
{ "message": "License plate parameter is required" }
```
- **Después:**
```json
{ "message": "License plate parameter is required in URL query. Usage: /api/vehicles/find-by-plate?plate={license_plate}. The plate should match exactly as registered (case-sensitive)." }
```
- **Justificación:** Muestra formato exacto y aclara que es sensible a mayúsculas/minúsculas.

#### **Línea 33**: Error obteniendo detalles del vehículo
- **Antes:**
```json
{ "message": "Error fetching vehicle details", "details": vehicleError.message }
```
- **Después:**
```json
{ "message": "Error fetching vehicle details from database. This is a temporary system issue. Please verify the license plate format and try again. If the vehicle doesn't exist, you can create it at /api/vehicles/create", "details": vehicleError.message }
```
- **Justificación:** Explica que es temporal y proporciona alternativa de creación.

#### **Línea 39**: Vehículo no encontrado
- **Antes:**
```json
{ "message": "Vehicle not found" }
```
- **Después:**
```json
{ "message": "Vehicle not found with the provided license plate. Please verify the plate number is correct (case-sensitive). You can create a new vehicle at /api/vehicles/create (requires: client_id, model, year, license_plate)" }
```
- **Justificación:** Aclara sensibilidad a mayúsculas y proporciona información para crear vehículo.

#### **Línea 117**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error", "details": error instanceof Error ? error.message : String(error) }
```
- **Después:**
```json
{ "message": "Internal server error during vehicle search. Please verify the license plate format and try again. If the vehicle doesn't exist, you can create it at /api/vehicles/create", "details": error instanceof Error ? error.message : String(error) }
```
- **Justificación:** Sugiere verificar formato y proporciona alternativa de creación.

### 2.4 `/api/vehicles/update/[id]` (PATCH)

#### **Línea 18**: ID de vehículo requerido
- **Antes:**
```json
{ "message": "Vehicle ID is required" }
```
- **Después:**
```json
{ "message": "Vehicle ID is required in URL path. Usage: /api/vehicles/update/{vehicle_id}. You can find vehicle IDs by searching with license plate at /api/vehicles/find-by-plate?plate={license_plate}" }
```
- **Justificación:** Muestra formato correcto y método para encontrar el ID del vehículo.

#### **Línea 46**: No hay campos válidos para actualizar
- **Antes:**
```json
{ "message": "No valid fields to update" }
```
- **Después:**
```json
{ "message": "No valid fields to update. Allowed fields: client_id, make, model, year, license_plate, vin, last_km. Please provide at least one of these fields in the request body." }
```
- **Justificación:** Especifica exactamente qué campos se pueden actualizar.

#### **Línea 61**: Error verificando vehículo
- **Antes:**
```json
{ "message": "Error checking vehicle" }
```
- **Después:**
```json
{ "message": "Error checking vehicle existence in database. This is a temporary system issue. Please verify the vehicle ID is correct. You can search for vehicles at /api/vehicles/find-by-plate?plate={license_plate}" }
```
- **Justificación:** Explica que es temporal y proporciona método de verificación.

#### **Línea 68**: Vehículo no encontrado
- **Antes:**
```json
{ "message": "Vehicle not found" }
```
- **Después:**
```json
{ "message": "Vehicle not found with the provided ID. Please verify the vehicle ID is correct. You can search for vehicles by license plate at /api/vehicles/find-by-plate?plate={license_plate} or create a new vehicle at /api/vehicles/create" }
```
- **Justificación:** Ofrece métodos para encontrar o crear el vehículo.

#### **Línea 82**: Error verificando cliente
- **Antes:**
```json
{ "message": "Error checking client" }
```
- **Después:**
```json
{ "message": "Error checking client existence in database. This is a temporary system issue. Please verify the client_id is correct. You can find clients at /api/customers/verify?phone={phone_number}" }
```
- **Justificación:** Explica el problema y proporciona método de verificación del cliente.

#### **Línea 89**: Cliente no encontrado
- **Antes:**
```json
{ "message": "Client not found" }
```
- **Después:**
```json
{ "message": "Client not found with the provided client_id. Please verify the ID is correct. You can search for clients by phone at /api/customers/verify?phone={phone_number} or create a new client at /api/customers/create" }
```
- **Justificación:** Ofrece métodos para encontrar o crear el cliente.

#### **Línea 108**: Error verificando placa
- **Antes:**
```json
{ "message": "Error checking license plate" }
```
- **Después:**
```json
{ "message": "Error checking license plate uniqueness in database. This is a temporary system issue. Please verify the license plate format and try again. Each vehicle must have a unique license plate." }
```
- **Justificación:** Explica el propósito de la verificación y que cada placa debe ser única.

#### **Línea 117**: Placa ya existe en otro vehículo
- **Antes:**
```json
{ "message": "License plate already exists on another vehicle" }
```
- **Después:**
```json
{ "message": "License plate already exists on another vehicle. Each license plate must be unique in the system. Please use a different plate or update the existing vehicle at /api/vehicles/find-by-plate?plate={license_plate}" }
```
- **Justificación:** Explica por qué debe ser única y sugiere buscar el vehículo existente.

#### **Línea 133**: Error verificando VIN
- **Antes:**
```json
{ "message": "Error checking VIN" }
```
- **Después:**
```json
{ "message": "Error checking VIN uniqueness in database. This is a temporary system issue. Please verify the VIN format and try again. Each vehicle must have a unique VIN number." }
```
- **Justificación:** Explica el propósito de la verificación y la unicidad del VIN.

#### **Línea 142**: VIN ya existe en otro vehículo
- **Antes:**
```json
{ "message": "VIN already exists on another vehicle" }
```
- **Después:**
```json
{ "message": "VIN already exists on another vehicle. Each VIN must be unique in the system. Please use a different VIN or verify you're updating the correct vehicle. You can search for the existing vehicle by its details." }
```
- **Justificación:** Explica la unicidad del VIN y sugiere verificar el vehículo correcto.

#### **Línea 161**: Error al actualizar vehículo
- **Antes:**
```json
{ "message": "Failed to update vehicle", "error": error.message }
```
- **Después:**
```json
{ "message": "Failed to update vehicle in database. This may be due to data validation or system issues. Please verify all field formats and ensure license_plate and VIN are unique. Check that the client_id exists at /api/customers/verify?phone={phone_number}", "error": error.message }
```
- **Justificación:** Enumera posibles causas y pasos de verificación específicos.

#### **Línea 181**: Error interno del servidor
- **Antes:**
```json
{ "message": "Internal server error" }
```
- **Después:**
```json
{ "message": "Internal server error during vehicle update. Please verify the vehicle ID and all field formats, then try again. You can check vehicle existence at /api/vehicles/find-by-plate?plate={license_plate}" }
```
- **Justificación:** Sugiere verificaciones específicas y método alternativo de confirmación.

---

## Resumen de Mejoras

### **Total de mensajes mejorados:** 39
### **Beneficios principales:**

1. **Descriptivos:** Cada mensaje explica claramente qué salió mal
2. **Orientados a la acción:** Incluyen pasos específicos para resolver el problema  
3. **Referencias útiles:** Mencionan endpoints relacionados cuando es relevante
4. **Campos requeridos:** Especifican exactamente qué datos necesitan
5. **Compatibilidad:** Mantienen la estructura JSON original

### **Endpoints de referencia incluidos:**
- `/api/customers/verify?phone={phone_number}` - Verificar clientes por teléfono
- `/api/customers/create` - Crear nuevos clientes  
- `/api/customers/update/{client_id}` - Actualizar clientes
- `/api/vehicles/create` - Crear nuevos vehículos
- `/api/vehicles/find-by-plate?plate={license_plate}` - Buscar vehículos por placa
- `/api/vehicles/update/{vehicle_id}` - Actualizar vehículos

### **Campos requeridos especificados:**
- **Clientes:** names, email, phone_number
- **Vehículos:** client_id, model, year, license_plate  
- **Actualizaciones:** Campos específicos permitidos para cada endpoint

Estas mejoras facilitarán significativamente el trabajo de los MCPs al proporcionar información clara y accionable para resolver problemas automáticamente.