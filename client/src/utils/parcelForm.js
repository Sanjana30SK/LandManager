export const roundCoord = (n) => Math.round(n * 1e6) / 1e6;

export function initialValues(meta, location, parcel = null) {
  return {
    title: parcel?.title ?? '',
    description: parcel?.description ?? '',
    ownerName: parcel?.ownerName ?? '',
    areaSqm: parcel?.areaSqm != null ? String(parcel.areaSqm) : '',
    status: parcel?.status ?? meta?.defaultStatus ?? '',
    landUse: parcel?.landUse ?? '',
    lat: location ? String(location.lat) : '',
    lng: location ? String(location.lng) : '',
  };
}

const toNumber = (text) => (text.trim() === '' ? NaN : Number(text));

export function validate(values, limits) {
  const errors = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Title is required';
  else if (title.length < limits.titleMin) errors.title = `Title must be at least ${limits.titleMin} characters`;
  else if (title.length > limits.titleMax) errors.title = `Title must be at most ${limits.titleMax} characters`;

  if (!values.landUse) errors.landUse = 'Land use is required';

  if (values.areaSqm.trim() !== '') {
    const area = toNumber(values.areaSqm);
    if (!Number.isFinite(area) || area <= 0) errors.areaSqm = 'Area must be a number greater than 0';
  }

  const lat = toNumber(values.lat);
  if (!Number.isFinite(lat)) errors.lat = 'Latitude is required';
  else if (lat < -90 || lat > 90) errors.lat = 'Latitude must be between -90 and 90';

  const lng = toNumber(values.lng);
  if (!Number.isFinite(lng)) errors.lng = 'Longitude is required';
  else if (lng < -180 || lng > 180) errors.lng = 'Longitude must be between -180 and 180';

  return errors;
}

export function toPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    ownerName: values.ownerName.trim(),
    areaSqm: values.areaSqm.trim() === '' ? null : Number(values.areaSqm),
    status: values.status,
    landUse: values.landUse,
    location: { lat: Number(values.lat), lng: Number(values.lng) },
  };
}

const FIELD_FROM_SERVER = { 'location.lat': 'lat', 'location.lng': 'lng', location: 'lat' };

export function serverErrorsToFields(details = []) {
  const errors = {};
  for (const { field, message } of details) {
    const key = FIELD_FROM_SERVER[field] ?? field;
    if (!errors[key]) errors[key] = message;
  }
  return errors;
}

export const FIELD_ORDER = ['title', 'landUse', 'status', 'ownerName', 'areaSqm', 'lat', 'lng', 'description'];
