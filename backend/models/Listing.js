const mongoose = require('mongoose');

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
    /** Geocoordinates for intro map / satellite hero (optional). */
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    rooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
      },
    ],
    /** Seller who owns this listing (seller workflow). */
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
