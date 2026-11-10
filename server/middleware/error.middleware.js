import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message || 'Unhandled server error'}`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server.';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
