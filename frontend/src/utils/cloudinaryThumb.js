/**
 * Returns a smaller Cloudinary URL for thumbnails. Non-Cloudinary URLs are returned unchanged.
 * @param {string} url
 * @param {number} [w=200]
 * @param {number} [h=120]
 */
export function cloudinaryThumbnail(url, w = 200, h = 120) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return url;
  }
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) {
    return url;
  }
  const prefix = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);
  return `${prefix}c_fill,w_${w},h_${h},q_auto,f_auto/${rest}`;
}
