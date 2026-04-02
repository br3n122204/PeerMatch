const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  signAccessToken,
  attachAccessTokenCookieForReq,
  clearAccessTokenCookieForReq,
} = require('../middleware/auth');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * POST /api/auth/login — validates email/password, sets HTTP-only JWT (userId + role).
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const token = signAccessToken(user);
    attachAccessTokenCookieForReq(req, res, token);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.accountType ? { accountType: user.accountType } : {}),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
}

function logout(req, res) {
  clearAccessTokenCookieForReq(req, res);
  return res.status(204).send();
}

/** GET /api/auth/me — requires authMiddleware upstream */
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('name email role verified accountType');
    if (!user) {
      clearAccessTokenCookieForReq(req, res);
      return res.status(401).json({ message: 'Account not found.' });
    }
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        ...(user.accountType ? { accountType: user.accountType } : {}),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error loading session.' });
  }
}

module.exports = {
  login,
  logout,
  getMe,
};
