const usersRepo = require('../src/repositories/usersRepository');
const { runMigrations, truncateAll, closePool } = require('./helpers/db');

const hasDb = !!process.env.DATABASE_URL;

(hasDb ? describe : describe.skip)('database', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await closePool();
  });

  it('creates and finds user by firebase uid', async () => {
    const created = await usersRepo.create({
      firebaseUid: 'fb-123',
      email: 'a@test.com',
      name: 'Alice',
      role: 'client'
    });
    const found = await usersRepo.findByFirebaseUid('fb-123');
    expect(found.id).toBe(created.id);
    expect(found.email).toBe('a@test.com');
  });
});
