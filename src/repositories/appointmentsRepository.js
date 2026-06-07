const { query } = require('../config/db');

async function findById(id) {
  const { rows } = await query(
    `SELECT a.*, s.name AS service_name, s.price_cents, u.name AS client_name,
            pu.name AS professional_name
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN users u ON u.id = a.client_id
     JOIN professionals p ON p.id = a.professional_id
     JOIN users pu ON pu.id = p.user_id
     WHERE a.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findOverlapping(professionalId, startsAt, endsAt, excludeId) {
  const { rows } = await query(
    `SELECT id FROM appointments
     WHERE professional_id = $1
       AND status IN ('pending_payment', 'confirmed')
       AND starts_at < $3 AND ends_at > $2
       AND ($4::uuid IS NULL OR id <> $4)`,
    [professionalId, startsAt, endsAt, excludeId || null]
  );
  return rows;
}

async function create({ clientId, professionalId, serviceId, startsAt, endsAt, status }) {
  const { rows } = await query(
    `INSERT INTO appointments (client_id, professional_id, service_id, starts_at, ends_at, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [clientId, professionalId, serviceId, startsAt, endsAt, status || 'pending_payment']
  );
  return rows[0];
}

async function updateStatus(id, status) {
  const { rows } = await query(
    'UPDATE appointments SET status = $2 WHERE id = $1 RETURNING *',
    [id, status]
  );
  return rows[0];
}

async function listForUser(user, filters = {}) {
  let sql = `
    SELECT a.*, s.name AS service_name, s.price_cents,
           pu.name AS professional_name, cu.name AS client_name
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    JOIN professionals p ON p.id = a.professional_id
    JOIN users pu ON pu.id = p.user_id
    JOIN users cu ON cu.id = a.client_id
    WHERE 1=1
  `;
  const params = [];
  if (user.role === 'client') {
    params.push(user.id);
    sql += ` AND a.client_id = $${params.length}`;
  } else if (user.role === 'professional') {
    params.push(user.id);
    sql += ` AND p.user_id = $${params.length}`;
  }
  if (filters.status) {
    params.push(filters.status);
    sql += ` AND a.status = $${params.length}`;
  }
  sql += ' ORDER BY a.starts_at DESC';
  const { rows } = await query(sql, params);
  return rows;
}

async function listByProfessionalAndDate(professionalId, dateStr) {
  const { rows } = await query(
    `SELECT starts_at, ends_at, status FROM appointments
     WHERE professional_id = $1
       AND starts_at::date = $2::date
       AND status IN ('pending_payment', 'confirmed')`,
    [professionalId, dateStr]
  );
  return rows;
}

module.exports = {
  findById,
  findOverlapping,
  create,
  updateStatus,
  listForUser,
  listByProfessionalAndDate
};
