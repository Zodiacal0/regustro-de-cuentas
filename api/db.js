require('dotenv').config();
const { MongoClient } = require('mongodb');

let cachedClient = null;

async function getDb() {
    if (cachedClient?.topology?.isConnected()) {
        return cachedClient.db();
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error("MONGO_URI no configurado en las variables de entorno");
    }

    cachedClient = new MongoClient(uri, { maxPoolSize: 10 });
    await cachedClient.connect();
    return cachedClient.db();
}

module.exports = { getDb };
