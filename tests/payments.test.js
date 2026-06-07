const request = require('supertest');
const app = require('../src/app');
const servicesRepo = require('../src/repositories/servicesRepository');
const appointmentsRepo = require('../src/repositories/appointmentsRepository');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');
const { seedUsers, authHeader } = require('./helpers/auth');

describe('payments', () => {
  let appointmentId;

  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await truncateAll();
    const { client, professional } = await seedUsers();
    const service = await servicesRepo.create({
      name: 'Escova',
      durationMinutes: 45,
      priceCents: 12000
    });
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 10);
    while (future.getUTCDay() === 0 || future.getUTCDay() === 6) {
      future.setUTCDate(future.getUTCDate() + 1);
    }
    future.setUTCHours(14, 0, 0, 0);
    const appointment = await appointmentsRepo.create({
      clientId: client.id,
      professionalId: professional.id,
      serviceId: service.id,
      startsAt: future.toISOString(),
      endsAt: new Date(future.getTime() + 45 * 60000).toISOString(),
      status: 'pending_payment'
    });
    appointmentId = appointment.id;
  });

  afterAll(async () => {
    await closePool();
  });

  it('creates checkout session', async () => {
    const res = await request(app)
      .post('/api/payments/checkout')
      .set(authHeader('client'))
      .send({ appointmentId });
    expect(res.status).toBe(200);
    expect(res.body.data.url).toContain('stripe.com');
  });

  it('handles webhook checkout completed', async () => {
    const checkout = await request(app)
      .post('/api/payments/checkout')
      .set(authHeader('client'))
      .send({ appointmentId });
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: checkout.body.data.sessionId,
          payment_intent: 'pi_test',
          metadata: { appointmentId }
        }
      }
    };
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'valid')
      .send(event);
    expect(res.status).toBe(200);
    const appointment = await appointmentsRepo.findById(appointmentId);
    expect(appointment.status).toBe('confirmed');
  });
});
