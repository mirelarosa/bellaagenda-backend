const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { corsOptions } = require('./config/cors');
const apiRouter = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('env', env.nodeEnv);

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan(env.nodeEnv === 'test' ? 'tiny' : 'dev'));

app.use('/api/payments/webhook', bodyParser.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
