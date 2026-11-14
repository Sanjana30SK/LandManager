// Loads environment variables from server/.env and exposes them in one place.
// Every other file imports settings from here instead of reading process.env directly.
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve server/.env relative to this file, so scripts work from any folder.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const uri = process.env.MONGODB_URI;

// Any "<something>" left in the string means a placeholder (e.g. Atlas's <db_password>) wasn't replaced.
if (!uri || /<[^>]+>/.test(uri)) {
  console.error(
    '\n[config] MONGODB_URI is missing or still has the placeholder values.\n' +
      '         Copy server/.env.example to server/.env and paste your MongoDB Atlas connection string.\n',
  );
  process.exit(1);
}

export const env = {
  mongoUri: uri,
  mongoDbName: process.env.MONGODB_DB_NAME || 'land_parcel_manager',
  port: Number(process.env.PORT) || 5000,
  // The frontend address allowed to call the API (Vite's dev server by default).
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
