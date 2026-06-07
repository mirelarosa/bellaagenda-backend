require('dotenv').config();
const { Pool } = require('pg');

const maxAttempts = 30;
const delayMs = 1000;

async function waitForDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      await pool.end();
      console.log('PostgreSQL is ready');
      process.exit(0);
    } catch (err) {
      console.log(`Waiting for PostgreSQL (${attempt}/${maxAttempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  await pool.end();
  console.error('PostgreSQL did not become ready in time');
  process.exit(1);
}

waitForDatabase();
