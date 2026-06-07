const express = require('express');
const createError = require('http-errors');
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');
const professionalsRepo = require('../repositories/professionalsRepository');
const usersRepo = require('../repositories/usersRepository');
const availabilityService = require('../services/availabilityService');

const router = express.Router();

function mapProfessional(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    specialties: row.specialties,
    active: row.active
  };
}

router.get('/', authenticate, requireAuth, async (req, res, next) => {
  try {
    const rows = await professionalsRepo.findAll(true);
    res.json({ data: rows.map(mapProfessional) });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { firebaseUid, email, name, phone, specialties } = req.body;
    if (!firebaseUid || !email || !name) {
      throw createError(400, 'Missing required fields', { code: 'VALIDATION' });
    }
    let user = await usersRepo.findByFirebaseUid(firebaseUid);
    if (!user) {
      user = await usersRepo.create({
        firebaseUid,
        email,
        name,
        role: 'professional',
        phone
      });
    }
    let prof = await professionalsRepo.findByUserId(user.id);
    if (!prof) {
      prof = await professionalsRepo.create({ userId: user.id, specialties: specialties || [] });
    }
    const full = await professionalsRepo.findById(prof.id);
    res.status(201).json({ data: mapProfessional(full) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/availability', authenticate, requireAuth, async (req, res, next) => {
  try {
    const { date, serviceId } = req.query;
    if (!date || !serviceId) {
      throw createError(400, 'date and serviceId are required', { code: 'VALIDATION' });
    }
    const slots = await availabilityService.getAvailableSlots(
      req.params.id,
      serviceId,
      date
    );
    res.json({ data: slots });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/schedule', authenticate, requireAuth, async (req, res, next) => {
  try {
    const prof = await professionalsRepo.findById(req.params.id);
    if (!prof) {
      throw createError(404, 'Professional not found', { code: 'NOT_FOUND' });
    }
    if (req.user.role === 'professional') {
      const own = await professionalsRepo.findByUserId(req.user.id);
      if (!own || own.id !== prof.id) {
        throw createError(403, 'Forbidden', { code: 'FORBIDDEN' });
      }
    } else if (req.user.role !== 'admin') {
      throw createError(403, 'Forbidden', { code: 'FORBIDDEN' });
    }
    const slots = await professionalsRepo.replaceAvailabilitySlots(
      req.params.id,
      req.body.slots || []
    );
    res.json({ data: slots });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
