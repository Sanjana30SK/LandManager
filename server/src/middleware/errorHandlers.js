// The last two middleware in the chain.
// notFound: any request that matched no route.
// errorHandler: every error thrown anywhere ends up here and leaves in ONE consistent format:
//   { "error": { "message": "...", "details": [ { "field": "...", "message": "..." } ] } }
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Express recognises an error handler by its 4 parameters, so `_next` must stay.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let status = 500;
  let message = 'Something went wrong on the server';
  let details = [];

  if (err instanceof ApiError) {
    ({ status, message, details } = err);
  } else if (err.type === 'entity.parse.failed') {
    // Body sent by the client is not valid JSON.
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err instanceof mongoose.Error.ValidationError) {
    // Safety net: the Mongoose schema caught something Zod did not.
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  }

  // Log unexpected errors in full, but never send internals to the client.
  if (status >= 500) console.error(`[error] ${req.method} ${req.originalUrl}`, err);

  res.status(status).json({ error: { message, details } });
};
