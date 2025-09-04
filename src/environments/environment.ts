// Environment configuration for development
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
  
  // Development settings
  enableLogging: true,
  enableDebugMode: true,
  
  // CORS settings for development
  allowedOrigins: [
    'http://localhost:4200',
    'http://localhost:3000'
  ],

  // Connection retry settings
  connectionRetry: {
    maxRetries: 3,
    retryDelay: 2000,
    timeout: 10000
  }
};
