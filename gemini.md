# Project Constitution

## Data Schemas
(Confirmed during Discovery Phase)

**1. Esquema de Entradas (Ingresos) - Payload POST:**
```json
{
  "descripcion": "String (Ej. Pago de quincena)",
  "monto": "Number (Ej. 1500.00)",
  "fecha": "Date (ISO 8601, Ej. 2026-04-16T12:00:00Z)",
  "categoria": "String (Ej. Salario, Negocio, Regalo)"
}
```

**2. Esquema de Gastos - Payload POST:**
```json
{
  "descripcion": "String (Ej. Compra de supermercado)",
  "monto": "Number (Ej. 350.50)",
  "fecha": "Date (ISO 8601, Ej. 2026-04-16T15:30:00Z)",
  "categoria": "String (Ej. Alimentación, Transporte, Servicios)",
  "metodo_pago": "String (Ej. Efectivo, Tarjeta, Transferencia)"
}
```

**3. Esquema de Objetivos (Goals) - Payload POST:**
```json
{
  "nombre": "String (Ej. Viaje a Japón)",
  "monto_objetivo": "Number (Ej. 5000.00)",
  "monto_actual": "Number (Ej. 1250.00)",
  "porcentaje_completado": "Number (Ej. 25.0)"
}
```

**4. Esquema de Tarjetas (Cards) - Payload POST:**
```json
{
  "nombre": "String (Ej. Nu, Banamex)",
  "tipo": "String (Débito | Crédito)",
  "saldo": "Number (Débito: saldo disponible, Crédito: saldo adeudado)",
  "fecha_corte": "Number (Día del mes, Ej. 15) [Solo Crédito]"
}
```

**5. Output Schema (Respuesta API):**
```json
{
  "success": "Boolean",
  "message": "String",
  "data": { "Objeto creado" }
}
```

## Behavioral Rules
- System Pilot operates strictly under the B.L.A.S.T. protocol.
- Logic changes must first update architecture/.md SOPs.
- No code written in tools/ without approved Blueprint and Schema.
- Data-first approach must be respected.

## Architectural Invariants
- 3-Layer Architecture (1: Architecture/SOPs, 2: Navigation, 3: Tools/Scripts).
- Tools are deterministic, atomic, and testable.
- .env contains secrets.
- .tmp is for intermediate operations.

## Maintenance Log (Fase 5)
- **Deployment Status**: Local (Express API + Vite React UI).
- **Triggers**: Express listener en el puerto 3000 para procesar POST payloads en `/api/records` directamente a MongoDB (Layer 3 Tools).
- **Acciones Futuras para Producción Cloud**: 
  - Hostear Frontend en Vercel/Netlify.
  - Desplegar API server en Heroku/Render.
  - Actualizar `MONGO_URI` local a la instancia final de MongoDB Atlas.
