const express = require('express');
const User = require('../models/User');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get('/dashboard', (req, res) => {
  res.json({
    ok: true,
    area: 'admin',
    message: 'Dashboard data (admin only).',
    userId: req.user.userId,
    role: req.user.role,
  });
});

router.get('/overview', (req, res) => {
  res.json({
    message: 'Admin-only overview (enforced server-side).',
    actor: { userId: req.user.userId, role: req.user.role },
  });
});

router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ userCount: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load user count.' });
  }
});

module.exports = router;
