const express = require('express');
const { upload360Image } = require('../config/cloudinary');
const {
  createRoom,
  uploadRoomImage,
  updateRoomHotspots,
} = require('../controllers/roomController');
const { authenticate, requireListingEditor } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/upload',
  authenticate,
  requireListingEditor,
  (req, res, next) => {
    upload360Image.single('image')(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },
  uploadRoomImage
);

router.post('/', authenticate, requireListingEditor, createRoom);
router.put('/:id/hotspots', authenticate, requireListingEditor, updateRoomHotspots);

module.exports = router;
