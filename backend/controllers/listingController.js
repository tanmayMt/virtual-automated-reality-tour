const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { isStaff, canEditListing } = require('../utils/roles');

const PROPERTY_TYPES = new Set([
  'apartment',
  'house',
  'condo',
  'townhouse',
  'land',
  'commercial',
  'other',
]);

function parseNum(value, fallback = null) {
  if (value == null || value === '') {
    return fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(value) {
  if (value === true || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === '0') {
    return false;
  }
  return null;
}

function toListingSummary(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const rooms = Array.isArray(o.rooms) ? o.rooms : [];
  const firstRoom = rooms.length > 0 ? rooms[0] : null;
  const thumbnail =
    (firstRoom && typeof firstRoom === 'object' && firstRoom.imageUrl) || null;
  const roomCount = rooms.filter(Boolean).length;
  const has360 = roomCount > 0 || Boolean(o.has360Tour);

  const seller =
    o.sellerId && typeof o.sellerId === 'object'
      ? { _id: o.sellerId._id, name: o.sellerId.name, email: o.sellerId.email, role: o.sellerId.role }
      : null;

  return {
    _id: o._id,
    title: o.title,
    address: o.address,
    price: o.price,
    thumbnail,
    bedrooms: o.bedrooms ?? 0,
    bathrooms: o.bathrooms ?? 0,
    areaSqft: o.areaSqft ?? 0,
    propertyType: o.propertyType || 'apartment',
    featured: Boolean(o.featured),
    verifiedSeller: Boolean(o.verifiedSeller),
    has360Tour: has360,
    lat: o.lat ?? null,
    lng: o.lng ?? null,
    floorPlanUrl: o.floorPlanUrl || '',
    introVideoUrl: o.introVideoUrl || '',
    tourDurationMinutes: o.tourDurationMinutes ?? 5,
    nextViewingAt: o.nextViewingAt || null,
    popularity: o.popularity ?? 0,
    nearbyPlaces: Array.isArray(o.nearbyPlaces) ? o.nearbyPlaces : [],
    priceHistory: Array.isArray(o.priceHistory) ? o.priceHistory : [],
    roomCount,
    seller,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function buildListingFilter(query) {
  const filter = {};
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } },
      { propertyType: { $regex: q, $options: 'i' } },
    ];
  }

  const minPrice = parseNum(query.minPrice);
  const maxPrice = parseNum(query.maxPrice);
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) {
      filter.price.$gte = minPrice;
    }
    if (maxPrice != null) {
      filter.price.$lte = maxPrice;
    }
  }

  const bedrooms = parseNum(query.bedrooms);
  if (bedrooms != null) {
    filter.bedrooms = { $gte: bedrooms };
  }

  const bathrooms = parseNum(query.bathrooms);
  if (bathrooms != null) {
    filter.bathrooms = { $gte: bathrooms };
  }

  if (typeof query.propertyType === 'string' && PROPERTY_TYPES.has(query.propertyType)) {
    filter.propertyType = query.propertyType;
  }

  const featured = parseBool(query.featured);
  if (featured != null) {
    filter.featured = featured;
  }

  return filter;
}

function buildSort(sortKey) {
  switch (String(sortKey || 'newest')) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'popularity':
      return { popularity: -1, createdAt: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

function pickListingFields(body) {
  const fields = {};
  if (body.title != null) {
    fields.title = String(body.title).trim();
  }
  if (body.address != null) {
    fields.address = String(body.address).trim();
  }
  if (body.price != null) {
    const priceNum = Number(body.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      throw new AppError('price must be a non-negative number', 400);
    }
    fields.price = priceNum;
  }
  if (body.introVideoUrl != null) {
    fields.introVideoUrl = String(body.introVideoUrl).trim();
  }
  if (body.bedrooms != null) {
    fields.bedrooms = Math.max(0, Number(body.bedrooms) || 0);
  }
  if (body.bathrooms != null) {
    fields.bathrooms = Math.max(0, Number(body.bathrooms) || 0);
  }
  if (body.areaSqft != null) {
    fields.areaSqft = Math.max(0, Number(body.areaSqft) || 0);
  }
  if (body.propertyType != null) {
    const t = String(body.propertyType).toLowerCase();
    if (!PROPERTY_TYPES.has(t)) {
      throw new AppError('Invalid propertyType', 400);
    }
    fields.propertyType = t;
  }
  if (body.featured != null) {
    fields.featured = Boolean(body.featured);
  }
  if (body.verifiedSeller != null) {
    fields.verifiedSeller = Boolean(body.verifiedSeller);
  }
  if (body.has360Tour != null) {
    fields.has360Tour = Boolean(body.has360Tour);
  }
  if (body.lat != null && body.lat !== '') {
    fields.lat = Number(body.lat);
  }
  if (body.lng != null && body.lng !== '') {
    fields.lng = Number(body.lng);
  }
  if (body.floorPlanUrl != null) {
    fields.floorPlanUrl = String(body.floorPlanUrl).trim();
  }
  if (body.tourDurationMinutes != null) {
    fields.tourDurationMinutes = Math.max(0, Number(body.tourDurationMinutes) || 0);
  }
  if (body.nextViewingAt != null) {
    fields.nextViewingAt = body.nextViewingAt ? new Date(body.nextViewingAt) : null;
  }
  if (body.popularity != null) {
    fields.popularity = Math.max(0, Number(body.popularity) || 0);
  }
  if (Array.isArray(body.nearbyPlaces)) {
    fields.nearbyPlaces = body.nearbyPlaces;
  }
  if (Array.isArray(body.priceHistory)) {
    fields.priceHistory = body.priceHistory;
  }
  return fields;
}

async function queryPublicListings(query) {
  const filter = buildListingFilter(query);
  const sort = buildSort(query.sort);
  const listings = await Listing.find(filter)
    .sort(sort)
    .populate('rooms', 'imageUrl')
    .populate('sellerId', 'name email role');
  return listings.map(toListingSummary);
}

/**
 * GET /api/listings/suggest?q=
 */
const suggestListings = asyncHandler(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q || q.length < 1) {
    res.json({ success: true, data: [] });
    return;
  }
  const listings = await Listing.find({
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } },
    ],
  })
    .sort({ popularity: -1, createdAt: -1 })
    .limit(8)
    .select('title address price propertyType');
  res.json({
    success: true,
    data: listings.map((d) => ({
      _id: d._id,
      title: d.title,
      address: d.address,
      price: d.price,
      propertyType: d.propertyType,
    })),
  });
});

