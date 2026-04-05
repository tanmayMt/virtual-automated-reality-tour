const express = require('express');
const authRoutes = require('./authRoutes');
const listingRoutes = require('./listingRoutes');
const roomRoutes = require('./roomRoutes');
const tourRoutes = require('./tourRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/rooms', roomRoutes);
router.use('/tour', tourRoutes);

module.exports = router;
