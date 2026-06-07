const createError = require('http-errors');

function notFoundHandler(req, res, next) {
  next(createError(404, 'Resource not found'));
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  res.status(status).json({
    error: {
      message: err.message || 'Internal server error',
      code
    },
    ...(req.app.get('env') === 'development' && err.stack ? { stack: err.stack } : {})
  });
}

module.exports = { notFoundHandler, errorHandler };
