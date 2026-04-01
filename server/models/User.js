const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // Role options exposed in the frontend registration flow.
  role: { type: String, enum: ['user', 'admin', 'client', 'freelancer'], default: 'user' },
  verified: { type: Boolean, default: false },
  verification: { type: verificationSchema },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
