// Rejects URLs like /api/parcels/abc with a 400 before they reach the database.
// A MongoDB ObjectId is exactly 24 hexadecimal characters.
import { ApiError } from '../utils/ApiError.js';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const validateObjectId = (req, _res, next) => {
  if (!OBJECT_ID.test(req.params.id)) {
    return next(
      ApiError.badRequest('Invalid parcel id', [
        { field: 'id', message: 'Parcel id must be a 24-character hexadecimal string' },
      ]),
    );
  }
  next();
};
