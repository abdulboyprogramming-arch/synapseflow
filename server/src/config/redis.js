import Redis from 'ioredis'
import logger from '../utils/logger.js'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Create Redis client
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      return true
    }
    return false
  },
})

// Redis connection events
redis.on('connect', () => {
  logger.info('✅ Redis connected successfully')
})

redis.on('error', (error) => {
  logger.error('❌ Redis connection error:', error)
})

redis.on('close', () => {
  logger.warn('Redis connection closed')
})

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...')
})

// Helper functions
export const setCache = async (key, value, ttl = 3600) => {
  try {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value
    if (ttl > 0) {
      await redis.setex(key, ttl, stringValue)
    } else {
      await redis.set(key, stringValue)
    }
    return true
  } catch (error) {
    logger.error('Redis set error:', error)
    return false
  }
}

export const getCache = async (key) => {
  try {
    const value = await redis.get(key)
    if (!value) return null
    
    // Try to parse as JSON, return as string if fails
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  } catch (error) {
    logger.error('Redis get error:', error)
    return null
  }
}

export const deleteCache = async (key) => {
  try {
    await redis.del(key)
    return true
  } catch (error) {
    logger.error('Redis delete error:', error)
    return false
  }
}

export const clearPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return true
  } catch (error) {
    logger.error('Redis clear pattern error:', error)
    return false
  }
}

export const incrementCounter = async (key, ttl = 3600) => {
  try {
    const value = await redis.incr(key)
    if (ttl > 0) {
      await redis.expire(key, ttl)
    }
    return value
  } catch (error) {
    logger.error('Redis increment error:', error)
    return null
  }
}

export const getTTL = async (key) => {
  try {
    return await redis.ttl(key)
  } catch (error) {
    logger.error('Redis TTL error:', error)
    return -2 // Key doesn't exist
  }
}

export const flushAll = async () => {
  try {
    await redis.flushall()
    return true
  } catch (error) {
    logger.error('Redis flushall error:', error)
    return false
  }
}

export default redis
