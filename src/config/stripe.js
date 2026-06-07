const Stripe = require('stripe');
const env = require('./env');

let stripeClient;

function getStripe() {
  if (!stripeClient) {
    if (env.nodeEnv === 'test') {
      const { createMockStripe } = require('../../tests/helpers/stripeMock');
      stripeClient = createMockStripe();
      return stripeClient;
    }
    if (!env.stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

module.exports = { getStripe };
