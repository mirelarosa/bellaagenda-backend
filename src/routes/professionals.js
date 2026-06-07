const express = require('express');
const createError = require('http-errors');
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');
const professionalsRepo = require('../repositories/professionalsRepository');
const availabilityService = require('../services/availabilityService');
const professionalsService = require('../services/professionalsService');

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

function formatTimeValue(time) {
  return time ? String(time).slice(0, 5) : '';
}

function mapAvailabilitySlot(row) {
  return {
    id: row.id,
    weekday: row.weekday,
    startTime: formatTimeValue(row.start_time),
    endTime: formatTimeValue(row.end_time)
  };
}

function parseMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function validateScheduleSlots(slots) {
  if (!Array.isArray(slots)) {
    throw createError(400, 'slots must be an array', { code: 'VALIDATION' });
  }
  for (const slot of slots) {
    if (typeof slot.weekday !== 'number' || slot.weekday < 0 || slot.weekday > 6) {
      throw createError(400, 'Invalid weekday (0-6)', { code: 'VALIDATION' });
    }
    if (!/^\d{2}:\d{2}$/.test(slot.startTime) || !/^\d{2}:\d{2}$/.test(slot.endTime)) {
      throw createError(400, 'startTime and endTime must be HH:MM', { code: 'VALIDATION' });
    }
    if (parseMinutes(slot.startTime) >= parseMinutes(slot.endTime)) {
      throw createError(400, 'startTime must be before endTime', { code: 'VALIDATION' });
    }
  }
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
    const full = await professionalsService.registerProfessional({
      email,
      name,
      phone,
      specialties,
      firebaseUid
    });
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

router.get('/:id/schedule', authenticate, requireAuth, async (req, res, next) => {
  try {
    const prof = await professionalsRepo.findById(req.params.id);
    if (!prof) {
      throw createError(404, 'Professional not found', { code: 'NOT_FOUND' });
    }
    const slots = await professionalsRepo.getAvailabilitySlots(req.params.id);
    res.json({ data: slots.map(mapAvailabilitySlot) });
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
    const inputSlots = req.body.slots || [];
    validateScheduleSlots(inputSlots);
    const slots = await professionalsRepo.replaceAvailabilitySlots(req.params.id, inputSlots);
    res.json({ data: slots.map(mapAvailabilitySlot) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
