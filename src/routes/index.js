const express = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const servicesRouter = require('./services');
const professionalsRouter = require('./professionals');
const appointmentsRouter = require('./appointments');
const paymentsRouter = require('./payments');
const reviewsRouter = require('./reviews');
const reportsRouter = require('./reports');

const router = express.Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/services', servicesRouter);
router.use('/professionals', professionalsRouter);
router.use('/appointments', appointmentsRouter);
router.use('/payments', paymentsRouter);
router.use('/reviews', reviewsRouter);
router.use('/reports', reportsRouter);

module.exports = router;
