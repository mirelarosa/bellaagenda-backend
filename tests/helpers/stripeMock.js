let lastSession = null;

function createMockStripe() {
  return {
    checkout: {
      sessions: {
        async create(params) {
          lastSession = {
            id: 'cs_test_mock',
            payment_status: 'paid',
            payment_intent: 'pi_test',
            metadata: params.metadata || {}
          };
          return {
            id: lastSession.id,
            url: 'https://checkout.stripe.com/mock-session'
          };
        },
        async retrieve(sessionId) {
          if (!lastSession || lastSession.id !== sessionId) {
            throw new Error('Session not found');
          }
          return { ...lastSession, id: sessionId };
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

function resetMockStripe() {
  lastSession = null;
}

module.exports = { createMockStripe, resetMockStripe };
