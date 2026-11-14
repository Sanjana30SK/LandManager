// All parcel-related API calls live here, so components never build URLs themselves.
import { request } from './client.js';

// GET /api/parcels?search=&status=&landUse=  ->  { parcels, total }
// `parcels` match the filters (newest first); `total` counts every parcel in the database.
export async function listParcels(params) {
  const { data, total } = await request('/parcels', { params });
  return { parcels: data, total };
}

// POST /api/parcels  ->  the created parcel (with its new id)
export async function createParcel(parcel) {
  const { data } = await request('/parcels', { method: 'POST', body: parcel });
  return data;
}

// PUT /api/parcels/:id  ->  the updated parcel
export async function updateParcel(id, parcel) {
  const { data } = await request(`/parcels/${id}`, { method: 'PUT', body: parcel });
  return data;
}

// DELETE /api/parcels/:id  ->  nothing (204 No Content)
export async function deleteParcel(id) {
  await request(`/parcels/${id}`, { method: 'DELETE' });
}

// GET /api/meta  ->  { statuses, landUses, defaultStatus, limits }
export async function getMeta() {
  const { data } = await request('/meta');
  return data;
}
