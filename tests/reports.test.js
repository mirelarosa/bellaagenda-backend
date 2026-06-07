const request = require('supertest');
const app = require('../src/app');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');
const { seedUsers, authHeader } = require('./helpers/auth');

describe('reports', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await truncateAll();
    await seedUsers();
  });

  afterAll(async () => {
    await closePool();
  });

  it('admin gets summary', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set(authHeader('admin'));
    expect(res.status).toBe(200);
    expect(res.body.data.revenue).toBeDefined();
  });

  it('client cannot access reports', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set(authHeader('client'));
    expect(res.status).toBe(403);
  });
});
