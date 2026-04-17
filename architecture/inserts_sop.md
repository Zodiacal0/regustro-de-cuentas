# SOP: Inserción de Registros (Entradas, Gastos, Objetivos)

## 1. Meta
Proveer un proceso determinístico para tomar un payload estructurado, validarlo y guardarlo en la base de datos de MongoDB.

## 2. Entradas Esperadas
Cualquiera de los 3 esquemas JSON definidos en `gemini.md`:
- `Entrada`: descripcion, monto, fecha, categoria.
- `Gasto`: descripcion, monto, fecha, categoria, metodo_pago.
- `Objetivo`: nombre, monto_objetivo, monto_actual, porcentaje_completado.

## 3. Lógica del Proceso (Engine)
1. Cargar variables de entorno desde `.env`.
2. Establecer conexión con la DB (`registro-contable`).
3. Recibir el Payload y el `tipo_registro` (entrada | gasto | objetivo).
4. Validar que los campos obligatorios correspondientes existan.
5. Seleccionar la colección correspondiente en DB.
6. Insertar el documento.
7. Retornar el `Output Schema` (éxito, mensaje, y data con el `_id` creado).
8. Cerrar sistemáticamente la conexión.

## 4. Edge Cases a Manejar
- Falta de un campo obligatorio o valor nulo -> abortar y devolver éxito=false.
- Error de conexión a la base de datos -> abortar, loguear error, devolver éxito=false.
