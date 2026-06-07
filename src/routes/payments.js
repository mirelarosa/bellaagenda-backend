const express = require('express');
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');
const paymentsService = require('../services/paymentsService');
const { getStripe } = require('../config/stripe');
const env = require('../config/env');

const router = express.Router();

router.post('/checkout', authenticate, requireAuth, requireRole('client'), async (req, res, next) => {
  try {
    const result = await paymentsService.createCheckout(req.user, req.body.appointmentId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    const stripe = getStripe();
    const signature = req.headers['stripe-signature'];
    let event;
    if (env.nodeEnv === 'test' && req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      event = req.body;
    } else {
      const payload = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.stripeWebhookSecret
      );
    }
    await paymentsService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
