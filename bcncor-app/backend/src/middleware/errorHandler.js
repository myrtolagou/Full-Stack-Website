/**
 * middleware/errorHandler.js
 *
 * Global Express error-handling middleware. Must be mounted last in app.js.
 * Responsibilities:
 *  - Catch all errors passed via next(err)
 *  - Log the error in development
 *  - Return a consistent JSON error shape: { message, ...(stack in dev) }
 *  - Map known error types to appropriate HTTP status codes
 *
 * Error shape:
 *  { message: string, stack?: string }
 *
 * TODO:
 *  - Log error to console (or a logger like winston) when NODE_ENV !== 'production'
 *  - Determine statusCode: err.statusCode || err.status || 500
 *  - res.status(statusCode).json({ message: err.message || 'Internal Server Error' })
 *  - Include err.stack only in development
 */

function errorHandler(err, req, res, next) {
  // TODO: implement
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
