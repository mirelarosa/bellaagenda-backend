const express = require('express');
const createError = require('http-errors');
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');
const appointmentsRepo = require('../repositories/appointmentsRepository');
const reviewsRepo = require('../repositories/reviewsRepository');

const router = express.Router();

router.post('/', authenticate, requireAuth, requireRole('client'), async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    if (!appointmentId || !rating) {
      throw createError(400, 'appointmentId and rating are required', { code: 'VALIDATION' });
    }
    const appointment = await appointmentsRepo.findById(appointmentId);
    if (!appointment || appointment.client_id !== req.user.id) {
      throw createError(404, 'Appointment not found', { code: 'NOT_FOUND' });
    }
    if (appointment.status !== 'completed') {
      throw createError(400, 'Appointment must be completed', { code: 'INVALID_STATE' });
    }
    const existing = await reviewsRepo.findByAppointmentId(appointmentId);
    if (existing) {
      throw createError(409, 'Review already exists', { code: 'CONFLICT' });
    }
    const review = await reviewsRepo.create({
      appointmentId,
      clientId: req.user.id,
      rating,
      comment
    });
    res.status(201).json({ data: review });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
