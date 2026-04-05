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
  res.json({ success: true, data: plain });
});

module.exports = {
  getTourByListingId,
};
