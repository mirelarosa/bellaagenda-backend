const { Pool } = require('pg');
const env = require('./env');

let pool;

function getPool() {
  if (!pool) {
    if (!env.databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }
    pool = new Pool({
      connectionString: env.databaseUrl,
      max: env.nodeEnv === 'production' ? 2 : 10
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, closePool };
