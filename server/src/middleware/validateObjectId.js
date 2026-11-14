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
