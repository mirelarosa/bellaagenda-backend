const admin = require('firebase-admin');
const env = require('./env');

let initialized = false;

function initFirebase() {
  if (initialized) {
    return admin;
  }
  if (env.nodeEnv === 'test' || !env.firebaseProjectId) {
    initialized = true;
    return null;
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey
      })
    });
  }
  initialized = true;
  return admin;
}

async function verifyIdToken(token) {
  if (env.nodeEnv === 'test') {
    const { mockVerifyIdToken } = require('../../tests/helpers/firebaseMock');
    return mockVerifyIdToken(token);
  }
  const firebase = initFirebase();
  if (!firebase) {
    throw new Error('Firebase is not configured');
  }
  return firebase.auth().verifyIdToken(token);
}

module.exports = { initFirebase, verifyIdToken, admin };
