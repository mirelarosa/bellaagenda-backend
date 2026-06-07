const request = require('supertest');
const app = require('../src/app');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');
const { seedUsers, authHeader, TOKENS } = require('./helpers/auth');
const { clearTestUsers, registerTestUser } = require('./helpers/firebaseMock');

describe('auth', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    clearTestUsers();
    await truncateAll();
  });

  afterAll(async () => {
    await closePool();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('syncs new user', async () => {
    registerTestUser('new-token', {
      uid: 'uid-new',
      email: 'new@test.com',
      name: 'New User'
    });
    const res = await request(app)
      .post('/api/auth/sync')
      .set('Authorization', 'Bearer new-token')
      .send({ role: 'client', name: 'New User' });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('client');
  });

  it('returns me for existing user', async () => {
    await seedUsers();
    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader('client'));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('client@test.com');
  });
});
