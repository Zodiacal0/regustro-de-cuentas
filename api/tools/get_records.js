const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' }); // en caso de ser ejecutado independiente

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/registro-contable";

/**
 * Función Determinística (Layer 3)
 * Operación: Extraer todos los registros para hidratar el Dashboard.
 */
async function getAllRecords() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db();

        // Extraer paralelamente de todas las colecciones principales
        const [entradas, gastos, objetivos, tarjetas, cuentas] = await Promise.all([
            db.collection('entradas').find().sort({ fecha: -1 }).toArray(),
            db.collection('gastos').find().sort({ fecha: -1 }).toArray(),
            db.collection('objetivos').find().toArray(),
            db.collection('tarjetas').find().toArray(),
            db.collection('cuentas').find().toArray()
        ]);

        return {
            success: true,
            data: {
                entradas,
                gastos,
                objetivos,
                tarjetas,
                cuentas
            }
        };

    } catch (error) {
        return {
            success: false,
            message: `DB Fetch Error: ${error.message}`
        };
    } finally {
        await client.close();
    }
}

module.exports = { getAllRecords };
