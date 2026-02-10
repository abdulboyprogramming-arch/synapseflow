import multer from 'multer'
import path from 'path'
import crypto from 'crypto'

// @desc    Generate unique filename
const generateFilename = (file) => {
  const timestamp = Date.now()
  const randomString = crypto.randomBytes(8).toString('hex')
  const extension = path.extname(file.originalname)
  return `${timestamp}-${randomString}${extension}`
}

// @desc    Memory storage configuration
export const memoryStorage = multer.memoryStorage()

// @desc    Disk storage configuration
export const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file))
  },
})

// @desc    File filter for images
export const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

// @desc    File filter for documents
export const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|md/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Only document files are allowed!'), false)
  }
}

// @desc    File filter for code files
export const codeFilter = (req, file, cb) => {
  const allowedTypes = /js|jsx|ts|tsx|py|java|c|cpp|cs|go|rs|rb|php|html|css|scss|json|yml|yaml|xml/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())

  if (extname) {
    cb(null, true)
  } else {
    cb(new Error('Only code files are allowed!'), false)
  }
}

// @desc    Create multer upload instance with configuration
export const createUploader = (options = {}) => {
  const {
    storage = memoryStorage,
    fileFilter = imageFilter,
    limits = {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fields = null,
    array = null,
    single = null,
    any = null,
  } = options

  const upload = multer({
    storage,
    fileFilter,
    limits,
  })

  // Return appropriate middleware based on configuration
  if (fields) {
    return upload.fields(fields)
  } else if (array) {
    return upload.array(array.name, array.maxCount)
  } else if (single) {
    return upload.single(single)
  } else if (any) {
    return upload.any()
  } else {
    return upload.none()
  }
}

// @desc    Avatar upload middleware
export const avatarUpload = createUploader({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  single: 'avatar',
})

// @desc    Project screenshot upload middleware
export const screenshotUpload = createUploader({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  array: {
    name: 'screenshots',
    maxCount: 5,
  },
})

// @desc    Document upload middleware
export const documentUpload = createUploader({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  single: 'document',
})

// @desc    Bulk file upload middleware
export const bulkUpload = createUploader({
  storage: memoryStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 10, // Max 10 files
  },
  any: true,
})

// @desc    Process uploaded files
export const processUploadedFiles = (req, res, next) => {
  if (!req.files && !req.file) {
    return next()
  }

  const files = req.file ? [req.file] : req.files

  // Convert files to consistent format
  const processedFiles = Array.isArray(files) ? files : Object.values(files).flat()

  // Add metadata to each file
  processedFiles.forEach(file => {
    file.processed = true
    file.uploadDate = new Date()
    
    // Generate a unique ID for the file
    file.id = crypto.randomBytes(16).toString('hex')
    
    // Extract file info
    const fileInfo = {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      encoding: file.encoding,
      fieldname: file.fieldname,
    }
    
    file.info = fileInfo
  })

  req.processedFiles = processedFiles
  next()
}

// @desc    Validate uploaded file dimensions (for images)
export const validateImageDimensions = (minWidth = 100, minHeight = 100) => {
  return async (req, res, next) => {
    if (!req.files && !req.file) {
      return next()
    }

    const files = req.file ? [req.file] : req.files
    const processedFiles = Array.isArray(files) ? files : Object.values(files).flat()

    try {
      // This would typically use an image processing library like sharp
      // For now, we'll just pass through
      // In production, you'd validate dimensions here
      
      next()
    } catch (error) {
      next(error)
    }
  }
}
