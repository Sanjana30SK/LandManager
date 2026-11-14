// Mongoose model for a land parcel.
// The schema is the database's own safety net: even if a request skips the Zod validators
// (added in Phase 2), invalid data still cannot be saved.
import mongoose from 'mongoose';
import { STATUSES, LAND_USES, DEFAULT_STATUS, LIMITS } from '../constants/parcel.js';
import { isValidLatLng, toLatLng } from '../utils/location.js';

// GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }
const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (c) => Array.isArray(c) && c.length === 2 && isValidLatLng(c[1], c[0]),
        message: 'Location must be [lng, lat] with lat between -90 and 90 and lng between -180 and 180',
      },
    },
  },
  { _id: false },
);

// GeoJSON Polygon (bonus feature): { type: 'Polygon', coordinates: [[[lng, lat], ...]] }
const polygonSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Polygon'], required: true },
    coordinates: { type: [[[Number]]], required: true },
  },
  { _id: false },
);

const parcelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [LIMITS.titleMin, `Title must be at least ${LIMITS.titleMin} characters`],
      maxlength: [LIMITS.titleMax, `Title must be at most ${LIMITS.titleMax} characters`],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [LIMITS.descriptionMax, `Description must be at most ${LIMITS.descriptionMax} characters`],
    },
    ownerName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [LIMITS.ownerNameMax, `Owner name must be at most ${LIMITS.ownerNameMax} characters`],
    },
    areaSqm: {
      type: Number,
      min: [0.01, 'Area must be greater than 0'],
      default: null,
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: `Status must be one of: ${STATUSES.join(', ')}` },
      default: DEFAULT_STATUS,
    },
    landUse: {
      type: String,
      required: [true, 'Land use is required'],
      enum: { values: LAND_USES, message: `Land use must be one of: ${LAND_USES.join(', ')}` },
    },
    location: { type: pointSchema, required: [true, 'Location is required'] },
    boundary: { type: polygonSchema, default: undefined },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: {
      // Shape every parcel the same way whenever it is sent as JSON:
      // _id -> id, GeoJSON -> { lat, lng }, and no internal __v field.
      transform(_doc, ret) {
        return {
          id: String(ret._id),
          title: ret.title,
          description: ret.description,
          ownerName: ret.ownerName,
          areaSqm: ret.areaSqm ?? null,
          status: ret.status,
          landUse: ret.landUse,
          location: toLatLng(ret.location),
          boundary: ret.boundary ?? null,
          createdAt: ret.createdAt,
          updatedAt: ret.updatedAt,
        };
      },
    },
  },
);

// Indexes
parcelSchema.index({ location: '2dsphere' }); // geographic index for the point
parcelSchema.index({ status: 1, landUse: 1 }); // fast status / land-use filters (bonus)
parcelSchema.index({ createdAt: -1 }); // "newest first" sorting

export const Parcel = mongoose.model('Parcel', parcelSchema);
