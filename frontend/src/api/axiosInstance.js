import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API = `${BACKEND_URL}/api`;

// Only emit verbose request/response logs outside production. This avoids
// leaking the Authorization (Bearer) token and request payloads into the
// browser console of live users.
const DEBUG = process.env.NODE_ENV !== 'production';

if (DEBUG) {
  console.log('Environment variables:', {
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    BACKEND_URL,
    API
  });
}

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
    // Attach the stored session token as a Bearer header fallback.
    // The backend (get_current_user) accepts either the httpOnly cookie OR this
    // Authorization header. In cross-site deployments the cookie is often blocked,
    // so this keeps authenticated requests (profile, friends, messages) working
    // after a user claims their account.
    try {
      const token = localStorage.getItem('session_token');
      if (token && !token.startsWith('anon_token_')) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // localStorage may be unavailable in some contexts; ignore.
    }

    if (DEBUG) {
      // Note: deliberately NOT logging headers (contains the Bearer token).
      console.log('📤 Axios Request:', {
        method: config.method,
        url: `${config.baseURL}${config.url}`,
      });
    }
    return config;
  },
  (error) => {
    if (DEBUG) console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor with retry logic
axiosInstance.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log('📥 Axios Response:', { status: response.status });
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    if (DEBUG) {
      console.error('📥 Response Error:', {
        status: error.response?.status,
        message: error.message,
        code: error.code
      });
    }

    // Retry logic for network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < MAX_RETRIES) {
        config._retryCount++;
        if (DEBUG) console.log(`🔄 Retrying request (attempt ${config._retryCount}/${MAX_RETRIES})...`);

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
