const express = require('express');
const { listUsers, getUserById } = require('../controllers/userController');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRoles('admin', 'manager'), listUsers);
router.get('/:id', getUserById);

module.exports = router;
