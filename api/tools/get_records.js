const { getDb } = require('../db');

/**
 * Función Determinística (Layer 3)
 * Operación: Extraer todos los registros para hidratar el Dashboard.
 */
async function getAllRecords() {
    try {
        const db = await getDb();

        const [entradas, gastos, objetivos, tarjetas, cuentas, deudas] = await Promise.all([
            db.collection('entradas').find().sort({ fecha: -1 }).toArray(),
            db.collection('gastos').find().sort({ fecha: -1 }).toArray(),
            db.collection('objetivos').find().toArray(),
            db.collection('tarjetas').find().toArray(),
            db.collection('cuentas').find().toArray(),
            db.collection('deudas').find().toArray()
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
