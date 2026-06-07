const createError = require('http-errors');
const appointmentsRepo = require('../repositories/appointmentsRepository');
const servicesRepo = require('../repositories/servicesRepository');
const professionalsRepo = require('../repositories/professionalsRepository');

async function createAppointment(clientUser, payload) {
  const { professionalId, serviceId, startsAt } = payload;
  const service = await servicesRepo.findById(serviceId);
  if (!service || !service.active) {
    throw createError(404, 'Service not found', { code: 'NOT_FOUND' });
  }
  const professional = await professionalsRepo.findById(professionalId);
  if (!professional || !professional.active) {
    throw createError(404, 'Professional not found', { code: 'NOT_FOUND' });
  }
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + service.duration_minutes * 60000);
  const overlapping = await appointmentsRepo.findOverlapping(
    professionalId,
    start.toISOString(),
    end.toISOString()
  );
  if (overlapping.length > 0) {
    throw createError(409, 'Time slot not available', { code: 'CONFLICT' });
  }
  return appointmentsRepo.create({
    clientId: clientUser.id,
    professionalId,
    serviceId,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    status: 'pending_payment'
  });
}

async function confirmAppointment(user, appointmentId) {
  const appointment = await appointmentsRepo.findById(appointmentId);
  if (!appointment) {
    throw createError(404, 'Appointment not found', { code: 'NOT_FOUND' });
  }
  if (user.role === 'professional') {
    const prof = await professionalsRepo.findByUserId(user.id);
    if (!prof || prof.id !== appointment.professional_id) {
      throw createError(403, 'Forbidden', { code: 'FORBIDDEN' });
    }
  }
  if (!['pending_payment', 'confirmed'].includes(appointment.status)) {
    throw createError(400, 'Cannot confirm this appointment', { code: 'INVALID_STATE' });
  }
  return appointmentsRepo.updateStatus(appointmentId, 'confirmed');
}

async function cancelAppointment(user, appointmentId) {
  const appointment = await appointmentsRepo.findById(appointmentId);
  if (!appointment) {
    throw createError(404, 'Appointment not found', { code: 'NOT_FOUND' });
  }
  if (user.role === 'client' && appointment.client_id !== user.id) {
    throw createError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  if (user.role === 'professional') {
    const prof = await professionalsRepo.findByUserId(user.id);
    if (!prof || prof.id !== appointment.professional_id) {
      throw createError(403, 'Forbidden', { code: 'FORBIDDEN' });
    }
  }
  if (appointment.status === 'cancelled') {
    throw createError(400, 'Already cancelled', { code: 'INVALID_STATE' });
  }
  return appointmentsRepo.updateStatus(appointmentId, 'cancelled');
}

async function completeAppointment(appointmentId) {
  return appointmentsRepo.updateStatus(appointmentId, 'completed');
}

module.exports = {
  createAppointment,
  confirmAppointment,
  cancelAppointment,
  completeAppointment
};
