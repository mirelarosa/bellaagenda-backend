const request = require('supertest');
const app = require('../src/app');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');
const { seedUsers, authHeader, TOKENS } = require('./helpers/auth');
const { clearTestUsers, registerTestUser } = require('./helpers/firebaseMock');
const usersRepo = require('../src/repositories/usersRepository');
const professionalsRepo = require('../src/repositories/professionalsRepository');

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

  it('keeps professional role on first login after admin pre-registration', async () => {
    await usersRepo.create({
      firebaseUid: 'pending:novo.pro@salao.com',
      email: 'novo.pro@salao.com',
      name: 'Novo Profissional',
      role: 'professional'
    });
    await professionalsRepo.create({
      userId: (await usersRepo.findByEmail('novo.pro@salao.com')).id,
      specialties: []
    });
    registerTestUser('pro-new-token', {
      uid: 'uid-real-pro',
      email: 'novo.pro@salao.com',
      name: 'Novo Profissional'
    });
    const res = await request(app)
      .post('/api/auth/sync')
      .set('Authorization', 'Bearer pro-new-token')
      .send({ role: 'client', name: 'Novo Profissional' });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('professional');
    const user = await usersRepo.findByFirebaseUid('uid-real-pro');
    expect(user.email).toBe('novo.pro@salao.com');
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
