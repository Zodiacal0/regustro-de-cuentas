require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Error: MONGO_URI not found in environment variables");
    process.exit(1);
  }

  console.log(`Connecting to: ${uri}`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });

  try {
    await client.connect();
    // Ping to verify
    await client.db('admin').command({ ping: 1 });
    console.log("CONNECTION SUCCESS: Connected to MongoDB successfully.");
  } catch (err) {
    console.error("CONNECTION FAILED:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
