const mongoose = require('mongoose');
const Room = require('../models/Room');
const Listing = require('../models/Listing');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { uploadBufferToCloudinary } = require('../config/cloudinary');
const { canEditListing } = require('../utils/roles');

const HOTSPOT_TYPES = new Set(['navigation', 'feature']);

function normalizeHotspotPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const { type, yaw, pitch, targetRoomId, text, description } = raw;
  if (!HOTSPOT_TYPES.has(type)) {
    throw new AppError(`hotspot.type must be "navigation" or "feature"`, 400);
  }
  const yawNum = typeof yaw === 'number' ? yaw : Number(yaw);
  const pitchNum = typeof pitch === 'number' ? pitch : Number(pitch);
  if (Number.isNaN(yawNum)) {
    throw new AppError('hotspot.yaw must be a number', 400);
  }
  if (Number.isNaN(pitchNum)) {
    throw new AppError('hotspot.pitch must be a number', 400);
  }
  let target = null;
  if (targetRoomId != null && targetRoomId !== '') {
    if (!mongoose.isValidObjectId(String(targetRoomId))) {
      throw new AppError('hotspot.targetRoomId must be a valid ObjectId when provided', 400);
    }
    target = new mongoose.Types.ObjectId(String(targetRoomId));
  }
  return {
    type,
    yaw: yawNum,
    pitch: pitchNum,
    targetRoomId: target,
    text: text != null ? String(text) : '',
    description: description != null ? String(description) : '',
  };
}

/**
 * POST /api/rooms
 * Body: { name, listingId, imageUrl }
 */
const createRoom = asyncHandler(async (req, res) => {
  const { name, listingId, imageUrl } = req.body;

  if (!name || !listingId || !imageUrl) {
    throw new AppError('name, listingId, and imageUrl are required', 400);
  }

  if (!mongoose.isValidObjectId(String(listingId))) {
    throw new AppError('Invalid listingId', 400);
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (!canEditListing(req.user, listing)) {
    throw new AppError('You do not have access to this listing', 403);
  }

  const room = await Room.create({
    name: String(name).trim(),
    imageUrl: String(imageUrl).trim(),
    listingId,
    hotspots: [],
  });

  listing.rooms.push(room._id);
  await listing.save();

  res.status(201).json({ success: true, data: room });
});

/**
 * POST /api/rooms/upload
 * multipart field: image (or file — we use "image" as primary)
 */
const uploadRoomImage = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new AppError('Image file is required (field name: image)', 400);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError('Cloudinary is not configured', 503);
  }

  const { secure_url, public_id } = await uploadBufferToCloudinary(req.file.buffer);

  res.status(201).json({
    success: true,
    data: {
      url: secure_url,
      secure_url,
      public_id,
    },
  });
});

/**
 * PUT /api/rooms/:id/hotspots
 * Body: { hotspots: [...] } — replaces entire embedded array
 */
const updateRoomHotspots = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hotspots } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid room id', 400);
  }

  if (!Array.isArray(hotspots)) {
    throw new AppError('hotspots must be an array', 400);
  }

  const normalized = [];
  for (let index = 0; index < hotspots.length; index += 1) {
    const n = normalizeHotspotPayload(hotspots[index]);
    if (!n) {
      throw new AppError(`hotspots[${index}] is invalid`, 400);
    }
    normalized.push(n);
  }

  const room = await Room.findById(id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  const listing = await Listing.findById(room.listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }
  if (!canEditListing(req.user, listing)) {
    throw new AppError('You do not have access to this listing', 403);
  }

  const updated = await Room.findByIdAndUpdate(
    id,
    { $set: { hotspots: normalized } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new AppError('Room not found', 404);
  }

  res.json({ success: true, data: updated });
});

module.exports = {
  createRoom,
  uploadRoomImage,
  updateRoomHotspots,
};
