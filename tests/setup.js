require('dotenv').config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL || 'postgresql://bella:bella@127.0.0.1:5432/bellaagenda_test';

if (process.env.ALLOW_DEV_DB_TESTS !== '1') {
  process.env.DATABASE_URL = testDatabaseUrl;
}
