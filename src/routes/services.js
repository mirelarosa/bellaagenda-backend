const express = require('express');
const createError = require('http-errors');
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');
const servicesRepo = require('../repositories/servicesRepository');

const router = express.Router();

function mapService(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    active: row.active
  };
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await servicesRepo.findAll(true);
    res.json({ data: rows.map(mapService) });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, description, durationMinutes, priceCents } = req.body;
    if (!name || !durationMinutes || priceCents === undefined) {
      throw createError(400, 'Missing required fields', { code: 'VALIDATION' });
    }
    const row = await servicesRepo.create({
      name,
      description,
      durationMinutes,
      priceCents
    });
    res.status(201).json({ data: mapService(row) });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const row = await servicesRepo.update(req.params.id, {
      name: req.body.name,
      description: req.body.description,
      durationMinutes: req.body.durationMinutes,
      priceCents: req.body.priceCents,
      active: req.body.active
    });
    if (!row) {
      throw createError(404, 'Service not found', { code: 'NOT_FOUND' });
    }
    res.json({ data: mapService(row) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const row = await servicesRepo.remove(req.params.id);
    if (!row) {
      throw createError(404, 'Service not found', { code: 'NOT_FOUND' });
    }
    res.json({ data: mapService(row) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
