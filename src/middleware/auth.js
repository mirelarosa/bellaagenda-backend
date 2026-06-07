const createError = require('http-errors');
const { verifyIdToken } = require('../config/firebase');
const usersRepo = require('../repositories/usersRepository');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw createError(401, 'Authentication required', { code: 'UNAUTHORIZED' });
    }
    const decoded = await verifyIdToken(token);
    const user = await usersRepo.findByFirebaseUid(decoded.uid);
    req.firebaseUser = decoded;
    req.user = user;
    req.authToken = token;
    next();
  } catch (err) {
    if (err.status) {
      return next(err);
    }
    next(createError(401, 'Invalid or expired token', { code: 'UNAUTHORIZED' }));
  }
}

async function authenticateOptionalUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw createError(401, 'Authentication required', { code: 'UNAUTHORIZED' });
    }
    const decoded = await verifyIdToken(token);
    req.firebaseUser = decoded;
    req.user = await usersRepo.findByFirebaseUid(decoded.uid);
    req.authToken = token;
    next();
  } catch (err) {
    if (err.status) {
      return next(err);
    }
    next(createError(401, 'Invalid or expired token', { code: 'UNAUTHORIZED' }));
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return next(createError(401, 'Authentication required', { code: 'UNAUTHORIZED' }));
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError(403, 'Insufficient permissions', { code: 'FORBIDDEN' }));
    }
    next();
  };
}

module.exports = { authenticate, authenticateOptionalUser, requireAuth, requireRole };
