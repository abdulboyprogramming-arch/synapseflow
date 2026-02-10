import mongoose from 'mongoose'
import validator from 'validator'

// @desc    Validate email address
export const isValidEmail = (email) => {
  return validator.isEmail(email)
}

// @desc    Validate password strength
export const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// @desc    Validate MongoDB ObjectId
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
}

// @desc    Validate URL
export const isValidUrl = (url) => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  })
}

// @desc    Validate GitHub repository URL
export const isValidGitHubRepoUrl = (url) => {
  const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/
  return githubRegex.test(url)
}

// @desc    Validate YouTube URL
export const isValidYouTubeUrl = (url) => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
  return youtubeRegex.test(url)
}

// @desc    Validate phone number
export const isValidPhone = (phone) => {
  return validator.isMobilePhone(phone, 'any', { strictMode: false })
}

// @desc    Validate date string
export const isValidDate = (dateString) => {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// @desc    Validate future date
export const isFutureDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  return date > now
}

// @desc    Validate past date
export const isPastDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  return date < now
}

// @desc    Validate array of strings
export const isValidStringArray = (array, minLength = 0, maxLength = Infinity) => {
  if (!Array.isArray(array)) return false
  
  return array.every(item => 
    typeof item === 'string' && 
    item.trim().length >= minLength && 
    item.trim().length <= maxLength
  )
}

// @desc    Validate file size
export const isValidFileSize = (size, maxSizeInMB = 5) => {
  const maxSize = maxSizeInMB * 1024 * 1024 // Convert MB to bytes
  return size <= maxSize
}

// @desc    Validate file type
export const isValidFileType = (mimetype, allowedTypes = ['image/jpeg', 'image/png']) => {
  return allowedTypes.includes(mimetype)
}

// @desc    Validate hex color
export const isValidHexColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

// @desc    Validate username
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
  return usernameRegex.test(username)
}

// @desc    Validate domain
export const isValidDomain = (domain) => {
  const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return domainRegex.test(domain)
}

// @desc    Validate JSON string
export const isValidJson = (str) => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// @desc    Validate latitude
export const isValidLatitude = (lat) => {
  return lat >= -90 && lat <= 90
}

// @desc    Validate longitude
export const isValidLongitude = (lng) => {
  return lng >= -180 && lng <= 180
}

// @desc    Validate timezone
export const isValidTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

// @desc    Validate credit card number (basic Luhn check)
export const isValidCreditCard = (cardNumber) => {
  // Remove non-digit characters
  const sanitized = cardNumber.replace(/\D/g, '')
  
  // Check length
  if (sanitized.length < 13 || sanitized.length > 19) {
    return false
  }
  
  // Luhn algorithm
  let sum = 0
  let shouldDouble = false
  
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i))
    
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    shouldDouble = !shouldDouble
  }
  
  return sum % 10 === 0
}

// @desc    Validate IP address
export const isValidIP = (ip) => {
  return validator.isIP(ip)
}

// @desc    Validate UUID
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// @desc    Validate percentage
export const isValidPercentage = (percentage) => {
  const num = parseFloat(percentage)
  return !isNaN(num) && num >= 0 && num <= 100
}

// @desc    Validate social security number (US)
export const isValidSSN = (ssn) => {
  const ssnRegex = /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/
  return ssnRegex.test(ssn)
}

// @desc    Validate coordinates
export const isValidCoordinates = (lat, lng) => {
  return isValidLatitude(lat) && isValidLongitude(lng)
}

// @desc    Create validation function with custom error message
export const createValidator = (validationFn, errorMessage) => {
  return (value) => {
    const isValid = validationFn(value)
    return {
      isValid,
      error: isValid ? null : errorMessage,
    }
  }
}

// @desc    Combine multiple validators
export const combineValidators = (...validators) => {
  return (value) => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.isValid) {
        return result
      }
    }
    return { isValid: true, error: null }
  }
}
