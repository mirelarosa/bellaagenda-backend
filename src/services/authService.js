const createError = require('http-errors');
const usersRepo = require('../repositories/usersRepository');
const professionalsRepo = require('../repositories/professionalsRepository');
const { isPlaceholderFirebaseUid } = require('./professionalsService');

const VALID_ROLES = ['client', 'professional', 'admin'];

async function ensureProfessionalRecord(userId, specialties) {
  const existing = await professionalsRepo.findByUserId(userId);
  if (!existing) {
    await professionalsRepo.create({ userId, specialties: specialties || [] });
  }
}

async function syncUser(firebaseUser, body) {
  const existingByUid = await usersRepo.findByFirebaseUid(firebaseUser.uid);
  if (existingByUid) {
    return existingByUid;
  }

  const email = (firebaseUser.email || body.email || '').trim().toLowerCase();
  if (email) {
    const existingByEmail = await usersRepo.findByEmail(email);
    if (existingByEmail) {
      let user = existingByEmail;
      if (isPlaceholderFirebaseUid(existingByEmail.firebase_uid)) {
        user = await usersRepo.update(existingByEmail.id, {
          firebaseUid: firebaseUser.uid,
          name: body.name || firebaseUser.name || existingByEmail.name
        });
      }
      if (user.role === 'professional') {
        await ensureProfessionalRecord(user.id, body.specialties);
      }
      return user;
    }
  }

  const role = body.role || 'client';
  if (!VALID_ROLES.includes(role)) {
    throw createError(400, 'Invalid role', { code: 'INVALID_ROLE' });
  }
  const user = await usersRepo.create({
    firebaseUid: firebaseUser.uid,
    email: email || `user-${firebaseUser.uid}@local`,
    name: body.name || firebaseUser.name || 'User',
    role,
    phone: body.phone
  });
  if (role === 'professional') {
    await ensureProfessionalRecord(user.id, body.specialties);
  }
  return user;
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    createdAt: user.created_at
  };
}

module.exports = { syncUser, serializeUser };
