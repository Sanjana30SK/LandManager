// Builds the Express application: global middleware -> routes -> 404 -> error handler.
// Kept separate from index.js (which starts the server) so the app can be tested on its own.
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandlers.js';
import { env } from './config/env.js';

export const app = express();

app.use(cors({ origin: env.clientOrigin })); // allow the React dev server to call the API
app.use(express.json({ limit: '100kb' })); // parse JSON bodies; reject very large ones

// Small request log: "GET /api/parcels 200 - 12 ms"
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start} ms`));
  next();
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);
