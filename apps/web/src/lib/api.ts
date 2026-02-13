import axios from 'axios'

const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api').trim()

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Could trigger a redirect to login here if needed
      console.error('Unauthorized')
    }
    return Promise.reject(error)
  }
)
