const express = require('express');
const {
  listListings,
  createListing,
  getListingById,
  updateListing,
  suggestListings,
} = require('../controllers/listingController');
const { authenticate, optionalAuthenticate, requireListingEditor } = require('../middleware/auth');

const router = express.Router();

router.get('/suggest', suggestListings);
router.get('/', optionalAuthenticate, listListings);
router.post('/', authenticate, requireListingEditor, createListing);
router.patch('/:id', authenticate, requireListingEditor, updateListing);
router.get('/:id', getListingById);

module.exports = router;
