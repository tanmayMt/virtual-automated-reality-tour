const mongoose = require('mongoose');
const multer = require('multer');

/**
 * Global Express error handler (4-arg). Must be registered last.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File exceeds maximum upload size';
    } else {
      statusCode = 400;
      message = err.message || 'Upload error';
    }
    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  if (err.name === 'ValidationError' && err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const first = Object.values(err.errors)[0];
    message = first ? first.message : 'Validation failed';
  }

  if (err.name === 'CastError' && err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
