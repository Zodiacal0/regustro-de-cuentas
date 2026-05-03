const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

// --- Helpers de validación ---

function validarEntradaOGasto(payload, esGasto) {
    const nombre = esGasto ? 'Gasto' : 'Entrada';
    if (!payload.descripcion || typeof payload.descripcion !== 'string') {
        throw new Error(`${nombre}: descripcion debe ser texto no vacío`);
    }
    if (payload.descripcion.length > 200) {
        throw new Error(`${nombre}: descripcion no puede exceder 200 caracteres`);
    }
    if (typeof payload.monto !== 'number' || !isFinite(payload.monto) || payload.monto <= 0) {
        throw new Error(`${nombre}: monto debe ser un número positivo`);
    }
    if (!payload.fecha || isNaN(new Date(payload.fecha).getTime())) {
        throw new Error(`${nombre}: fecha inválida`);
    }
    if (!payload.categoria || typeof payload.categoria !== 'string') {
        throw new Error(`${nombre}: categoria requerida`);
    }
    if (esGasto && (!payload.metodo_pago || typeof payload.metodo_pago !== 'string')) {
        throw new Error(`Gasto: metodo_pago requerido`);
    }
}

// --- Motor determinístico de inserción ---

async function insertRecord(tipo_registro, payload) {
    const syncWarnings = [];

    try {
        const db = await getDb();
        let collectionName = '';

        if (tipo_registro === 'entradas') {
            validarEntradaOGasto(payload, false);
            collectionName = 'entradas';
        } else if (tipo_registro === 'gastos') {
            validarEntradaOGasto(payload, true);
            collectionName = 'gastos';
        } else if (tipo_registro === 'objetivo') {
            if (!payload.nombre || typeof payload.nombre !== 'string') {
                throw new Error("Objetivo: nombre requerido");
            }
            if (typeof payload.monto_objetivo !== 'number' || payload.monto_objetivo <= 0) {
                throw new Error("Objetivo: monto_objetivo debe ser un número mayor a 0");
            }
            if (typeof payload.monto_actual !== 'number' || payload.monto_actual < 0) {
                throw new Error("Objetivo: monto_actual debe ser un número no negativo");
            }
            collectionName = 'objetivos';
        } else if (tipo_registro === 'tarjeta') {
            if (!payload.nombre || !payload.tipo || typeof payload.saldo !== 'number') {
                throw new Error("Tarjeta: nombre, tipo y saldo (número) son obligatorios");
            }
            collectionName = 'tarjetas';
        } else if (tipo_registro === 'cuenta') {
            if (!payload.nombre || !payload.tipo || typeof payload.saldo !== 'number') {
                throw new Error("Cuenta: nombre, tipo y saldo (número) son obligatorios");
            }
            collectionName = 'cuentas';
        } else {
            throw new Error(`Tipo de registro desconocido: ${tipo_registro}`);
        }

        const collection = db.collection(collectionName);
        const result = await collection.insertOne(payload);

        // B.L.A.S.T Autocorrection: sincronización dinámica de saldos
        if (tipo_registro === 'entradas' || tipo_registro === 'gastos') {
            const isGasto = tipo_registro === 'gastos';

            // Tarjeta sync
            if (payload.tarjeta_id) {
                const tarjetaCollection = db.collection('tarjetas');
                try {
                    const miTarjeta = await tarjetaCollection.findOne({ _id: new ObjectId(payload.tarjeta_id) });
                    if (miTarjeta) {
                        let nuevoSaldo = miTarjeta.saldo;
                        // Crédito: saldo = deuda adeudada. Gasto aumenta deuda, entrada (pago) la reduce.
                        // Débito: saldo = fondos disponibles. Gasto los reduce, entrada los aumenta.
                        if (miTarjeta.tipo === 'Crédito') {
                            nuevoSaldo = isGasto ? nuevoSaldo + payload.monto : nuevoSaldo - payload.monto;
                        } else {
                            nuevoSaldo = isGasto ? nuevoSaldo - payload.monto : nuevoSaldo + payload.monto;
                        }
                        await tarjetaCollection.updateOne(
                            { _id: new ObjectId(payload.tarjeta_id) },
                            { $set: { saldo: nuevoSaldo } }
                        );
                    }
                } catch (error) {
                    console.error("Warning: Tarjeta balance sync failed:", error.message);
                    syncWarnings.push(`Sincronización de tarjeta fallida: ${error.message}`);
                }
            }

            // Cuenta sync
            if (payload.cuenta_id) {
                const cuentaCollection = db.collection('cuentas');
                try {
                    const miCuenta = await cuentaCollection.findOne({ _id: new ObjectId(payload.cuenta_id) });
                    if (miCuenta) {
                        let nuevoSaldo = miCuenta.saldo;
                        nuevoSaldo = isGasto ? nuevoSaldo - payload.monto : nuevoSaldo + payload.monto;
                        await cuentaCollection.updateOne(
                            { _id: new ObjectId(payload.cuenta_id) },
                            { $set: { saldo: nuevoSaldo } }
                        );
                    }
                } catch (error) {
                    console.error("Warning: Cuenta balance sync failed:", error.message);
                    syncWarnings.push(`Sincronización de cuenta fallida: ${error.message}`);
                }
            }
        }

        return {
            success: true,
            message: syncWarnings.length > 0
                ? "Registro guardado, pero hubo advertencias en la sincronización de saldos"
                : "Registro guardado exitosamente",
            data: { _id: result.insertedId, ...payload },
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

if (require.main === module) {
    (async () => {
        const r = await insertRecord('gastos', {
            descripcion: "Café matutino",
            monto: 45.0,
            fecha: new Date().toISOString(),
            categoria: "Alimentación",
            metodo_pago: "Efectivo"
        });
        console.log(JSON.stringify(r, null, 2));
    })();
}

module.exports = { insertRecord };
