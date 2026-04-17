# Findings

## Research
- TBD

## Discoveries
- **North Star:** App para registro manual de entradas y gastos personales diarios.
- **Integrations:** MongoDB local (`mongodb://localhost:27017/registro-contable`) y conectividad posterior/fuente de verdad.
- **Source of Truth:** Base de datos en MongoDB Atlas.
- **Delivery Payload:** Inserción de datos vía métodos POST.
- **Behavioral Rules:** Operación manual, sin validaciones restrictivas complejas (salvo tipos de dato).

## Constraints
- Se requiere flexibilidad al ser alimentado de forma manual.
