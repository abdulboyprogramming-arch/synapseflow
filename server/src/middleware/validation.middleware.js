import { validationResult } from 'express-validator'
import asyncHandler from 'express-async-handler'

// @desc    Validate request body
// @returns Middleware function
export const validate = (validations) => {
  return asyncHandler(async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)))

    // Check for validation errors
    const errors = validationResult(req)
    
    if (!errors.isEmpty()) {
      res.status(400)
      throw new Error(errors.array()[0].msg)
    }

    next()
  })
}

// @desc    Validate MongoDB ObjectId
export const validateObjectId = (paramName = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const id = req.params[paramName]
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      res.status(400)
      throw new Error(`Invalid ${paramName} format`)
    }
    
    next()
  })
}

// @desc    Validate file upload
export const validateFileUpload = (options = {}) => {
  return asyncHandler(async (req, res, next) => {
    const {
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize = 5 * 1024 * 1024, // 5MB
      maxFiles = 1,
      fieldName = 'file',
    } = options

    // Check if file exists
    if (!req.file && !req.files) {
      res.status(400)
      throw new Error('No file uploaded')
    }

    const files = req.file ? [req.file] : req.files

    // Check file count
    if (files.length > maxFiles) {
      res.status(400)
      throw new Error(`Maximum ${maxFiles} file(s) allowed`)
    }

    // Validate each file
    for (const file of files) {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400)
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
      }

      // Check file size
      if (file.size > maxSize) {
        res.status(400)
        throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`)
      }

      // Check for common security issues
      if (file.originalname.includes('..') || file.originalname.includes('/')) {
        res.status(400)
        throw new Error('Invalid file name')
      }
    }

    next()
  })
}

// @desc    Validate pagination parameters
export const validatePagination = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query

  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)

  if (isNaN(pageNum) || pageNum < 1) {
    res.status(400)
    throw new Error('Page must be a positive number')
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    res.status(400)
    throw new Error('Limit must be between 1 and 100')
  }

  // Set validated values
  req.query.page = pageNum
  req.query.limit = limitNum

  next()
})

// @desc    Validate search parameters
export const validateSearch = asyncHandler(async (req, res, next) => {
  const { search } = req.query

  if (search && typeof search !== 'string') {
    res.status(400)
    throw new Error('Search parameter must be a string')
  }

  // Sanitize search query
  if (search) {
    const sanitized = search
      .replace(/[^\w\s-]/gi, '')
      .trim()
      .substring(0, 100) // Limit length
    
    req.query.search = sanitized
  }

  next()
})

// @desc    Validate date range
export const validateDateRange = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query

  if (startDate) {
    const start = new Date(startDate)
    if (isNaN(start.getTime())) {
      res.status(400)
      throw new Error('Invalid start date format')
    }
    req.query.startDate = start
  }

  if (endDate) {
    const end = new Date(endDate)
    if (isNaN(end.getTime())) {
      res.status(400)
      throw new Error('Invalid end date format')
    }
    req.query.endDate = end
  }

  // Ensure start date is before end date
  if (req.query.startDate && req.query.endDate) {
    if (req.query.startDate > req.query.endDate) {
      res.status(400)
      throw new Error('Start date must be before end date')
    }
  }

  next()
})
