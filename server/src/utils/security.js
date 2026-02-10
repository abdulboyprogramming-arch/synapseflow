import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// @desc    Hash password using bcrypt
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// @desc    Compare password with hash
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash)
}

// @desc    Generate JWT token
export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn })
}

// @desc    Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

// @desc    Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' })
}

// @desc    Generate random string
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex')
}

// @desc    Generate random number
export const generateRandomNumber = (min = 100000, max = 999999) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// @desc    Generate secure password
export const generateSecurePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length)
    password += charset[randomIndex]
  }
  
  return password
}

// @desc    Encrypt data
export const encryptData = (data, secretKey = process.env.ENCRYPTION_KEY) => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secretKey, 'hex'), iv)
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex'),
  }
}

// @desc    Decrypt data
export const decryptData = (encryptedData, secretKey = process.env.ENCRYPTION_KEY) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(secretKey, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// @desc    Hash data using SHA-256
export const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// @desc    Generate API key
export const generateApiKey = () => {
  return `sk_${crypto.randomBytes(32).toString('hex')}`
}

// @desc    Generate CSRF token
export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// @desc    Sanitize HTML input
export const sanitizeHtml = (html) => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'code', 'pre', 'br', 'p', 'ul', 'ol', 'li', 'a']
  const allowedAttributes = ['href', 'title', 'target']
  
  // This is a simplified version - use a proper library for production
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/javascript:/gi, '')
}

// @desc    Validate and sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .substring(0, 1000) // Limit length
}

// @desc    Escape SQL characters
export const escapeSql = (str) => {
  if (typeof str !== 'string') return str
  
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
}

// @desc    Check password strength
export const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
  
  const score = Object.values(checks).filter(Boolean).length
  const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][score]
  
  return {
    score,
    strength,
    checks,
  }
}

// @desc    Generate 2FA secret
export const generateTwoFactorSecret = () => {
  return crypto.randomBytes(20).toString('hex')
}

// @desc    Generate 2FA code
export const generateTwoFactorCode = (secret) => {
  // This is a simplified version - use proper TOTP implementation in production
  const timestamp = Math.floor(Date.now() / 1000 / 30)
  const hash = crypto.createHmac('sha1', secret).update(timestamp.toString()).digest('hex')
  
  const offset = parseInt(hash.slice(-1), 16)
  const binary = parseInt(hash.substr(offset * 2, 8), 16) & 0x7fffffff
  
  return (binary % 1000000).toString().padStart(6, '0')
}

// @desc    Validate 2FA code
export const validateTwoFactorCode = (secret, code) => {
  const generatedCode = generateTwoFactorCode(secret)
  return generatedCode === code
}

// @desc    Generate password reset token
export const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// @desc    Generate email verification token
export const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// @desc    Create secure session ID
export const generateSessionId = () => {
  return crypto.randomBytes(64).toString('hex')
}

// @desc    Validate session ID format
export const isValidSessionId = (sessionId) => {
  return /^[a-f0-9]{128}$/.test(sessionId)
}

// @desc    Generate nonce for CSP
export const generateNonce = () => {
  return crypto.randomBytes(16).toString('base64')
}
