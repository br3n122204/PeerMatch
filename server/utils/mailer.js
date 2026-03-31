const nodemailer = require('nodemailer');

function hasEmailConfig() {
  return Boolean(
    process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_FROM
  );
}

function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT) || 587;
  const isOffice365 = typeof host === 'string' && /office365\.com$/i.test(host);

  return nodemailer.createTransport({
    host,
    port,
    // For Office365: 587 + STARTTLS (secure=false, requireTLS=true)
    secure: port === 465,
    requireTLS: isOffice365 ? true : undefined,
    tls: isOffice365
      ? {
          // Office365 commonly requires TLSv1.2+
          minVersion: 'TLSv1.2',
        }
      : undefined,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send a verification email containing the 6-digit code.
 * @param {string} to - Recipient email address.
 * @param {string} name - Recipient name.
 * @param {string} code - Verification code.
 */
async function sendVerificationEmail(to, name, code) {
  if (!hasEmailConfig()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[MAILER] SMTP not configured. Verification code for ${to}: ${code}`);
      return { delivered: false, fallback: 'console' };
    }

    throw new Error(
      'SMTP credentials are missing. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.'
    );
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Peer Match System: Verify Your Email',
    text: `Hello ${name},\n\nYour Peer Match verification code is: ${code}\nThis code expires in ${process.env.VERIFICATION_CODE_TTL_MINUTES || 10} minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `<p>Hello ${name},</p><p>Your Peer Match verification code is: <strong>${code}</strong></p><p>This code expires in ${process.env.VERIFICATION_CODE_TTL_MINUTES || 10} minutes.</p><p>If you did not request this, please ignore this email.</p>`,
  };

  const transporter = createTransporter();
  try {
    // Verify credentials/connection to get a clear error early.
    // (In production, this is still useful; in dev it provides actionable console output.)
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    return { delivered: true };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[MAILER] Failed to send verification email to ${to}. Verification code: ${code}`);
      console.warn('[MAILER] SMTP error:', err);
      return { delivered: false, fallback: 'console', error: err && err.message ? err.message : err };
    }

    throw err;
  }
}

module.exports = { sendVerificationEmail };
