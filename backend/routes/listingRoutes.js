const express = require('express');
const { listListings, createListing, getListingById } = require('../controllers/listingController');
const { authenticate, optionalAuthenticate, requireListingEditor } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthenticate, listListings);
router.post('/', authenticate, requireListingEditor, createListing);
router.get('/:id', getListingById);

module.exports = router;
