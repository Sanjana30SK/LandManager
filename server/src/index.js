// Entry point: connect to the database first, then start listening for requests.
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  try {
    await connectDB();
  } catch {
    process.exit(1); // db.js has already printed the reason and how to fix it
  }

  const server = app.listen(env.port, () => {
    console.log(`[server] API running at http://localhost:${env.port}/api`);
  });

  // Close cleanly on Ctrl+C or when a host (e.g. Docker) stops the process.
  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
