const nodemailer = require('nodemailer');

// Create a reusable transporter using SMTP credentials from environment variables.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a verification email containing the 6-digit code.
 * @param {string} to - Recipient email address.
 * @param {string} name - Recipient name.
 * @param {string} code - Verification code.
 */
async function sendVerificationEmail(to, name, code) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Peer Match System: Verify Your Email',
    text: `Hello ${name},\n\nYour Peer Match verification code is: ${code}\nThis code expires in ${process.env.VERIFICATION_CODE_TTL_MINUTES || 10} minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `<p>Hello ${name},</p><p>Your Peer Match verification code is: <strong>${code}</strong></p><p>This code expires in ${process.env.VERIFICATION_CODE_TTL_MINUTES || 10} minutes.</p><p>If you did not request this, please ignore this email.</p>`,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
