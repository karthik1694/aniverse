import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API = `${BACKEND_URL}/api`;

console.log('Environment variables:', {
  REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  BACKEND_URL,
  API
});

export const axiosInstance = axios.create({
  baseURL: API,
  withCredentials: true,
  timeout: 30000, // 30 second timeout for slower connections
  headers: {
    'Content-Type': 'application/json'
  }
});

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('📤 Axios Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor with retry logic
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📥 Axios Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const config = error.config;
    
    console.error('📥 Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    // Retry logic for network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      config._retryCount = config._retryCount || 0;
      
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount++;
        console.log(`🔄 Retrying request (attempt ${config._retryCount}/${MAX_RETRIES})...`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // Try without credentials on retry (sometimes helps with CORS)
        if (config._retryCount > 1) {
          config.withCredentials = false;
        }
        
        return axiosInstance(config);
      }
    }
    
    return Promise.reject(error);
  }
);

export { BACKEND_URL, API };
