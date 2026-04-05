/**
 * Create an admin or manager user (not available via public register).
 *
 * Usage (from backend/):
 *   node scripts/provisionStaff.js <admin|manager> <email> <password> <name>
 *
 * Requires MONGODB_URI and loads .env from backend root.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const ROLES = new Set(['admin', 'manager']);
const BCRYPT_ROUNDS = 12;

async function main() {
  const [, , role, email, password, ...nameParts] = process.argv;
  const name = nameParts.join(' ').trim();

  if (!role || !email || !password || !name) {
    console.error(
      'Usage: node scripts/provisionStaff.js <admin|manager> <email> <password> <name>'
    );
    process.exit(1);
  }

  const r = String(role).toLowerCase();
  if (!ROLES.has(r)) {
    console.error('role must be "admin" or "manager"');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    role: r,
    passwordHash,
  });

  console.log('Created staff user:', user._id.toString(), user.email, user.role);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
