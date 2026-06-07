const env = require('./env');

function parseCorsOrigins(value) {
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function isLocalhostOrigin(origin) {
  return /^https?:\/\/localhost(:\d+)?$/.test(origin)
    || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
}

function resolveCorsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  const allowed = parseCorsOrigins(env.corsOrigin);
  if (allowed.includes(origin)) {
    callback(null, origin);
    return;
  }

  if (env.nodeEnv === 'development' && isLocalhostOrigin(origin)) {
    callback(null, origin);
    return;
  }

  callback(new Error(`CORS blocked: ${origin}`));
}

module.exports = {
  corsOptions: {
    origin: resolveCorsOrigin,
    credentials: true
  }
};
