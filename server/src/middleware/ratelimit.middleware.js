import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import redis from '../config/redis.js'

// @desc    Create rate limiter with Redis store
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Limit each IP to 100 requests per windowMs
    skipSuccessfulRequests = false,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip,
  } = options

  return rateLimit({
    store: redis
      ? new RedisStore({
          client: redis,
          prefix: 'rl:',
        })
      : undefined,
    windowMs,
    max,
    skipSuccessfulRequests,
    message,
    keyGenerator,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      })
    },
  })
}

// @desc    API rate limiter - stricter for public endpoints
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many API requests from this IP, please try again after 15 minutes',
})

// @desc    Auth rate limiter - stricter for authentication endpoints
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP
  skipSuccessfulRequests: false,
  message: 'Too many login attempts, please try again after 15 minutes',
  keyGenerator: (req) => `auth:${req.ip}:${req.body.email || 'unknown'}`,
})

// @desc    Password reset rate limiter
export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again after 1 hour',
  keyGenerator: (req) => `password-reset:${req.ip}:${req.body.email || 'unknown'}`,
})

// @desc    File upload rate limiter
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again after 1 hour',
})

// @desc    Webhook rate limiter - more generous
export const webhookLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many webhook requests',
})

// @desc    Custom rate limiter based on user ID (for logged-in users)
export const userRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per user
  keyGenerator: (req) => req.user ? `user:${req.user._id}` : req.ip,
  message: 'Too many requests from this account, please try again later',
})

// @desc    Apply different rate limits based on environment
export const dynamicRateLimit = (req, res, next) => {
  // Don't rate limit in development
  if (process.env.NODE_ENV === 'development') {
    return next()
  }

  // Apply appropriate rate limiter based on endpoint
  if (req.path.startsWith('/api/auth')) {
    return authLimiter(req, res, next)
  } else if (req.path.includes('/upload')) {
    return uploadLimiter(req, res, next)
  } else if (req.path.includes('/webhook')) {
    return webhookLimiter(req, res, next)
  } else if (req.user) {
    return userRateLimiter(req, res, next)
  } else {
    return apiLimiter(req, res, next)
  }
}
