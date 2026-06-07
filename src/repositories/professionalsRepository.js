const { query } = require('../config/db');

async function findAll(activeOnly = true) {
  const sql = `
    SELECT p.*, u.name, u.email, u.phone
    FROM professionals p
    JOIN users u ON u.id = p.user_id
    ${activeOnly ? 'WHERE p.active = TRUE' : ''}
    ORDER BY u.name
  `;
  const { rows } = await query(sql);
  return rows;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT p.*, u.name, u.email, u.phone, u.firebase_uid
     FROM professionals p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByUserId(userId) {
  const { rows } = await query('SELECT * FROM professionals WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function create({ userId, specialties }) {
  const { rows } = await query(
    `INSERT INTO professionals (user_id, specialties)
     VALUES ($1, $2::jsonb)
     RETURNING *`,
    [userId, JSON.stringify(specialties || [])]
  );
  return rows[0];
}

async function getAvailabilitySlots(professionalId) {
  const { rows } = await query(
    'SELECT * FROM availability_slots WHERE professional_id = $1 ORDER BY weekday, start_time',
    [professionalId]
  );
  return rows;
}

async function replaceAvailabilitySlots(professionalId, slots) {
  await query('DELETE FROM availability_slots WHERE professional_id = $1', [professionalId]);
  for (const slot of slots) {
    await query(
      `INSERT INTO availability_slots (professional_id, weekday, start_time, end_time)
       VALUES ($1, $2, $3, $4)`,
      [professionalId, slot.weekday, slot.startTime, slot.endTime]
    );
  }
  return getAvailabilitySlots(professionalId);
}

async function linkService(professionalId, serviceId) {
  await query(
    `INSERT INTO professional_services (professional_id, service_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [professionalId, serviceId]
  );
}

module.exports = {
  findAll,
  findById,
  findByUserId,
  create,
  getAvailabilitySlots,
  replaceAvailabilitySlots,
  linkService
};
