const express = require('express');
const { getTourByListingId } = require('../controllers/tourController');

const router = express.Router();

router.get('/:listingId', getTourByListingId);

module.exports = router;
