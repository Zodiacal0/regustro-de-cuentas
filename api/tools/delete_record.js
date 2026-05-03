const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

const COLLECTION_MAP = {
    objetivo: 'objetivos',
    cuenta:   'cuentas',
    tarjeta:  'tarjetas',
    entrada:  'entradas',
    gasto:    'gastos',
    deuda:    'deudas'
};

// Motor Determinístico de Eliminación (Layer 3)
async function deleteRecord(tipo_registro, id) {
    if (!ObjectId.isValid(id)) {
        return { success: false, message: "ID de registro inválido", data: null };
    }

    const collectionName = COLLECTION_MAP[tipo_registro];
    if (!collectionName) {
        return { success: false, message: `Tipo de registro desconocido: ${tipo_registro}`, data: null };
    }

    const syncWarnings = [];

    try {
        const db = await getDb();
        const collection = db.collection(collectionName);

        // Para entradas/gastos: revertir saldos antes de eliminar
        if (tipo_registro === 'entrada' || tipo_registro === 'gasto') {
            const existing = await collection.findOne({ _id: new ObjectId(id) });

            if (!existing) {
                return { success: false, message: "No se encontró el registro con el ID especificado.", data: null };
            }

            const isGasto = tipo_registro === 'gasto';

            // Revertir tarjeta (lógica inversa al insert)
            if (existing.tarjeta_id) {
                try {
                    const tarjetaCollection = db.collection('tarjetas');
                    const miTarjeta = await tarjetaCollection.findOne({ _id: new ObjectId(existing.tarjeta_id) });
                    if (miTarjeta) {
                        let nuevoSaldo = miTarjeta.saldo;
                        // Invertir: si era gasto que aumentó deuda crédito, al borrar la reduce
                        if (miTarjeta.tipo === 'Crédito') {
                            nuevoSaldo = isGasto ? nuevoSaldo - existing.monto : nuevoSaldo + existing.monto;
                        } else {
                            nuevoSaldo = isGasto ? nuevoSaldo + existing.monto : nuevoSaldo - existing.monto;
                        }
                        await tarjetaCollection.updateOne(
                            { _id: new ObjectId(existing.tarjeta_id) },
                            { $set: { saldo: nuevoSaldo } }
                        );
                    }
                } catch (syncErr) {
                    console.error("Warning: Tarjeta reversal sync failed:", syncErr.message);
                    syncWarnings.push(`Reversión de tarjeta fallida: ${syncErr.message}`);
                }
            }

            // Revertir cuenta
            if (existing.cuenta_id) {
                try {
                    const cuentaCollection = db.collection('cuentas');
                    const miCuenta = await cuentaCollection.findOne({ _id: new ObjectId(existing.cuenta_id) });
                    if (miCuenta) {
                        const nuevoSaldo = isGasto
                            ? miCuenta.saldo + existing.monto
                            : miCuenta.saldo - existing.monto;
                        await cuentaCollection.updateOne(
                            { _id: new ObjectId(existing.cuenta_id) },
                            { $set: { saldo: nuevoSaldo } }
                        );
                    }
                } catch (syncErr) {
                    console.error("Warning: Cuenta reversal sync failed:", syncErr.message);
                    syncWarnings.push(`Reversión de cuenta fallida: ${syncErr.message}`);
                }
            }
        }

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return { success: false, message: "No se encontró el registro con el ID especificado.", data: null };
        }

        return {
            success: true,
            message: syncWarnings.length > 0
                ? "Registro eliminado, pero hubo advertencias al revertir saldos"
                : "Registro eliminado exitosamente",
            data: { _id: id },
            syncWarnings
        };

    } catch (error) {
        return {
            success: false,
            message: error.message,
            data: null,
            syncWarnings
        };
    }
}

module.exports = { deleteRecord };
