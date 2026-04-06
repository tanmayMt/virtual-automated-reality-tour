const AppError = require('../utils/AppError');
const { LISTING_EDITOR_ROLES } = require('../utils/roles');
const { authenticate, optionalAuthenticate } = require('./authMiddleware');

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
  optionalAuthenticate,
  requireListingEditor,
  /** @deprecated Use requireListingEditor */
  requireSeller: requireListingEditor,
  requireRoles,
};
