const express = require('express');
const {
  listAllListings,
  createListing,
  getListingById,
} = require('../controllers/listingController');
const { authenticate, requireListingEditor, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRoles('admin', 'manager'), listAllListings);
router.post('/', authenticate, requireListingEditor, createListing);
router.get('/:id', getListingById);

module.exports = router;
