const createError = require('http-errors');
const usersRepo = require('../repositories/usersRepository');
const professionalsRepo = require('../repositories/professionalsRepository');

const VALID_ROLES = ['client', 'professional', 'admin'];

async function syncUser(firebaseUser, body) {
  const existing = await usersRepo.findByFirebaseUid(firebaseUser.uid);
  if (existing) {
    return existing;
  }
  const role = body.role || 'client';
  if (!VALID_ROLES.includes(role)) {
    throw createError(400, 'Invalid role', { code: 'INVALID_ROLE' });
  }
  const user = await usersRepo.create({
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || body.email,
    name: body.name || firebaseUser.name || 'User',
    role,
    phone: body.phone
  });
  if (role === 'professional') {
    await professionalsRepo.create({ userId: user.id, specialties: body.specialties || [] });
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
