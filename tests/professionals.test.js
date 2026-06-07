const request = require('supertest');
const app = require('../src/app');
const usersRepo = require('../src/repositories/usersRepository');
const professionalsRepo = require('../src/repositories/professionalsRepository');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');
const { seedUsers, authHeader } = require('./helpers/auth');

describe('professionals schedule', () => {
  let professional;
  let client;

  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await truncateAll();
    const seeded = await seedUsers();
    professional = seeded.professional;
    client = seeded.client;
  });

  afterAll(async () => {
    await closePool();
  });

  it('returns schedule for a professional', async () => {
    const res = await request(app)
      .get(`/api/professionals/${professional.id}/schedule`)
      .set(authHeader('client'));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(5);
    expect(res.body.data[0]).toMatchObject({
      weekday: expect.any(Number),
      startTime: '09:00',
      endTime: '18:00'
    });
  });

  it('professional updates own schedule', async () => {
    const res = await request(app)
      .put(`/api/professionals/${professional.id}/schedule`)
      .set(authHeader('professional'))
      .send({
        slots: [
          { weekday: 2, startTime: '10:00', endTime: '16:00' },
          { weekday: 6, startTime: '08:00', endTime: '12:00' }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[1]).toMatchObject({
      weekday: 6,
      startTime: '08:00',
      endTime: '12:00'
    });
  });

  it('promotes existing client to professional without duplicating email', async () => {
    const res = await request(app)
      .post('/api/professionals')
      .set(authHeader('admin'))
      .send({
        email: client.email,
        name: 'Cliente Promovido'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(client.email);
    const updated = await usersRepo.findById(client.id);
    expect(updated.role).toBe('professional');
    const professional = await professionalsRepo.findByUserId(client.id);
    expect(professional).toBeTruthy();
    const allUsers = await usersRepo.findByEmail(client.email);
    expect(allUsers.id).toBe(client.id);
  });

  it('pre-registers professional by email for first login', async () => {
    const res = await request(app)
      .post('/api/professionals')
      .set(authHeader('admin'))
      .send({
        email: 'novo.pro@salao.com',
        name: 'Novo Profissional'
      });
    expect(res.status).toBe(201);
    const user = await usersRepo.findByEmail('novo.pro@salao.com');
    expect(user.role).toBe('professional');
    expect(user.firebase_uid).toBe('pending:novo.pro@salao.com');
  });

  it('rejects invalid schedule', async () => {
    const res = await request(app)
      .put(`/api/professionals/${professional.id}/schedule`)
      .set(authHeader('professional'))
      .send({
        slots: [{ weekday: 1, startTime: '18:00', endTime: '09:00' }]
      });
    expect(res.status).toBe(400);
  });
});
