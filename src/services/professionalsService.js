const createError = require('http-errors');
const usersRepo = require('../repositories/usersRepository');
const professionalsRepo = require('../repositories/professionalsRepository');

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isPlaceholderFirebaseUid(firebaseUid) {
  return !firebaseUid || firebaseUid.startsWith('pending:') || firebaseUid.startsWith('uid-');
}

async function registerProfessional({ email, name, phone, specialties, firebaseUid }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !name) {
    throw createError(400, 'email and name are required', { code: 'VALIDATION' });
  }

  let user = await usersRepo.findByEmail(normalizedEmail);

  if (user) {
    if (user.role === 'admin') {
      throw createError(400, 'Cannot register an admin as professional', { code: 'VALIDATION' });
    }
    user = await usersRepo.update(user.id, {
      name,
      phone: phone ?? user.phone,
      role: 'professional'
    });
  } else {
    const uid = firebaseUid && !isPlaceholderFirebaseUid(firebaseUid)
      ? firebaseUid
      : `pending:${normalizedEmail}`;
    user = await usersRepo.create({
      firebaseUid: uid,
      email: normalizedEmail,
      name,
      role: 'professional',
      phone
    });
  }

  let professional = await professionalsRepo.findByUserId(user.id);
  if (!professional) {
    professional = await professionalsRepo.create({
      userId: user.id,
      specialties: specialties || []
    });
  }

  return professionalsRepo.findById(professional.id);
}

module.exports = { registerProfessional, normalizeEmail, isPlaceholderFirebaseUid };
