const mongoose = require('mongoose');

const nearbyPlaceSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['school', 'hospital', 'transport', 'other'],
      default: 'other',
    },
    distanceKm: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const pricePointSchema = new mongoose.Schema(
  {
    price: { type: Number, required: true, min: 0 },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    introVideoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    bedrooms: { type: Number, min: 0, default: 0 },
    bathrooms: { type: Number, min: 0, default: 0 },
    areaSqft: { type: Number, min: 0, default: 0 },
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial', 'other'],
      default: 'apartment',
    },
    featured: { type: Boolean, default: false },
    verifiedSeller: { type: Boolean, default: false },
    has360Tour: { type: Boolean, default: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    floorPlanUrl: { type: String, default: '', trim: true },
    tourDurationMinutes: { type: Number, min: 0, default: 5 },
    nextViewingAt: { type: Date, default: null },
    popularity: { type: Number, min: 0, default: 0 },
    nearbyPlaces: { type: [nearbyPlaceSchema], default: [] },
    priceHistory: { type: [pricePointSchema], default: [] },
    rooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
      },
    ],
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', address: 'text' });
listingSchema.index({ price: 1, bedrooms: 1, propertyType: 1, featured: -1, popularity: -1 });

module.exports = mongoose.model('Listing', listingSchema);
