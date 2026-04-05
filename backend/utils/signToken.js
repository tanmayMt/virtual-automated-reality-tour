const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

/**
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @param {string} role
 * @returns {string}
 */
function signToken(userId, role) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new AppError('JWT_SECRET must be set (min 16 characters)', 500);
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { sub: String(userId), role },
    secret,
    { expiresIn }
  );
}

module.exports = signToken;
