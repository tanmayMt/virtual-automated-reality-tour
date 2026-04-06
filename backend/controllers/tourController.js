const Listing = require('../models/Listing');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

/**
 * GET /api/tour/:listingId
 * Full listing with all rooms and embedded hotspots populated for viewer.
 */
const getTourByListingId = asyncHandler(async (req, res) => {
  const { listingId } = req.params;

  if (!mongoose.isValidObjectId(listingId)) {
    throw new AppError('Invalid listingId', 400);
  }

  const listing = await Listing.findById(listingId)
    .populate({
      path: 'rooms',
      options: { sort: { createdAt: 1 } },
    })
    .populate('sellerId', 'name email role');

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  const plain = listing.toObject();
  const rawRooms = Array.isArray(plain.rooms) ? plain.rooms : [];
  plain.rooms = rawRooms
    .filter((room) => room != null)
    .map((room) => ({
      _id: room._id,
      name: room.name ?? '',
      imageUrl: typeof room.imageUrl === 'string' ? room.imageUrl : '',
      hotspots: Array.isArray(room.hotspots) ? room.hotspots : [],
    }));

  res.json({ success: true, data: plain });
});

module.exports = {
  getTourByListingId,
};
