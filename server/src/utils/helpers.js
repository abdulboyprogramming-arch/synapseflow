import mongoose from 'mongoose'

// @desc    Generate slug from string
export const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// @desc    Generate unique ID
export const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `${prefix}${timestamp}${random}`
}

// @desc    Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// @desc    Throttle function
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// @desc    Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

// @desc    Merge objects deeply
export const deepMerge = (target, source) => {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key]
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        output[key] = source[key]
      }
    })
  }
  
  return output
}

// @desc    Check if value is object
export const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

// @desc    Remove null/undefined values from object
export const removeEmptyValues = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  )
}

// @desc    Flatten nested object
export const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? `${prefix}.` : ''
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k))
    } else {
      acc[pre + k] = obj[k]
    }
    return acc
  }, {})
}

// @desc    Group array by key
export const groupBy = (array, key) => {
  return array.reduce((acc, obj) => {
    const groupKey = obj[key]
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(obj)
    return acc
  }, {})
}

// @desc    Chunk array into smaller arrays
export const chunkArray = (array, size) => {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// @desc    Sleep/wait for specified time
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// @desc    Retry function with exponential backoff
export const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(delay * Math.pow(2, i))
    }
  }
}

// @desc    Parse query string to object
export const parseQueryString = (queryString) => {
  return Object.fromEntries(new URLSearchParams(queryString))
}

// @desc    Stringify object to query string
export const stringifyQuery = (obj) => {
  return new URLSearchParams(removeEmptyValues(obj)).toString()
}

// @desc    Get pagination metadata
export const getPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null,
  }
}

// @desc    Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0
  return (value / total) * 100
}

// @desc    Generate array of numbers
export const range = (start, end, step = 1) => {
  const arr = []
  for (let i = start; i <= end; i += step) {
    arr.push(i)
  }
  return arr
}

// @desc    Shuffle array
export const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// @desc    Get random item from array
export const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)]
}

// @desc    Remove duplicates from array
export const removeDuplicates = (array) => {
  return [...new Set(array)]
}

// @desc    Sort array by property
export const sortBy = (array, property, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aValue = a[property]
    const bValue = b[property]
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
}

// @desc    Format error message
export const formatErrorMessage = (error) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return Object.values(error.errors).map(e => e.message).join(', ')
  }
  if (error.code === 11000) {
    return 'Duplicate entry found'
  }
  return error.message || 'An error occurred'
}

// @desc    Validate required fields
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = []
  
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field)
    }
  })
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }
  
  return true
}

// @desc    Convert to MongoDB filter
export const toMongoFilter = (query) => {
  const filter = {}
  
  Object.entries(query).forEach(([key, value]) => {
    if (value === 'true' || value === 'false') {
      filter[key] = value === 'true'
    } else if (!isNaN(value) && value !== '') {
      filter[key] = Number(value)
    } else if (value && value.includes(',')) {
      filter[key] = { $in: value.split(',') }
    } else if (value) {
      filter[key] = value
    }
  })
  
  return filter
}

// @desc    Calculate age from birth date
export const calculateAge = (birthDate) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// @desc    Generate initials from name
export const generateInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}
