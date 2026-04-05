const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

/** Max upload size for equirectangular 360° images (50 MB). */
const MAX_FILE_BYTES = 50 * 1024 * 1024;

const storage = multer.memoryStorage();

const upload360Image = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype);
    if (allowed) {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPEG, PNG, or WebP images are allowed'));
  },
});

/**
 * Upload a buffer to Cloudinary as an image (equirectangular 360° panorama).
 * @param {Buffer} buffer
 * @param {string} [folder='virtual-tour-360']
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
function uploadBufferToCloudinary(buffer, folder = 'virtual-tour-360') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Preserve quality for large panoramas
        quality: 'auto',
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary returned no result'));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

module.exports = {
  cloudinary,
  upload360Image,
  uploadBufferToCloudinary,
};
