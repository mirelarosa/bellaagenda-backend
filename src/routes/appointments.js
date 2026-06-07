const express = require('express');
const createError = require('http-errors');
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');
const appointmentsRepo = require('../repositories/appointmentsRepository');
const appointmentsService = require('../services/appointmentsService');
const availabilityService = require('../services/availabilityService');

const router = express.Router();

function mapAppointment(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    professionalId: row.professional_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    professionalName: row.professional_name,
    clientName: row.client_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    priceCents: row.price_cents
  };
}

router.get('/availability', authenticate, requireAuth, async (req, res, next) => {
  try {
    const { professionalId, serviceId, date } = req.query;
    if (!professionalId || !serviceId || !date) {
      throw createError(400, 'professionalId, serviceId and date are required', {
        code: 'VALIDATION'
      });
    }
    const slots = await availabilityService.getAvailableSlots(
      professionalId,
      serviceId,
      date
    );
    res.json({ data: slots });
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, requireAuth, async (req, res, next) => {
  try {
    const rows = await appointmentsRepo.listForUser(req.user, {
      status: req.query.status
    });
    res.json({ data: rows.map(mapAppointment) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, requireAuth, async (req, res, next) => {
  try {
    const row = await appointmentsRepo.findById(req.params.id);
    if (!row) {
      throw createError(404, 'Appointment not found', { code: 'NOT_FOUND' });
    }
    res.json({ data: mapAppointment(row) });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireAuth, requireRole('client'), async (req, res, next) => {
  try {
    const row = await appointmentsService.createAppointment(req.user, req.body);
    const full = await appointmentsRepo.findById(row.id);
    res.status(201).json({ data: mapAppointment(full) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/confirm', authenticate, requireAuth, async (req, res, next) => {
  try {
    const row = await appointmentsService.confirmAppointment(req.user, req.params.id);
    const full = await appointmentsRepo.findById(row.id);
    res.json({ data: mapAppointment(full) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/cancel', authenticate, requireAuth, async (req, res, next) => {
  try {
    const row = await appointmentsService.cancelAppointment(req.user, req.params.id);
    const full = await appointmentsRepo.findById(row.id);
    res.json({ data: mapAppointment(full) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/complete', authenticate, requireAuth, async (req, res, next) => {
  try {
    const row = await appointmentsService.completeAppointment(req.user, req.params.id);
    const full = await appointmentsRepo.findById(row.id);
    res.json({ data: mapAppointment(full) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
