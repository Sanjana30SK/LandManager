import { Parcel } from '../models/Parcel.js';
import { ApiError } from '../utils/ApiError.js';
import { toGeoPoint } from '../utils/location.js';

// Escape user input so the search text is matched literally, not run as a regex.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toDbFields = ({ location, ...rest }) => ({ ...rest, location: toGeoPoint(location) });

const notFound = () => ApiError.notFound('Parcel not found');

export async function listParcels(req, res) {
  const { search, status, landUse } = req.validated.query;
  const filter = {};
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
  if (status) filter.status = status;
  if (landUse) filter.landUse = landUse;

  const [parcels, total] = await Promise.all([
    Parcel.find(filter).sort({ createdAt: -1, _id: -1 }),
    Parcel.estimatedDocumentCount(),
  ]);
  res.json({ count: parcels.length, total, data: parcels });
}

export async function getParcel(req, res) {
  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw notFound();
  res.json({ data: parcel });
}

export async function createParcel(req, res) {
  const parcel = await Parcel.create(toDbFields(req.validated.body));
  res.status(201).location(`/api/parcels/${parcel.id}`).json({ data: parcel });
}

export async function updateParcel(req, res) {
  // find + save (instead of findByIdAndUpdate) so every schema validator runs.
  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw notFound();
  parcel.set(toDbFields(req.validated.body));
  await parcel.save();
  res.json({ data: parcel });
}

export async function deleteParcel(req, res) {
  const parcel = await Parcel.findByIdAndDelete(req.params.id);
  if (!parcel) throw notFound();
  res.status(204).end();
}
