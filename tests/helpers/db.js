const { resetAll, closePool } = require('./dbMock');

async function runMigrations() {
  resetAll();
}

async function truncateAll() {
  resetAll();
}

module.exports = { runMigrations, truncateAll, closePool };
