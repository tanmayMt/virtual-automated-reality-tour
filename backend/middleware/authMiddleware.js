const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Verifies `Authorization: Bearer <JWT>` and sets `req.user` (name, email, role; no password).
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Server configuration error', 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const userId = decoded.sub;
  if (!userId) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(userId).select('name email role');
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  req.user = user;
  next();
});

/**
 * If Bearer token is valid, sets `req.user`; otherwise leaves `req.user` undefined (no 401).
 */
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  req.user = undefined;
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7).trim();
  if (!token) {
    next();
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    const userId = decoded.sub;
    if (!userId) {
      next();
      return;
    }
    const user = await User.findById(userId).select('name email role');
    if (user) {
      req.user = user;
    }
  } catch {
    // invalid token — anonymous
  }
  next();
});

module.exports = {
  authenticate,
  optionalAuthenticate,
};
