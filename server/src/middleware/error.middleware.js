// @desc    Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user ? req.user._id : 'unauthenticated',
  })

  // Default status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode
  let message = err.message

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors).map(val => val.message).join(', ')
  } else if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid ID format'
  } else if (err.code === 11000) {
    statusCode = 400
    message = 'Duplicate field value entered'
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  } else if (err.name === 'MulterError') {
    statusCode = 400
    message = err.message
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    timestamp: new Date().toISOString(),
  })
}

// @desc    404 Not Found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

// @desc    Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// @desc    Request validation error formatter
export const validationErrorFormatter = (req, res, next) => {
  const oldSend = res.send
  
  res.send = function(data) {
    if (res.statusCode === 400 && data && data.errors) {
      // Format validation errors
      const formattedErrors = {}
      data.errors.forEach(error => {
        if (!formattedErrors[error.param]) {
          formattedErrors[error.param] = []
        }
        formattedErrors[error.param].push(error.msg)
      })
      
      data = {
        success: false,
        error: 'Validation failed',
        errors: formattedErrors,
      }
    }
    
    oldSend.call(this, data)
  }
  
  next()
}
