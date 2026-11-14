// Single source of truth for parcel values.
// The Mongoose model, the request validators and the seed script all import from here,
// so the allowed values can never disagree between layers.

export const STATUSES = ['available', 'sold', 'reserved', 'under_dispute'];

export const LAND_USES = ['residential', 'commercial', 'agricultural', 'industrial', 'institutional'];

export const DEFAULT_STATUS = 'available';

export const LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMax: 1000,
  ownerNameMax: 100,
};

// Bengaluru city centre, used as the default map centre.
export const BENGALURU = { lat: 12.9716, lng: 77.5946 };
