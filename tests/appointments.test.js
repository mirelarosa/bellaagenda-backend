const request = require('supertest');
const app = require('../src/app');
const servicesRepo = require('../src/repositories/servicesRepository');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');
const { seedUsers, authHeader } = require('./helpers/auth');

describe('appointments', () => {
  let service;
  let professional;

  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await truncateAll();
    const seeded = await seedUsers();
    professional = seeded.professional;
    service = await servicesRepo.create({
      name: 'Manicure',
      durationMinutes: 60,
      priceCents: 8000
    });
  });

  afterAll(async () => {
    await closePool();
  });

  it('client creates appointment', async () => {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 7);
    while (future.getUTCDay() === 0 || future.getUTCDay() === 6) {
      future.setUTCDate(future.getUTCDate() + 1);
    }
    future.setUTCHours(10, 0, 0, 0);
    const res = await request(app)
      .post('/api/appointments')
      .set(authHeader('client'))
      .send({
        professionalId: professional.id,
        serviceId: service.id,
        startsAt: future.toISOString()
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending_payment');
  });

  it('returns availability slots for a weekday with schedule', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    while (future.getDay() === 0 || future.getDay() === 6) {
      future.setDate(future.getDate() + 1);
    }
    const date = future.toISOString().slice(0, 10);
    const res = await request(app)
      .get('/api/appointments/availability')
      .query({
        professionalId: professional.id,
        serviceId: service.id,
        date
      })
      .set(authHeader('client'));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('startsAt');
  });

  it('professional completes appointment after it ends', async () => {
    const past = new Date();
    past.setUTCMinutes(past.getUTCMinutes() - 120);
    const ends = new Date(past.getTime() + 60 * 60000);
    const created = await request(app)
      .post('/api/appointments')
      .set(authHeader('client'))
      .send({
        professionalId: professional.id,
        serviceId: service.id,
        startsAt: past.toISOString()
      });
    await request(app)
      .patch(`/api/appointments/${created.body.data.id}/confirm`)
      .set(authHeader('professional'));
    const res = await request(app)
      .patch(`/api/appointments/${created.body.data.id}/complete`)
      .set(authHeader('professional'));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  it('rejects completing appointment before it ends', async () => {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 2);
    future.setUTCHours(14, 0, 0, 0);
    const created = await request(app)
      .post('/api/appointments')
      .set(authHeader('client'))
      .send({
        professionalId: professional.id,
        serviceId: service.id,
        startsAt: future.toISOString()
      });
    await request(app)
      .patch(`/api/appointments/${created.body.data.id}/confirm`)
      .set(authHeader('professional'));
    const res = await request(app)
      .patch(`/api/appointments/${created.body.data.id}/complete`)
      .set(authHeader('professional'));
    expect(res.status).toBe(400);
  });

  it('professional confirms appointment', async () => {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 7);
    while (future.getUTCDay() === 0 || future.getUTCDay() === 6) {
      future.setUTCDate(future.getUTCDate() + 1);
    }
    future.setUTCHours(11, 0, 0, 0);
    const created = await request(app)
      .post('/api/appointments')
      .set(authHeader('client'))
      .send({
        professionalId: professional.id,
        serviceId: service.id,
        startsAt: future.toISOString()
      });
    const res = await request(app)
      .patch(`/api/appointments/${created.body.data.id}/confirm`)
      .set(authHeader('professional'));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });
});
