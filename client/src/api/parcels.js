import { request } from './client.js';

export async function listParcels(params) {
  const { data, total } = await request('/parcels', { params });
  return { parcels: data, total };
}

export async function createParcel(parcel) {
  const { data } = await request('/parcels', { method: 'POST', body: parcel });
  return data;
}

export async function updateParcel(id, parcel) {
  const { data } = await request(`/parcels/${id}`, { method: 'PUT', body: parcel });
  return data;
}

export async function deleteParcel(id) {
  await request(`/parcels/${id}`, { method: 'DELETE' });
}

export async function getMeta() {
  const { data } = await request('/meta');
  return data;
}
