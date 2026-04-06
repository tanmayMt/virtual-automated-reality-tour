const bcrypt = require('bcryptjs');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const signToken = require('../utils/signToken');
const { REGISTERABLE_ROLES } = require('../utils/roles');

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 12;

function toPublicUser(userDoc) {
  return {
    _id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
  };
}

/**
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError('name, email, and password are required', 400);
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }

  const roleValue = role != null ? String(role).toLowerCase() : 'buyer';
  if (!REGISTERABLE_ROLES.has(roleValue)) {
    throw new AppError('role must be "seller" or "buyer" (admin/manager accounts are provisioned separately)', 400);
  }

  const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    role: roleValue,
    passwordHash,
  });

  const token = signToken(user._id, user.role);
  const publicUser = toPublicUser(user);

  res.status(201).json({
    success: true,
    token,
    user: publicUser,
    data: {
      token,
      user: publicUser,
    },
  });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('email and password are required', 400);
  }

  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const match = await bcrypt.compare(String(password), user.passwordHash);
  if (!match) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user._id, user.role);
  const publicUser = toPublicUser(user);

  res.json({
    success: true,
    token,
    user: publicUser,
    data: {
      token,
      user: publicUser,
    },
  });
});

/**
 * GET /api/auth/me
 */
const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: toPublicUser(req.user) },
  });
});

module.exports = {
  register,
  login,
  me,
};
