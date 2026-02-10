import mongoose from 'mongoose'
import logger from '../utils/logger.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/synapseflow'

// Connection options
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10,
  minPoolSize: 5,
}

// Create connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, connectionOptions)
    
    logger.info('✅ MongoDB connected successfully')
    
    // Connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to DB')
    })
    
    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err)
    })
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from DB')
    })
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      logger.info('Mongoose connection closed through app termination')
      process.exit(0)
    })
    
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Export connection and models
export { mongoose, connectDB }
