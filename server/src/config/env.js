import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const uri = process.env.MONGODB_URI;

// Also catches a connection string still containing placeholders like <db_password>.
if (!uri || /<[^>]+>/.test(uri)) {
  console.error(
    '\n[config] MONGODB_URI is missing or still has the placeholder values.\n' +
      '         Create server/.env with your MongoDB Atlas connection string (see README > Setup).\n',
  );
  process.exit(1);
}

export const env = {
  mongoUri: uri,
  mongoDbName: process.env.MONGODB_DB_NAME || 'land_parcel_manager',
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
