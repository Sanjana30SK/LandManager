import { Router } from 'express';
import {
  listParcels,
  getParcel,
  createParcel,
  updateParcel,
  deleteParcel,
} from '../controllers/parcel.controller.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { parcelBodySchema, listQuerySchema } from '../validators/parcel.validator.js';

const router = Router();

router.get('/', validate({ query: listQuerySchema }), listParcels);
router.post('/', validate({ body: parcelBodySchema }), createParcel);
router.get('/:id', validateObjectId, getParcel);
router.put('/:id', validateObjectId, validate({ body: parcelBodySchema }), updateParcel);
router.delete('/:id', validateObjectId, deleteParcel);

export default router;
