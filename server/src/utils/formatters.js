import moment from 'moment'

// @desc    Format date to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  return moment(date).fromNow()
}

// @desc    Format date to readable string
export const formatDate = (date, format = 'MMMM Do YYYY, h:mm:ss a') => {
  return moment(date).format(format)
}

// @desc    Format number with commas
export const formatNumber = (number) => {
  return new Intl.NumberFormat().format(number)
}

// @desc    Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// @desc    Format duration in milliseconds to readable string
export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// @desc    Format currency
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

// @desc    Format percentage
export const formatPercentage = (value, decimals = 2) => {
  return `${parseFloat(value).toFixed(decimals)}%`
}

// @desc    Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// @desc    Format phone number
export const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`
  } else if (cleaned.length === 11) {
    return `+${cleaned.charAt(0)} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`
  }
  
  return phoneNumber
}

// @desc    Format social security number
export const formatSSN = (ssn) => {
  const cleaned = ssn.replace(/\D/g, '')
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 5)}-${cleaned.substring(5)}`
  }
  return ssn
}

// @desc    Format credit card number
export const formatCreditCard = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '')
  const parts = cleaned.match(/.{1,4}/g)
  return parts ? parts.join(' ') : cardNumber
}

// @desc    Format name (capitalize first letters)
export const formatName = (name) => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// @desc    Format URL for display
export const formatUrlForDisplay = (url, maxLength = 50) => {
  const urlObj = new URL(url)
  let displayUrl = urlObj.hostname + urlObj.pathname
  
  if (displayUrl.length > maxLength) {
    displayUrl = displayUrl.substring(0, maxLength - 3) + '...'
  }
  
  return displayUrl
}

// @desc    Format array to comma-separated string
export const formatArrayToString = (array, maxItems = 5) => {
  if (!Array.isArray(array)) return ''
  
  if (array.length <= maxItems) {
    return array.join(', ')
  }
  
  return array.slice(0, maxItems).join(', ') + ` and ${array.length - maxItems} more`
}

// @desc    Format bytes to human readable string
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// @desc    Format time remaining
export const formatTimeRemaining = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

// @desc    Format count with label (singular/plural)
export const formatCount = (count, singular, plural = null) => {
  const pluralForm = plural || singular + 's'
  return count === 1 ? `1 ${singular}` : `${count} ${pluralForm}`
}

// @desc    Format rating stars
export const formatRating = (rating, maxStars = 5) => {
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 >= 0.5
  const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0)
  
  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars)
}

// @desc    Format progress percentage
export const formatProgress = (current, total) => {
  const percentage = total > 0 ? (current / total) * 100 : 0
  return `${Math.round(percentage)}% (${current}/${total})`
}

// @desc    Format social media handle
export const formatSocialHandle = (platform, username) => {
  const platforms = {
    twitter: '@',
    instagram: '@',
    github: '@',
    linkedin: '',
  }
  
  const prefix = platforms[platform.toLowerCase()] || ''
  return prefix + username
}

// @desc    Format location coordinates
export const formatCoordinates = (lat, lng) => {
  const latDirection = lat >= 0 ? 'N' : 'S'
  const lngDirection = lng >= 0 ? 'E' : 'W'
  
  const latAbs = Math.abs(lat).toFixed(4)
  const lngAbs = Math.abs(lng).toFixed(4)
  
  return `${latAbs}° ${latDirection}, ${lngAbs}° ${lngDirection}`
}
