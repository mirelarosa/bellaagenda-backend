const { query } = require('../config/db');

async function findByFirebaseUid(firebaseUid) {
  const { rows } = await query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return rows[0] || null;
}

async function create({ firebaseUid, email, name, role, phone }) {
  const { rows } = await query(
    `INSERT INTO users (firebase_uid, email, name, role, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [firebaseUid, email, name, role, phone || null]
  );
  return rows[0];
}

async function update(id, { name, phone, role, firebaseUid }) {
  const { rows } = await query(
    `UPDATE users SET
      name = COALESCE($2, name),
      phone = COALESCE($3, phone),
      role = COALESCE($4, role),
      firebase_uid = COALESCE($5, firebase_uid)
     WHERE id = $1
     RETURNING *`,
    [id, name, phone, role, firebaseUid]
  );
  return rows[0];
}

module.exports = { findByFirebaseUid, findById, findByEmail, create, update };
