/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
