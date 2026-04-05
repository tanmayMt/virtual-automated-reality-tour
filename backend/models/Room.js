const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['navigation', 'feature'],
      required: true,
    },
    yaw: {
      type: Number,
      required: true,
    },
    pitch: {
      type: Number,
      required: true,
    },
    targetRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    text: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    hotspots: {
      type: [hotspotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
