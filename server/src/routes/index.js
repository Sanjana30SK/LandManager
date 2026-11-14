import { Router } from 'express';
import mongoose from 'mongoose';
import parcelRoutes from './parcel.routes.js';
import { STATUSES, LAND_USES, DEFAULT_STATUS, LIMITS } from '../constants/parcel.js';

const router = Router();

router.get('/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({ status: dbConnected ? 'ok' : 'degraded', database: dbConnected ? 'connected' : 'disconnected' });
});

router.get('/meta', (_req, res) => {
  res.json({ data: { statuses: STATUSES, landUses: LAND_USES, defaultStatus: DEFAULT_STATUS, limits: LIMITS } });
});

router.use('/parcels', parcelRoutes);

export default router;
