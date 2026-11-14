import mongoose from 'mongoose';
import { env } from './env.js';

function explain(error) {
  const msg = error.message || '';
  if (/bad auth|authentication failed/i.test(msg)) {
    return 'Wrong username or password in MONGODB_URI. Check the database user in Atlas > Database Access.';
  }
  if (/whitelist|IP address|ReplicaSetNoPrimary|Server selection timed out/i.test(msg)) {
    return 'Could not reach the cluster. In Atlas > Network Access, add your current IP address (or 0.0.0.0/0 for development).';
  }
  if (/ENOTFOUND|querySrv/i.test(msg)) {
    return 'The cluster host name in MONGODB_URI could not be found. Copy the connection string from Atlas again.';
  }
  return msg;
}

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      dbName: env.mongoDbName,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] Connected to MongoDB: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[db] Connection failed: ${explain(error)}`);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  console.log('[db] Disconnected');
}
