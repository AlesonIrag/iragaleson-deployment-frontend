// Environment configuration for separated frontend/backend deployment
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  backendUrl: 'http://localhost:3000',
  
  // API endpoints
  endpoints: {
    auth: '/auth',
    adminAuth: '/adminauth',
    facultyAuth: '/facultyauth',
    weather: '/weather',
    health: '/'
  },
  
  // Separated deployment settings
  enableLogging: true,
  enableDebugMode: true,
  
  // CORS settings for separated deployment
  allowedOrigins: [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:3000'
  ],
  
  // Connection retry settings for separated deployment
  connectionRetry: {
    maxRetries: 3,
    retryDelay: 2000,
    timeout: 10000
  }
};
