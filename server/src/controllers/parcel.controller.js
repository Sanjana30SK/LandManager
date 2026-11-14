// One function per endpoint. By the time these run, the input has already been validated
// (req.validated) and the id format checked, so the code here is only about the data.
// Express 5 forwards errors from async functions to the error handler automatically.
import { Parcel } from '../models/Parcel.js';
import { ApiError } from '../utils/ApiError.js';
import { toGeoPoint } from '../utils/location.js';

// Escape characters that have a special meaning in regular expressions,
// so a search for "plot (1)" matches that text literally.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Validated request body -> fields as stored in MongoDB.
const toDbFields = ({ location, ...rest }) => ({ ...rest, location: toGeoPoint(location) });

const notFound = () => ApiError.notFound('Parcel not found');

// GET /api/parcels?search=&status=&landUse=
export async function listParcels(req, res) {
  const { search, status, landUse } = req.validated.query;
  const filter = {};
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' }; // case-insensitive partial match
  if (status) filter.status = status;
  if (landUse) filter.landUse = landUse;

  // Newest first; _id breaks ties (seeded parcels share the same createdAt) so the order is stable.
  // `total` (all parcels, ignoring filters) lets the UI show "3 of 15".
  const [parcels, total] = await Promise.all([
    Parcel.find(filter).sort({ createdAt: -1, _id: -1 }),
    Parcel.estimatedDocumentCount(),
  ]);
  res.json({ count: parcels.length, total, data: parcels });
}

// GET /api/parcels/:id
export async function getParcel(req, res) {
  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw notFound();
  res.json({ data: parcel });
}

// POST /api/parcels
export async function createParcel(req, res) {
  const parcel = await Parcel.create(toDbFields(req.validated.body));
  res.status(201).location(`/api/parcels/${parcel.id}`).json({ data: parcel });
}

// PUT /api/parcels/:id
export async function updateParcel(req, res) {
  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw notFound();
  parcel.set(toDbFields(req.validated.body));
  await parcel.save(); // runs schema validation and bumps updatedAt
  res.json({ data: parcel });
}

// DELETE /api/parcels/:id
export async function deleteParcel(req, res) {
  const parcel = await Parcel.findByIdAndDelete(req.params.id);
  if (!parcel) throw notFound();
  res.status(204).end();
}
