/**
 * Create or update an admin user (not available via public register).
 *
 * Usage (from backend/):
 *   node scripts/createAdmin.js <email> <password> [name]
 *
 * Examples:
 *   node scripts/createAdmin.js admin@example.com Secret123 "Site Admin"
 *   npm run create-admin -- admin@example.com Secret123 "Site Admin"
 *
 * Requires MONGODB_URI in backend/.env
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const BCRYPT_ROUNDS = 12;

async function main() {
  const [, , email, password, ...nameParts] = process.argv;
  const name = nameParts.join(' ').trim() || 'Admin';

  if (!email || !password) {
    console.error('Usage: node scripts/createAdmin.js <email> <password> [name]');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    existing.role = 'admin';
    existing.passwordHash = passwordHash;
    if (nameParts.length) {
      existing.name = name;
    }
    await existing.save();
    console.log('Updated admin:', existing._id.toString(), existing.email, existing.role);
  } else {
    const user = await User.create({
      name,
      email: normalizedEmail,
      role: 'admin',
      passwordHash,
    });
    console.log('Created admin:', user._id.toString(), user.email, user.role);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
