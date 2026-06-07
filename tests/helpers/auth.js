const { registerTestUser } = require('./firebaseMock');
const usersRepo = require('../../src/repositories/usersRepository');
const professionalsRepo = require('../../src/repositories/professionalsRepository');

const TOKENS = {
  client: 'token-client',
  professional: 'token-professional',
  admin: 'token-admin'
};

async function seedUsers() {
  registerTestUser(TOKENS.client, {
    uid: 'uid-client',
    email: 'client@test.com',
    name: 'Client Test'
  });
  registerTestUser(TOKENS.professional, {
    uid: 'uid-professional',
    email: 'pro@test.com',
    name: 'Pro Test'
  });
  registerTestUser(TOKENS.admin, {
    uid: 'uid-admin',
    email: 'admin@test.com',
    name: 'Admin Test'
  });

  const client = await usersRepo.create({
    firebaseUid: 'uid-client',
    email: 'client@test.com',
    name: 'Client Test',
    role: 'client'
  });
  const proUser = await usersRepo.create({
    firebaseUid: 'uid-professional',
    email: 'pro@test.com',
    name: 'Pro Test',
    role: 'professional'
  });
  const admin = await usersRepo.create({
    firebaseUid: 'uid-admin',
    email: 'admin@test.com',
    name: 'Admin Test',
    role: 'admin'
  });
  const professional = await professionalsRepo.create({
    userId: proUser.id,
    specialties: ['corte']
  });
  await professionalsRepo.replaceAvailabilitySlots(professional.id, [
    { weekday: 1, startTime: '09:00', endTime: '18:00' },
    { weekday: 2, startTime: '09:00', endTime: '18:00' },
    { weekday: 3, startTime: '09:00', endTime: '18:00' },
    { weekday: 4, startTime: '09:00', endTime: '18:00' },
    { weekday: 5, startTime: '09:00', endTime: '18:00' }
  ]);
  return { client, proUser, admin, professional };
}

function authHeader(role) {
  return { Authorization: `Bearer ${TOKENS[role]}` };
}

module.exports = { seedUsers, authHeader, TOKENS };
