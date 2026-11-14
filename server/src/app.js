import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandlers.js';
import { env } from './config/env.js';

export const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start} ms`));
  next();
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);
