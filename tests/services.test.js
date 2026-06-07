const request = require('supertest');
const app = require('../src/app');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');
const { seedUsers, authHeader } = require('./helpers/auth');

describe('services', () => {
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

  it('lists services publicly', async () => {
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('admin creates service', async () => {
    const res = await request(app)
      .post('/api/services')
      .set(authHeader('admin'))
      .send({
        name: 'Corte',
        description: 'Corte masculino',
        durationMinutes: 30,
        priceCents: 5000
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Corte');
  });

  it('client cannot create service', async () => {
    const res = await request(app)
      .post('/api/services')
      .set(authHeader('client'))
      .send({
        name: 'X',
        durationMinutes: 30,
        priceCents: 1000
      });
    expect(res.status).toBe(403);
  });
});
