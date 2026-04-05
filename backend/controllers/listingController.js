const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { isStaff } = require('../utils/roles');

/**
 * GET /api/listings (admin, manager) — all listings with rooms and seller summary.
 */
const listAllListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find()
    .sort({ createdAt: -1 })
    .populate('sellerId', 'name email role')
    .populate('rooms');

  res.json({ success: true, data: listings });
});

/**
 * POST /api/listings (seller, admin, manager)
 * Body: { title, address, price, rooms?, sellerId? }
 * - Seller: owner is always the authenticated user.
 * - Admin/manager: optional sellerId assigns an existing seller as owner; otherwise defaults to self.
 */
const createListing = asyncHandler(async (req, res) => {
  const { title, address, price, rooms, sellerId: bodySellerId } = req.body;

  if (title == null || address == null || price == null) {
    throw new AppError('title, address, and price are required', 400);
  }

  const priceNum = Number(price);
  if (Number.isNaN(priceNum) || priceNum < 0) {
    throw new AppError('price must be a non-negative number', 400);
  }

  let ownerId = req.user._id;

  if (isStaff(req.user) && bodySellerId != null && bodySellerId !== '') {
    if (!mongoose.isValidObjectId(String(bodySellerId))) {
      throw new AppError('Invalid sellerId', 400);
    }
    const sellerUser = await User.findById(bodySellerId);
    if (!sellerUser) {
      throw new AppError('Seller user not found', 404);
    }
    if (sellerUser.role !== 'seller') {
      throw new AppError('sellerId must reference a user with role "seller"', 400);
    }
    ownerId = sellerUser._id;
  }

  const listing = await Listing.create({
    title: String(title).trim(),
    address: String(address).trim(),
    price: priceNum,
    rooms: Array.isArray(rooms) ? rooms : [],
    sellerId: ownerId,
  });

  res.status(201).json({ success: true, data: listing });
});

/**
 * GET /api/listings/:id
 */
const getListingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate('rooms')
    .populate('sellerId', 'name email role');

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  res.json({ success: true, data: listing });
});

module.exports = {
  listAllListings,
  createListing,
  getListingById,
};