const getAllListings = asyncHandler(async (req, res) => {
  const data = await queryPublicListings(req.query);
  res.json({ success: true, data });
});

const listListings = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role === 'buyer') {
    const data = await queryPublicListings(req.query);
    res.json({ success: true, data });
    return;
  }

  if (isStaff(req.user)) {
    const listings = await Listing.find()
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name email role')
      .populate('rooms');
    res.json({ success: true, data: listings });
    return;
  }

  const listings = await Listing.find({ sellerId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('rooms');

  res.json({ success: true, data: listings });
});

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

  const extra = pickListingFields(req.body);
  const listing = await Listing.create({
    ...extra,
    title: String(title).trim(),
    address: String(address).trim(),
    price: priceNum,
    rooms: Array.isArray(rooms) ? rooms : [],
    sellerId: ownerId,
    priceHistory: Array.isArray(extra.priceHistory)
      ? extra.priceHistory
      : [{ price: priceNum, recordedAt: new Date() }],
    verifiedSeller: isStaff(req.user) ? Boolean(extra.verifiedSeller) : false,
    featured: isStaff(req.user) ? Boolean(extra.featured) : Boolean(extra.featured),
  });

  res.status(201).json({ success: true, data: listing });
});

const updateListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid listing id', 400);
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (!canEditListing(req.user, listing)) {
    throw new AppError('Not allowed to update this listing', 403);
  }

  const fields = pickListingFields(req.body);
  if (fields.price != null && fields.price !== listing.price) {
    const history = Array.isArray(listing.priceHistory) ? [...listing.priceHistory] : [];
    history.push({ price: fields.price, recordedAt: new Date() });
    fields.priceHistory = history;
  }

  if (!isStaff(req.user)) {
    delete fields.featured;
    delete fields.verifiedSeller;
    delete fields.popularity;
  }

  Object.assign(listing, fields);
  await listing.save();

  const populated = await Listing.findById(listing._id)
    .populate('rooms')
    .populate('sellerId', 'name email role');

  res.json({ success: true, data: populated });
});

const getListingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(
    id,
    { $inc: { popularity: 1 } },
    { new: true }
  )
    .populate('rooms')
    .populate('sellerId', 'name email role');

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  res.json({ success: true, data: listing });
});

/**
 * PUT /api/listings/:id/rooms/order
 * Body: { roomIds: string[] } — must be a permutation of existing rooms
 */
const reorderListingRooms = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roomIds } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid listing id', 400);
  }
  if (!Array.isArray(roomIds) || roomIds.length === 0) {
    throw new AppError('roomIds must be a non-empty array', 400);
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }
  if (!canEditListing(req.user, listing)) {
    throw new AppError('Not allowed to update this listing', 403);
  }

  const current = (listing.rooms || []).map((r) => String(r));
  const next = roomIds.map((r) => String(r));

  if (next.length !== current.length) {
    throw new AppError('roomIds must include every room exactly once', 400);
  }
  const currentSet = new Set(current);
  for (const rid of next) {
    if (!mongoose.isValidObjectId(rid) || !currentSet.has(rid)) {
      throw new AppError('roomIds contains an invalid or unknown room id', 400);
    }
  }
  if (new Set(next).size !== next.length) {
    throw new AppError('roomIds must not contain duplicates', 400);
  }

  listing.rooms = next;
  await listing.save();

  const populated = await Listing.findById(listing._id)
    .populate('rooms')
    .populate('sellerId', 'name email role');

  res.json({ success: true, data: populated });
});

/**
 * DELETE /api/listings/:id — removes listing and its rooms
 */
const deleteListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid listing id', 400);
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }
  if (!canEditListing(req.user, listing)) {
    throw new AppError('Not allowed to delete this listing', 403);
  }

  const Room = require('../models/Room');
  const roomIds = Array.isArray(listing.rooms) ? listing.rooms : [];
  if (roomIds.length > 0) {
    await Room.deleteMany({ _id: { $in: roomIds } });
  }
  await Listing.deleteOne({ _id: id });

  res.json({ success: true, data: { id } });
});

module.exports = {
  getAllListings,
  listListings,
  createListing,
  updateListing,
  getListingById,
  suggestListings,
  reorderListingRooms,
  deleteListing,
};
