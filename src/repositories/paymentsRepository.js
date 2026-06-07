const { query } = require('../config/db');

async function create({ appointmentId, amountCents, stripeSessionId }) {
  const { rows } = await query(
    `INSERT INTO payments (appointment_id, amount_cents, stripe_session_id, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [appointmentId, amountCents, stripeSessionId || null]
  );
  return rows[0];
}

async function findByAppointmentId(appointmentId) {
  const { rows } = await query(
    'SELECT * FROM payments WHERE appointment_id = $1',
    [appointmentId]
  );
  return rows[0] || null;
}

async function findBySessionId(sessionId) {
  const { rows } = await query(
    'SELECT * FROM payments WHERE stripe_session_id = $1',
    [sessionId]
  );
  return rows[0] || null;
}

async function markPaid(id, paymentIntentId) {
  const { rows } = await query(
    `UPDATE payments SET status = 'paid', stripe_payment_intent_id = $2
     WHERE id = $1 RETURNING *`,
    [id, paymentIntentId || null]
  );
  return rows[0];
}

module.exports = { create, findByAppointmentId, findBySessionId, markPaid };
