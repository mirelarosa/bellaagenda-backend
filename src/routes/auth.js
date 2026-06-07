const express = require('express');
const createError = require('http-errors');
const { authenticate, authenticateOptionalUser } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

router.post('/sync', authenticateOptionalUser, async (req, res, next) => {
  try {
    if (req.user) {
      return res.json({ data: authService.serializeUser(req.user) });
    }
    const user = await authService.syncUser(req.firebaseUser, req.body);
    res.status(201).json({ data: authService.serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      throw createError(404, 'User not synced', { code: 'NOT_SYNCED' });
    }
    res.json({ data: authService.serializeUser(req.user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
