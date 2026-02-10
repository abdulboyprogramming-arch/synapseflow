import axios from 'axios'

// @desc    Create API client with base configuration
export const createApiClient = (baseURL, options = {}) => {
  const client = axios.create({
    baseURL,
    timeout: options.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add authentication token if available
      const token = localStorage?.getItem('token') || options.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log('API Request:', {
          method: config.method,
          url: config.url,
          data: config.data,
          params: config.params,
        })
      }

      return config
    },
    (error) => {
      console.error('API Request Error:', error)
      return Promise.reject(error)
    }
  )

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log('API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        })
      }

      return response.data
    },
    (error) => {
      // Handle response errors
      const errorResponse = {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        config: error.config,
      }

      console.error('API Response Error:', errorResponse)

      // Handle specific status codes
      if (errorResponse.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage?.removeItem('token')
        window.location.href = '/login'
      } else if (errorResponse.status === 403) {
        // Forbidden
        console.warn('Access forbidden:', errorResponse.message)
      } else if (errorResponse.status === 404) {
        // Not found
        console.warn('Resource not found:', errorResponse.config.url)
      } else if (errorResponse.status >= 500) {
        // Server error
        console.error('Server error:', errorResponse.message)
      }

      return Promise.reject(errorResponse)
    }
  )

  return client
}

// @desc    GitHub API client
export const githubApi = createApiClient('https://api.github.com', {
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
})

// @desc    Fetch user repositories from GitHub
export const fetchUserRepositories = async (username, token = null) => {
  try {
    const config = token
      ? { headers: { Authorization: `token ${token}` } }
      : {}

    const response = await githubApi.get(`/users/${username}/repos`, config)
    return response
  } catch (error) {
    console.error('Failed to fetch GitHub repositories:', error)
    throw error
  }
}

// @desc    Fetch repository details
export const fetchRepositoryDetails = async (owner, repo, token = null) => {
  try {
    const config = token
      ? { headers: { Authorization: `token ${token}` } }
      : {}

    const response = await githubApi.get(`/repos/${owner}/${repo}`, config)
    return response
  } catch (error) {
    console.error('Failed to fetch repository details:', error)
    throw error
  }
}

// @desc    Fetch repository languages
export const fetchRepositoryLanguages = async (owner, repo, token = null) => {
  try {
    const config = token
      ? { headers: { Authorization: `token ${token}` } }
      : {}

    const response = await githubApi.get(`/repos/${owner}/${repo}/languages`, config)
    return response
  } catch (error) {
    console.error('Failed to fetch repository languages:', error)
    throw error
  }
}

// @desc    Make authenticated request with retry logic
export const makeRequestWithRetry = async (
  requestFn,
  maxRetries = 3,
  delay = 1000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${waitTime}ms`)
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
}

// @desc    Batch API requests
export const batchRequests = async (requests, maxConcurrent = 5) => {
  const results = []
  const errors = []

  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent)
    const batchPromises = batch.map((request, index) =>
      request().catch(error => {
        errors.push({ index: i + index, error })
        return null
      })
    )

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults.filter(result => result !== null))
  }

  return { results, errors }
}

// @desc    Validate API response
export const validateApiResponse = (response, schema) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response format')
  }

  if (schema) {
    // In a real implementation, you'd use a validation library like Joi or Zod
    // For now, we'll do basic validation
    const requiredFields = Object.keys(schema).filter(key => schema[key].required)
    
    for (const field of requiredFields) {
      if (!response[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
  }

  return response
}
