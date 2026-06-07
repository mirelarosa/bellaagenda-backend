const { query } = require('../config/db');

async function findAll(activeOnly = true) {
  const sql = `SELECT * FROM services ${activeOnly ? 'WHERE active = TRUE' : ''} ORDER BY name`;
  const { rows } = await query(sql);
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM services WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ name, description, durationMinutes, priceCents }) {
  const { rows } = await query(
    `INSERT INTO services (name, description, duration_minutes, price_cents)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, description || null, durationMinutes, priceCents]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await query(
    `UPDATE services SET
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      duration_minutes = COALESCE($4, duration_minutes),
      price_cents = COALESCE($5, price_cents),
      active = COALESCE($6, active)
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.name,
      data.description,
      data.durationMinutes,
      data.priceCents,
      data.active
    ]
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await query(
    'UPDATE services SET active = FALSE WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0];
}

module.exports = { findAll, findById, create, update, remove };
