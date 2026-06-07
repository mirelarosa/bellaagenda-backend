require('dotenv').config();

function getEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

module.exports = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: parseInt(getEnv('PORT', '3000'), 10),
  databaseUrl: getEnv('DATABASE_URL', ''),
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
  firebaseProjectId: getEnv('FIREBASE_PROJECT_ID', ''),
  firebaseClientEmail: getEnv('FIREBASE_CLIENT_EMAIL', ''),
  firebasePrivateKey: getEnv('FIREBASE_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
  stripeSecretKey: getEnv('STRIPE_SECRET_KEY', ''),
  stripeWebhookSecret: getEnv('STRIPE_WEBHOOK_SECRET', ''),
  stripeSuccessUrl: getEnv('STRIPE_SUCCESS_URL', 'http://localhost:5173/pagamento/sucesso'),
  stripeCancelUrl: getEnv('STRIPE_CANCEL_URL', 'http://localhost:5173/pagamento/cancelado')
};
