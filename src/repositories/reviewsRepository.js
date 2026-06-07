const { query } = require('../config/db');

async function create({ appointmentId, clientId, rating, comment }) {
  const { rows } = await query(
    `INSERT INTO reviews (appointment_id, client_id, rating, comment)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [appointmentId, clientId, rating, comment || null]
  );
  return rows[0];
}

async function findByAppointmentId(appointmentId) {
  const { rows } = await query(
    'SELECT * FROM reviews WHERE appointment_id = $1',
    [appointmentId]
  );
  return rows[0] || null;
}

module.exports = { create, findByAppointmentId };
