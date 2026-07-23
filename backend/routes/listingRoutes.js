const express = require('express');
const {
  listListings,
  createListing,
  getListingById,
  updateListing,
  suggestListings,
  reorderListingRooms,
  deleteListing,
} = require('../controllers/listingController');
const { authenticate, optionalAuthenticate, requireListingEditor } = require('../middleware/auth');

const router = express.Router();

router.get('/suggest', suggestListings);
router.get('/', optionalAuthenticate, listListings);
router.post('/', authenticate, requireListingEditor, createListing);
router.put('/:id/rooms/order', authenticate, requireListingEditor, reorderListingRooms);
router.patch('/:id', authenticate, requireListingEditor, updateListing);
router.delete('/:id', authenticate, requireListingEditor, deleteListing);
router.get('/:id', getListingById);

module.exports = router;
