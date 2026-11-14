// Zod schemas describing what a valid request looks like.
// These run BEFORE the database is touched and produce one clear message per field.
import { z } from 'zod';
import { STATUSES, LAND_USES, DEFAULT_STATUS, LIMITS } from '../constants/parcel.js';

// Gives "X is required" when a field is missing and "X must be ..." when it has the wrong type.
const required = (label, kind) => ({
  error: (issue) => (issue.input === undefined || issue.input === null ? `${label} is required` : `${label} must be ${kind}`),
});

const optionalText = (label, max) =>
  z
    .string({ error: `${label} must be text` })
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .default('');

const locationSchema = z.object(
  {
    lat: z
      .number(required('Latitude', 'a number'))
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    lng: z
      .number(required('Longitude', 'a number'))
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
  },
  required('Location', 'an object like { "lat": 12.97, "lng": 77.59 }'),
);

// Used for both POST (create) and PUT (update).
// PUT replaces all editable fields, so optional fields fall back to their defaults when left out.
// Unknown keys (e.g. _id, createdAt) are stripped automatically by z.object.
export const parcelBodySchema = z.object(
  {
    title: z
      .string(required('Title', 'text'))
      .trim()
      .min(LIMITS.titleMin, `Title must be at least ${LIMITS.titleMin} characters`)
      .max(LIMITS.titleMax, `Title must be at most ${LIMITS.titleMax} characters`),
    description: optionalText('Description', LIMITS.descriptionMax),
    ownerName: optionalText('Owner name', LIMITS.ownerNameMax),
    areaSqm: z
      .number({ error: 'Area must be a number' })
      .positive('Area must be greater than 0')
      .nullable()
      .optional()
      .default(null),
    status: z
      .enum(STATUSES, { error: `Status must be one of: ${STATUSES.join(', ')}` })
      .optional()
      .default(DEFAULT_STATUS),
    landUse: z.enum(LAND_USES, {
      error: (issue) =>
        issue.input === undefined ? 'Land use is required' : `Land use must be one of: ${LAND_USES.join(', ')}`,
    }),
    location: locationSchema,
  },
  { error: 'Request body must be a JSON object' },
);

// Query string for GET /parcels. Empty values (e.g. ?status=) are treated as "not set".
const emptyToUndefined = (v) => (v === '' ? undefined : v);

export const listQuerySchema = z.object({
  search: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'search must be a single value' }).trim().max(100, 'search must be at most 100 characters').optional(),
  ),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(STATUSES, { error: `status must be one of: ${STATUSES.join(', ')}` }).optional(),
  ),
  landUse: z.preprocess(
    emptyToUndefined,
    z.enum(LAND_USES, { error: `landUse must be one of: ${LAND_USES.join(', ')}` }).optional(),
  ),
});
