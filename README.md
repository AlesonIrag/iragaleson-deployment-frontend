# Library Management System - Benedicto College

A modern, full-stack library management system built with Angular frontend and Node.js backend, designed for Benedicto College with professional UI/UX and separated deployment capabilities.

## 🚀 Quick Start

### Option 1: Run Everything Together (Recommended for Development)
```bash
# Windows
start-dev.bat

# Or manually
npm run dev:full
```

### Option 2: Run Separated (Simulates Production Deployment)
```bash
# Windows
start-separated.bat

# Or manually
npm run dev:separated
```

### Option 3: Manual Setup
```bash
# Install all dependencies
npm run setup

# Terminal 1: Start Backend
npm run backend:start

# Terminal 2: Start Frontend
npm start
```

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/API     ┌─────────────────┐    Database    ┌─────────────────┐
│   Frontend      │ ──────────────► │   Backend       │ ─────────────► │   MariaDB       │
│   (Angular)     │                 │   (Node.js)     │                │   (MySQL)       │
│   Port: 4200    │                 │   Port: 3000    │                │   Port: 3306    │
└─────────────────┘                 └─────────────────┘                └─────────────────┘
```

## 📁 Project Structure

```
Library-Management-System-AI/
├── src/
│   ├── app/                    # Angular frontend application
│   │   ├── components/         # UI components
│   │   ├── services/          # API and utility services
│   │   └── ...
│   ├── backend-api/           # Node.js backend (can be moved)
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Security & validation
│   │   ├── config/            # Database configuration
│   │   └── server.js          # Main server file
│   ├── environments/          # Environment configurations
│   └── assets/               # Static assets
├── docker-compose.yml         # Docker deployment
├── DEPLOYMENT_GUIDE.md       # Detailed deployment guide
└── README.md                 # This file
```

## 🛠️ Available Scripts

### Frontend Scripts
- `npm start` - Start frontend in development mode
- `npm run start:separated` - Start frontend in separated deployment mode
- `npm run build` - Build for production
- `npm run build:separated` - Build for separated deployment
- `npm test` - Run unit tests

### Backend Scripts
- `npm run backend:start` - Start backend server
- `npm run backend:dev` - Start backend in development mode
- `npm run backend:install` - Install backend dependencies

### Combined Scripts
- `npm run setup` - Install all dependencies (frontend + backend)
- `npm run dev:full` - Start both frontend and backend together
- `npm run dev:separated` - Start both in separated mode

## 🌐 Environment Configurations

### Development Mode
- **Frontend**: `http://localhost:4200`
- **Backend**: `http://localhost:3000`
- **API Base**: `http://localhost:3000/api/v1`

### Separated Mode
- Same URLs but configured for separated deployment testing
- Simulates production environment where frontend and backend are on different servers

### Production Mode
- Configure `src/environments/environment.prod.ts` with your production URLs
- Update backend CORS settings in `src/backend-api/server.js`

## 🔧 Configuration

### Backend Environment (.env)
Copy `src/backend-api/.env.example` to `src/backend-api/.env`:

```env
# Database
DB_HOST=localhost
DB_USER=lms_user
DB_PASS=lms2026
DB_NAME=dblibrary

# Server
PORT=3000
NODE_ENV=development

# CORS (adjust for your deployment)
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000

# API Keys
OPENWEATHER_API_KEY=your-api-key-here
```

### Frontend Environment
Update `src/environments/environment.prod.ts` for production:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-domain.com/api/v1',
  backendUrl: 'https://your-backend-domain.com'
};
```

## 🚢 Deployment Options

### 1. Same Server Deployment
Both frontend and backend on the same server.

### 2. Separated Deployment
Frontend and backend on different servers/containers.

### 3. Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:4200
# Backend: http://localhost:3000
```

### 4. Moving Backend to Separate Project
```bash
# Copy backend to separate folder
cp -r src/backend-api/ ../backend-separate/

# Update frontend environment to point to new backend
# Update backend CORS to allow frontend origin
```

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Student login
- `POST /api/v1/adminauth/login` - Admin login

### Weather
- `GET /api/v1/weather` - Current weather
- `GET /api/v1/weather/forecast` - Weather forecast

### Health Check
- `GET /` - Backend health status

## 🧪 Testing

### Test Backend Connection
```bash
cd src/backend-api
npm start
# Visit http://localhost:3000
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/

# Weather API
curl http://localhost:3000/api/v1/weather
```

### Test Frontend
```bash
npm start
# Visit http://localhost:4200
# Check browser console for connection status
```

## 🚨 Troubleshooting

### CORS Issues
- Ensure backend `ALLOWED_ORIGINS` includes frontend URL
- Check browser console for CORS errors

### Connection Issues
- Verify both servers are running
- Check firewall settings
- Ensure correct ports are open

### Database Issues
- Check database credentials in `.env`
- Ensure MariaDB/MySQL is running
- Run database setup scripts

## 📚 Features

- **Modern UI/UX** - Professional design with Benedicto College branding
- **Responsive Design** - Works on desktop and mobile
- **Real-time Weather** - Integrated weather widget for Cebu City
- **Secure Authentication** - Student and admin login systems
- **API Integration** - RESTful API with proper error handling
- **Separated Deployment** - Frontend and backend can be deployed independently
- **Docker Support** - Containerized deployment ready
- **Environment Management** - Multiple environment configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🏫 About Benedicto College

**Mission**: Your Education… Our Mission
**Vision**: Globally competitive institution in the Asia-Pacific region

For more information, visit [benedictocollege.edu.ph](https://benedictocollege.edu.ph/)
