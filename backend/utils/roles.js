/** Roles that can list all users/listings and bypass listing ownership on edits. */
const STAFF_ROLES = new Set(['admin', 'manager']);

/** Roles allowed to create listings and manage rooms/uploads/hotspots. */
const LISTING_EDITOR_ROLES = new Set(['seller', 'admin', 'manager']);

/** Roles allowed via public registration (prevents self-signup as admin/manager). */
const REGISTERABLE_ROLES = new Set(['seller', 'buyer']);

function isStaff(user) {
  return Boolean(user && STAFF_ROLES.has(user.role));
}

/**
 * Staff may edit any listing; sellers only their own.
 * @param {{ role: string, _id: import('mongoose').Types.ObjectId }} user
 * @param {{ sellerId?: import('mongoose').Types.ObjectId | null }} listing
 */
function canEditListing(user, listing) {
  if (!user || !listing) {
    return false;
  }
  if (isStaff(user)) {
    return true;
  }
  return Boolean(listing.sellerId && listing.sellerId.equals(user._id));
}

module.exports = {
  STAFF_ROLES,
  LISTING_EDITOR_ROLES,
  REGISTERABLE_ROLES,
  isStaff,
  canEditListing,
};
