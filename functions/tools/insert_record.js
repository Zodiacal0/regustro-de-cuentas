require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// Deterministic insert engine
async function insertRecord(tipo_registro, payload) {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    return { success: false, message: "MONGO_URI no configurado", data: null };
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(); // Usa la bd de la URI (registro-contable)

    let collectionName = '';

    // Basic structural validation mapped from gemini.md
    if (tipo_registro === 'entradas') {
      if (!payload.descripcion || !payload.monto || !payload.fecha || !payload.categoria) {
        throw new Error("Faltan campos obligatorios para Entrada");
      }
      collectionName = 'entradas';
    }
    else if (tipo_registro === 'gastos') {
      if (!payload.descripcion || !payload.monto || !payload.fecha || !payload.categoria || !payload.metodo_pago) {
        throw new Error("Faltan campos obligatorios para Gasto");
      }
      collectionName = 'gastos';
    }
    else if (tipo_registro === 'objetivo') {
      if (!payload.nombre || payload.monto_objetivo == null || payload.monto_actual == null) {
        throw new Error("Faltan campos obligatorios para Objetivo");
      }
      collectionName = 'objetivos';
    }
    else if (tipo_registro === 'tarjeta') {
      if (!payload.nombre || !payload.tipo || payload.saldo == null) {
        throw new Error("Faltan campos obligatorios para Tarjeta");
      }
      collectionName = 'tarjetas';
    }
    else if (tipo_registro === 'cuenta') {
      if (!payload.nombre || !payload.tipo || payload.saldo == null) {
        throw new Error("Faltan campos obligatorios para Cuenta");
      }
      collectionName = 'cuentas';
    }
    else {
      throw new Error(`Tipo de registro desconocido: ${tipo_registro}`);
    }

    const collection = db.collection(collectionName);
    const result = await collection.insertOne(payload);

    // B.L.A.S.T Autocorrection: Dynamic Balance Synchronization for Cards and Accounts
    if (tipo_registro === 'entradas' || tipo_registro === 'gastos') {
        const isGasto = (tipo_registro === 'gastos');

        // Tarjetas Sync
        if (payload.tarjeta_id) {
            const tarjetaCollection = db.collection('tarjetas');
            try {
                const miTarjeta = await tarjetaCollection.findOne({ _id: new ObjectId(payload.tarjeta_id) });
                if (miTarjeta) {
                    let nuevoSaldo = miTarjeta.saldo;
                    if (miTarjeta.tipo === 'Crédito') {
                        nuevoSaldo = isGasto ? nuevoSaldo + payload.monto : nuevoSaldo - payload.monto;
                    } else {
                        nuevoSaldo = isGasto ? nuevoSaldo - payload.monto : nuevoSaldo + payload.monto;
                    }
                    await tarjetaCollection.updateOne({ _id: new ObjectId(payload.tarjeta_id) }, { $set: { saldo: nuevoSaldo } });
                }
            } catch (error) {
                console.error("Warning: Tarjeta balance sync failed:", error);
            }
        }
        
        // Cuentas Sync
        if (payload.cuenta_id) {
            const cuentaCollection = db.collection('cuentas');
            try {
                const miCuenta = await cuentaCollection.findOne({ _id: new ObjectId(payload.cuenta_id) });
                if (miCuenta) {
                    let nuevoSaldo = miCuenta.saldo;
                    nuevoSaldo = isGasto ? nuevoSaldo - payload.monto : nuevoSaldo + payload.monto;
                    await cuentaCollection.updateOne({ _id: new ObjectId(payload.cuenta_id) }, { $set: { saldo: nuevoSaldo } });
                }
            } catch (error) {
                console.error("Warning: Cuenta balance sync failed:", error);
            }
        }
    }

    return {
      success: true,
      message: "Registro guardado exitosamente",
      data: { _id: result.insertedId, ...payload }
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

// Para hacer la herramienta interactiva si se ejecuta directamente desde consola
if (require.main === module) {
  (async () => {
    // Ejemplo de gasto por defecto
    const r = await insertRecord('gasto', {
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
