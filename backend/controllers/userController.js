const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

/**
 * GET /api/users (admin, manager)
 */
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('name email role createdAt updatedAt')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: users });
});

/**
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid user id', 400);
  }

  const user = await User.findById(id).select('name email role createdAt updatedAt');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, data: user });
});

module.exports = {
  listUsers,
  getUserById,
};
