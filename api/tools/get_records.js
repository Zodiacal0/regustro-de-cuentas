const { getDb } = require('../db');

/**
 * Función Determinística (Layer 3)
 * Operación: Extraer todos los registros para hidratar el Dashboard.
 */
async function getAllRecords(uid) {
    try {
        const db = await getDb();
        const filter = { uid };

        const [entradas, gastos, objetivos, tarjetas, cuentas, deudas] = await Promise.all([
            db.collection('entradas').find(filter).sort({ fecha: -1 }).toArray(),
            db.collection('gastos').find(filter).sort({ fecha: -1 }).toArray(),
            db.collection('objetivos').find(filter).toArray(),
            db.collection('tarjetas').find(filter).toArray(),
            db.collection('cuentas').find(filter).toArray(),
            db.collection('deudas').find(filter).toArray()
        ]);

        return {
            success: true,
            data: { entradas, gastos, objetivos, tarjetas, cuentas, deudas }
        };

    } catch (error) {
        return {
            success: false,
            message: `DB Fetch Error: ${error.message}`,
            data: null
        };
    }
}

module.exports = { getAllRecords };
