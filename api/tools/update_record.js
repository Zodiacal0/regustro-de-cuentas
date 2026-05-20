const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

const ALLOWED_FIELDS = {
    objetivo:     ['nombre', 'monto_actual', 'monto_objetivo'],
    cuenta:       ['nombre', 'tipo', 'saldo'],
    tarjeta:      ['nombre', 'tipo', 'saldo', 'fecha_corte'],
    entrada:      ['descripcion', 'monto', 'fecha', 'categoria', 'cuenta_id', 'tarjeta_id'],
    gasto:        ['descripcion', 'monto', 'fecha', 'categoria', 'metodo_pago', 'cuenta_id', 'tarjeta_id'],
    deuda:        ['nombre', 'acreedor', 'monto_total', 'monto_pagado', 'notas', 'fecha_vencimiento'],
    presupuesto:  ['nombre', 'categoria', 'monto_limite', 'periodo', 'color', 'rollover', 'fecha_inicio', 'fecha_fin'],
    ingreso_base: ['monto', 'periodo', 'fecha_inicio', 'fecha_fin']
};

const COLLECTION_MAP = {
    objetivo:    'objetivos',
    cuenta:      'cuentas',
    tarjeta:     'tarjetas',
    entrada:     'entradas',
    gasto:       'gastos',
    deuda:       'deudas',
    presupuesto:  'presupuestos',
    ingreso_base: 'presupuestos'
};

// Motor Determinístico de Actualización (Layer 3)
async function updateRecord(tipo_registro, id, payload, uid) {
    if (!ObjectId.isValid(id)) {
        return { success: false, message: "ID de registro inválido", data: null };
    }

    const collectionName = COLLECTION_MAP[tipo_registro];
    if (!collectionName) {
        return { success: false, message: `Tipo de registro desconocido: ${tipo_registro}`, data: null };
    }

    // Filtrar solo los campos permitidos para este tipo
    const allowed = ALLOWED_FIELDS[tipo_registro] || [];
    const sanitizedPayload = Object.fromEntries(
        Object.entries(payload).filter(([k]) => allowed.includes(k))
    );

    if (Object.keys(sanitizedPayload).length === 0) {
        return { success: false, message: "No se enviaron campos válidos para actualizar", data: null };
    }

    try {
        const db = await getDb();
        const collection = db.collection(collectionName);

        // Para deudas: recalcular porcentaje_pagado
        if (tipo_registro === 'deuda') {
            const existing = await collection.findOne({ _id: new ObjectId(id), uid });
            if (!existing) {
                return { success: false, message: "No se encontró el registro con el ID especificado.", data: null };
            }
            const newMontoPagado = sanitizedPayload.monto_pagado ?? existing.monto_pagado;
            const newMontoTotal = sanitizedPayload.monto_total ?? existing.monto_total;
            if (newMontoTotal <= 0) {
                return { success: false, message: "monto_total debe ser mayor a 0", data: null };
            }
            sanitizedPayload.porcentaje_pagado = Number(
                (Math.min(newMontoPagado / newMontoTotal, 1) * 100).toFixed(2)
            );
        }

        // Para objetivos: recalcular porcentaje siempre, incluso con update parcial
        if (tipo_registro === 'objetivo') {
            const existing = await collection.findOne({ _id: new ObjectId(id), uid });
            if (!existing) {
                return { success: false, message: "No se encontró el registro con el ID especificado.", data: null };
            }
            const newMontoActual = sanitizedPayload.monto_actual ?? existing.monto_actual;
            const newMontoObjetivo = sanitizedPayload.monto_objetivo ?? existing.monto_objetivo;
            if (newMontoObjetivo <= 0) {
                return { success: false, message: "monto_objetivo debe ser mayor a 0", data: null };
            }
            sanitizedPayload.porcentaje_completado = Number(
                ((newMontoActual / newMontoObjetivo) * 100).toFixed(2)
            );
        }

        // Para entradas/gastos: sincronizar delta de saldo si cambió el monto
        if ((tipo_registro === 'entrada' || tipo_registro === 'gasto') && sanitizedPayload.monto !== undefined) {
            const existing = await collection.findOne({ _id: new ObjectId(id), uid });
            if (existing && typeof existing.monto === 'number') {
                const delta = sanitizedPayload.monto - existing.monto;
                const isGasto = tipo_registro === 'gasto';

                if (delta !== 0) {
                    if (existing.tarjeta_id) {
                        try {
                            const tarjetaCollection = db.collection('tarjetas');
                            const miTarjeta = await tarjetaCollection.findOne({ _id: new ObjectId(existing.tarjeta_id) });
                            if (miTarjeta) {
                                let nuevoSaldo = miTarjeta.saldo;
                                // Crédito: deuda aumenta con gastos. Delta positivo en gasto = más deuda.
                                if (miTarjeta.tipo === 'Crédito') {
                                    nuevoSaldo = isGasto ? nuevoSaldo + delta : nuevoSaldo - delta;
                                } else {
                                    nuevoSaldo = isGasto ? nuevoSaldo - delta : nuevoSaldo + delta;
                                }
                                await tarjetaCollection.updateOne(
                                    { _id: new ObjectId(existing.tarjeta_id) },
                                    { $set: { saldo: nuevoSaldo } }
                                );
                            }
                        } catch (syncErr) {
                            console.error("Warning: Tarjeta delta sync failed:", syncErr.message);
                        }
                    }

                    if (existing.cuenta_id) {
                        try {
                            const cuentaCollection = db.collection('cuentas');
                            const miCuenta = await cuentaCollection.findOne({ _id: new ObjectId(existing.cuenta_id) });
                            if (miCuenta) {
                                const nuevoSaldo = isGasto
                                    ? miCuenta.saldo - delta
                                    : miCuenta.saldo + delta;
                                await cuentaCollection.updateOne(
                                    { _id: new ObjectId(existing.cuenta_id) },
                                    { $set: { saldo: nuevoSaldo } }
                                );
                            }
                        } catch (syncErr) {
                            console.error("Warning: Cuenta delta sync failed:", syncErr.message);
                        }
                    }
                }
            }
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id), uid },
            { $set: sanitizedPayload }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "No se encontró el registro con el ID especificado.", data: null };
        }

        return {
            success: true,
            message: "Registro actualizado exitosamente",
            data: { _id: id, ...sanitizedPayload }
        };

    } catch (error) {
        return {
            success: false,
            message: error.message,
            data: null
        };
    }
}

module.exports = { updateRecord };
