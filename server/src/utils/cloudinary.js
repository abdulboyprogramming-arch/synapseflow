import { v2 as cloudinary } from 'cloudinary'
import stream from 'stream'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// @desc    Upload buffer to Cloudinary
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'synapseflow',
        resource_type: options.resource_type || 'auto',
        transformation: options.transformation,
        public_id: options.public_id,
        overwrite: options.overwrite || false,
        tags: options.tags,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )

    // Create a readable stream from buffer
    const bufferStream = new stream.PassThrough()
    bufferStream.end(buffer)
    bufferStream.pipe(uploadStream)
  })
}

// @desc    Upload file to Cloudinary
export const uploadFile = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, options)
    return result
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

// @desc    Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, options)
    return result
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw error
  }
}

// @desc    Generate image URL with transformations
export const generateImageUrl = (publicId, transformations = []) => {
  const defaultTransformations = [
    { quality: 'auto', fetch_format: 'auto' },
  ]

  const allTransformations = [...defaultTransformations, ...transformations]

  return cloudinary.url(publicId, {
    transformation: allTransformations,
    secure: true,
  })
}

// @desc    Generate responsive image URLs
export const generateResponsiveUrls = (publicId, sizes = [640, 768, 1024, 1280, 1920]) => {
  const urls = {}

  sizes.forEach(width => {
    urls[`w${width}`] = cloudinary.url(publicId, {
      transformation: [
        { width, crop: 'scale' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      secure: true,
    })
  })

  return urls
}

// @desc    Extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url) return null

  const matches = url.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/)
  return matches ? matches[1] : null
}

// @desc    Upload multiple files
export const uploadMultipleFiles = async (files, options = {}) => {
  const uploadPromises = files.map(file => 
    uploadToCloudinary(file.buffer, {
      ...options,
      public_id: options.public_id ? `${options.public_id}_${Date.now()}` : undefined,
    })
  )

  const results = await Promise.allSettled(uploadPromises)
  
  const successful = []
  const failed = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value)
    } else {
      failed.push({
        index,
        error: result.reason.message,
      })
    }
  })

  return { successful, failed }
}

// @desc    Optimize image before upload
export const optimizeImage = async (buffer, options = {}) => {
  // In a real implementation, you would use a library like sharp
  // to optimize the image before uploading
  
  // For now, return the original buffer
  // This is a placeholder for image optimization logic
  
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 80,
    format = 'webp',
  } = options

  // Optimization would happen here
  // const optimizedBuffer = await sharp(buffer)
  //   .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
  //   .toFormat(format, { quality })
  //   .toBuffer()

  return buffer // Return optimized buffer in real implementation
}

// @desc    Get Cloudinary resource info
export const getResourceInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId)
    return result
  } catch (error) {
    console.error('Cloudinary API error:', error)
    throw error
  }
}

// @desc    Create image transformation URL
export const createTransformationUrl = (publicId, transformations) => {
  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  })
}
