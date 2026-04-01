const jwt = require('jsonwebtoken');

const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'peermatch_token';

function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET ||
    'development-only-secret-min-32-characters-long-do-not-use-in-prod';
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  ) {
    throw new Error('JWT_SECRET must be set to a strong value (32+ characters) in production.');
  }
  return secret;
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

function getCookieBaseOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSiteRaw = (process.env.JWT_COOKIE_SAMESITE || (isProd ? 'none' : 'lax')).toLowerCase();
  const sameSite =
    sameSiteRaw === 'none' ? 'none' : sameSiteRaw === 'strict' ? 'strict' : 'lax';
  const secure =
    process.env.JWT_COOKIE_SECURE === 'true' || (sameSite === 'none' ? true : isProd);
  const domain = process.env.COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge: parseInt(process.env.JWT_COOKIE_MAX_AGE_MS || String(7 * 24 * 60 * 60 * 1000), 10),
  };
}

function attachAccessTokenCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getCookieBaseOptions());
}

function clearAccessTokenCookie(res) {
  const base = getCookieBaseOptions();
  res.clearCookie(COOKIE_NAME, {
    path: base.path,
    domain: base.domain,
    sameSite: base.sameSite,
    secure: base.secure,
  });
}

/** @param {{ _id: unknown, role: string }} user */
function signAccessToken(user) {
  const payload = {
    userId: String(user._id),
    role: user.role,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiresIn() });
}

function extractToken(req) {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

function authMiddleware(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const decoded = jwt.verify(token, getJwtSecret());
    const userId = decoded.userId || decoded.sub;
    if (!userId || !decoded.role) {
      return res.status(401).json({ message: 'Invalid or expired session.' });
    }
    req.user = {
      userId: String(userId),
      role: decoded.role,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  return next();
}

module.exports = {
  COOKIE_NAME,
  authMiddleware,
  requireAdmin,
  signAccessToken,
  attachAccessTokenCookie,
  clearAccessTokenCookie,
  extractToken,
};
