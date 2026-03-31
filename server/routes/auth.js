const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/mailer');

const router = express.Router();

// Generate a random 6-digit numeric verification code.
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a verification expiration date based on environment settings.
function getVerificationExpiration() {
  const ttlMinutes = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10);
  return new Date(Date.now() + ttlMinutes * 60 * 1000);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isInstitutionalEmail(email) {
  const domain = (process.env.INSTITUTIONAL_EMAIL_DOMAIN || 'cit.edu').trim().toLowerCase();
  return normalizeEmail(email).endsWith(`@${domain}`);
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    if (!isInstitutionalEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please use your institutional Outlook email (e.g., name@cit.edu).' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();
    const expiresAt = getVerificationExpiration();

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'user',
      verified: false,
      verification: {
        code: verificationCode,
        expiresAt,
      },
    });

    try {
      await sendVerificationEmail(user.email, user.name, verificationCode);
    } catch (mailError) {
      await User.deleteOne({ _id: user._id });
      return res.status(502).json({
        message: `Registration failed because verification email could not be delivered: ${mailError.message}`,
      });
    }

    res.status(201).json({
      message: 'User registered successfully. Verification code sent to email.',
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !code) {
      return res.status(400).json({ message: 'Please provide email and verification code.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.verified) {
      return res.status(200).json({ message: 'User already verified.' });
    }

    if (!user.verification || user.verification.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (user.verification.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired.' });
    }

    user.verified = true;
    user.verification = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully.', email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
});

// Resend a new verification code (primarily used after expiry).
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Please provide email.' });
    }

    if (!isInstitutionalEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please use your institutional Outlook email (e.g., name@cit.edu).' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.verified) {
      return res.status(200).json({ message: 'User already verified.' });
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = getVerificationExpiration();

    user.verification = {
      code: verificationCode,
      expiresAt,
    };

    await user.save();

    await sendVerificationEmail(user.email, user.name, verificationCode);

    res.status(200).json({
      message: 'Verification code resent to email.',
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ message: `Could not deliver verification email: ${error.message}` });
  }
});

router.post('/login', async (req, res) => {
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

    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
