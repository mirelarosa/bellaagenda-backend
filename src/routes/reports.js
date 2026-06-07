const express = require('express');
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');
const reportsService = require('../services/reportsService');

const router = express.Router();

router.get('/summary', authenticate, requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const data = await reportsService.getSummary();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
