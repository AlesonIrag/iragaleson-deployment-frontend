// Environment configuration for production
export const environment = {
  production: true,
  apiUrl: 'https://benedictocollege-library.org:3000/api/v1',
  backendUrl: 'https://benedictocollege-library.org:3000',
  
  // API endpoints
  endpoints: {
    auth: '/auth',
    adminAuth: '/adminauth',
    facultyAuth: '/facultyauth',
    weather: '/weather',
    health: '/'
  },
  
  // Production settings
  enableLogging: false,
  enableDebugMode: false,
  
  // CORS settings for production
  allowedOrigins: [
    'https://benedictocollege-library.org',
    'https://benedictocollege-library.org:3000'
  ],

  // Connection retry settings for production
  connectionRetry: {
    maxRetries: 5,
    retryDelay: 3000,
    timeout: 15000
  }
};
