function createMockStripe() {
  return {
    checkout: {
      sessions: {
        async create(params) {
          return {
            id: 'cs_test_mock',
            url: 'https://checkout.stripe.com/mock-session'
          };
        }
      }
    },
    webhooks: {
      constructEvent(payload, signature, secret) {
        if (signature === 'bad-signature') {
          throw new Error('Invalid signature');
        }
        if (Buffer.isBuffer(payload)) {
          return JSON.parse(payload.toString('utf8'));
        }
        if (typeof payload === 'string') {
          return JSON.parse(payload);
        }
        return payload;
      }
    }
  };
}

module.exports = { createMockStripe };
