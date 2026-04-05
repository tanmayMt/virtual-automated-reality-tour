const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');
const AppError = require('../utils/AppError');
const { LISTING_EDITOR_ROLES } = require('../utils/roles');

/**
 * Requires `Authorization: Bearer <jwt>`. Attaches `req.user` (no password).
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Server configuration error', 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const userId = decoded.sub;
  if (!userId) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(userId).select('name email role');
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  req.user = user;
  next();
});

/** Seller, admin, or manager — for listing/room write APIs. */
function requireListingEditor(req, res, next) {
  if (!req.user || !LISTING_EDITOR_ROLES.has(req.user.role)) {
    next(new AppError('Seller or staff access only', 403));
    return;
  }
  next();
}

/**
 * @param {...string} roles
 * @returns {import('express').RequestHandler}
 */
function requireRoles(...roles) {
  const allowed = new Set(roles);
  return (req, res, next) => {
    if (!req.user || !allowed.has(req.user.role)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireListingEditor,
  /** @deprecated Use requireListingEditor */
  requireSeller: requireListingEditor,
  requireRoles,
};
