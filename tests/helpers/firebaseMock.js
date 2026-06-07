const testUsers = new Map();

function registerTestUser(token, payload) {
  testUsers.set(token, payload);
}

function clearTestUsers() {
  testUsers.clear();
}

async function mockVerifyIdToken(token) {
  if (!token || token === 'invalid') {
    const err = new Error('Invalid token');
    err.code = 'auth/invalid-id-token';
    throw err;
  }
  const user = testUsers.get(token);
  if (!user) {
    return {
      uid: 'test-uid-default',
      email: 'default@test.com',
      name: 'Test User'
    };
  }
  return user;
}

module.exports = { registerTestUser, clearTestUsers, mockVerifyIdToken };
