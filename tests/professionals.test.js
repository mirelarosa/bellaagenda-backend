const request = require('supertest');
const app = require('../src/app');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');
const { seedUsers, authHeader } = require('./helpers/auth');

describe('professionals schedule', () => {
  let professional;

  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await truncateAll();
    const seeded = await seedUsers();
    professional = seeded.professional;
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
