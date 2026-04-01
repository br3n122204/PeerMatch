const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const { sendVerificationEmail } = require('../utils/mailer');
const { authMiddleware, signAccessToken, attachAccessTokenCookie } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

const REGISTER_ACCOUNT_TYPES = ['client', 'freelancer'];

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
    const { name, email, password, role: registrationPersona } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    if (String(registrationPersona || '').toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be created through public registration.' });
    }

    const persona = String(registrationPersona || '').toLowerCase();
    const accountType = REGISTER_ACCOUNT_TYPES.includes(persona) ? persona : undefined;

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

    // IMPORTANT: Do not create a real `User` until verification succeeds.
    // If the user tries to register again with the same email, rotate the code and resend.
    let pending = await PendingRegistration.findOne({ email: normalizedEmail });

    if (pending) {
      pending.name = name;
      pending.password = hashedPassword;
      pending.accountType = accountType;
      pending.verification = { code: verificationCode, expiresAt };
      await pending.save();
    } else {
      pending = await PendingRegistration.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        ...(accountType ? { accountType } : {}),
        verification: { code: verificationCode, expiresAt },
      });
    }

    try {
      await sendVerificationEmail(pending.email, pending.name, verificationCode);
    } catch (mailError) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(502).json({
        message: `Registration failed because verification email could not be delivered: ${mailError.message}`,
      });
    }

    return res.status(201).json({
      message: 'Verification code sent to email. Enter the code to create your account.',
      email: pending.email,
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

    const alreadyUser = await User.findOne({ email: normalizedEmail });
    if (alreadyUser) {
      return res.status(409).json({ message: 'Email is already registered. Please log in.', email: normalizedEmail });
    }

    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ message: 'No pending registration found. Please register again.' });
    }

    if (!pending.verification || pending.verification.code !== String(code)) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (pending.verification.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired.' });
    }

    const createdUser = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: 'user',
      ...(pending.accountType ? { accountType: pending.accountType } : {}),
      verified: true,
      createdAt: new Date(),
    });

    await PendingRegistration.deleteOne({ _id: pending._id });

    // Log the user in immediately so they can complete their profile.
    const token = signAccessToken(createdUser);
    attachAccessTokenCookie(res, token);

    return res.json({
      message: 'Email verified successfully. Account created.',
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        ...(createdUser.accountType ? { accountType: createdUser.accountType } : {}),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
});

router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const { course, yearLevel, aboutMe, skills, photoDataUrl } = req.body || {};

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Please verify your email before completing your profile.' });
    }

    const courseStr = String(course || '').trim();
    const yearLevelStr = String(yearLevel || '').trim();
    const aboutMeStr = String(aboutMe || '').trim();
    const skillsStr = String(skills || '').trim();
    const photoStr = typeof photoDataUrl === 'string' ? photoDataUrl : undefined;

    if (!courseStr || !yearLevelStr || !aboutMeStr) {
      return res.status(400).json({ message: 'Please complete all required fields.' });
    }

    if (user.accountType === 'freelancer' && !skillsStr) {
      return res.status(400).json({ message: 'Please provide your skills.' });
    }

    user.course = courseStr;
    user.yearLevel = yearLevelStr;
    user.aboutMe = aboutMeStr;
    if (user.accountType === 'freelancer') {
      user.skills = skillsStr;
    }
    if (photoStr) {
      user.photoDataUrl = photoStr;
    }
    user.profileCompleted = true;

    await user.save();

    return res.json({
      message: 'Profile saved.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        ...(user.accountType ? { accountType: user.accountType } : {}),
        ...(user.course ? { course: user.course } : {}),
        ...(user.yearLevel ? { yearLevel: user.yearLevel } : {}),
        ...(user.aboutMe ? { aboutMe: user.aboutMe } : {}),
        ...(user.skills ? { skills: user.skills } : {}),
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error saving profile.' });
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

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(200).json({ message: 'User already verified.', email: normalizedEmail });
    }

    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ message: 'No pending registration found. Please register again.' });
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = getVerificationExpiration();

    pending.verification = { code: verificationCode, expiresAt };
    await pending.save();

    await sendVerificationEmail(pending.email, pending.name, verificationCode);

    res.status(200).json({
      message: 'Verification code resent to email.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ message: `Could not deliver verification email: ${error.message}` });
  }
});

router.post('/login', (req, res) => void authController.login(req, res));

router.post('/logout', (req, res) => authController.logout(req, res));

router.get('/me', authMiddleware, (req, res) => void authController.getMe(req, res));

module.exports = router;
