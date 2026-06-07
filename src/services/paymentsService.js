const createError = require('http-errors');
const { getStripe } = require('../config/stripe');
const env = require('../config/env');
const appointmentsRepo = require('../repositories/appointmentsRepository');
const paymentsRepo = require('../repositories/paymentsRepository');
const servicesRepo = require('../repositories/servicesRepository');

async function createCheckout(clientUser, appointmentId) {
  const appointment = await appointmentsRepo.findById(appointmentId);
  if (!appointment) {
    throw createError(404, 'Appointment not found', { code: 'NOT_FOUND' });
  }
  if (appointment.client_id !== clientUser.id) {
    throw createError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  if (appointment.status !== 'pending_payment') {
    throw createError(400, 'Appointment is not awaiting payment', { code: 'INVALID_STATE' });
  }
  const service = await servicesRepo.findById(appointment.service_id);
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${env.stripeSuccessUrl}?appointmentId=${appointmentId}`,
    cancel_url: `${env.stripeCancelUrl}?appointmentId=${appointmentId}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'brl',
          unit_amount: service.price_cents,
          product_data: { name: service.name }
        }
      }
    ],
    metadata: { appointmentId: String(appointmentId) }
  });
  const existing = await paymentsRepo.findByAppointmentId(appointmentId);
  if (!existing) {
    await paymentsRepo.create({
      appointmentId,
      amountCents: service.price_cents,
      stripeSessionId: session.id
    });
  }
  return { sessionId: session.id, url: session.url };
}

async function handleWebhookEvent(event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const appointmentId = session.metadata?.appointmentId;
    const payment = await paymentsRepo.findBySessionId(session.id);
    if (payment) {
      await paymentsRepo.markPaid(payment.id, session.payment_intent);
    }
    if (appointmentId) {
      await appointmentsRepo.updateStatus(appointmentId, 'confirmed');
    }
  }
}

module.exports = { createCheckout, handleWebhookEvent };
