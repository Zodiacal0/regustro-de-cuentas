require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// Motor Determinístico de Actualización (Layer 3)
async function updateRecord(tipo_registro, id, payload) {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    return { success: false, message: "MONGO_URI no configurado", data: null };
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // Las colecciones B.L.A.S.T mapeadas
    const validCollections = {
        'objetivo': 'objetivos',
        'cuenta': 'cuentas',
        'tarjeta': 'tarjetas',
        'entrada': 'entradas',
        'gasto': 'gastos'
    };

    const collectionName = validCollections[tipo_registro];
    if (!collectionName) {
        throw new Error(`Tipo de registro desconocido o no soportado para actualizar: ${tipo_registro}`);
    }

    const collection = db.collection(collectionName);
    
    // Ejecuta el PUT/PATCH ignorando el _id en el payload (si existe)
    if (payload._id) {
        delete payload._id;
    }

    // Calcula de nuevo el porcentaje en caso de que sea un Objetivo
    if (tipo_registro === 'objetivo' && payload.monto_actual !== undefined && payload.monto_objetivo !== undefined) {
        payload.porcentaje_completado = Number(((Number(payload.monto_actual) / Number(payload.monto_objetivo)) * 100).toFixed(2));
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: payload }
    );

    if (result.matchedCount === 0) {
        throw new Error("No se encontró el registro con el ID especificado.");
    }

    return {
      success: true,
      message: "Registro actualizado exitosamente",
      data: { _id: id, ...payload }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  } finally {
    await client.close();
  }
}

module.exports = { updateRecord };
