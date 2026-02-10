import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  return env === 'development' ? 'debug' : 'warn'
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// Add colors to winston
winston.addColors(colors)

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console(),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
]

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
    }),
  ],
})

// Create a stream object for Morgan
export const stream = {
  write: (message) => {
    logger.http(message.trim())
  },
}

// @desc    Log HTTP requests
export const logHttpRequest = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    
    if (res.statusCode >= 500) {
      logger.error(message)
    } else if (res.statusCode >= 400) {
      logger.warn(message)
    } else {
      logger.http(message)
    }
  })
  
  next()
}

// @desc    Log database operations
export const logDatabase = (operation, collection, query, duration, success = true) => {
  const message = `DB ${operation} ${collection}: ${JSON.stringify(query)} ${duration}ms`
  
  if (success) {
    logger.debug(message)
  } else {
    logger.error(message)
  }
}

// @desc    Log API calls
export const logApiCall = (method, url, status, duration, data = null) => {
  const message = `API ${method} ${url} ${status} ${duration}ms`
  
  if (status >= 400) {
    logger.warn(message)
    if (data) {
      logger.debug(`Response data: ${JSON.stringify(data)}`)
    }
  } else {
    logger.info(message)
  }
}

// @desc    Log user actions
export const logUserAction = (userId, action, details = {}) => {
  logger.info(`USER ${userId} ${action}: ${JSON.stringify(details)}`)
}

// @desc    Log system events
export const logSystemEvent = (event, details = {}) => {
  logger.info(`SYSTEM ${event}: ${JSON.stringify(details)}`)
}

// @desc    Log errors with context
export const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })
}

// @desc    Log performance metrics
export const logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug' // Warn if operation takes >1s
  logger[level](`PERF ${operation}: ${duration}ms`, metadata)
}

// @desc    Create child logger with context
export const createChildLogger = (context) => {
  return {
    error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    http: (message, meta = {}) => logger.http(message, { ...context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta }),
  }
}

export default logger
