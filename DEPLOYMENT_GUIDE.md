# Frontend-Backend Deployment Guide

This guide explains how to deploy your Library Management System with separated frontend and backend components.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/API     ┌─────────────────┐
│   Frontend      │ ──────────────► │   Backend       │
│   (Angular)     │                 │   (Node.js)     │
│   Port: 4200    │                 │   Port: 3000    │
└─────────────────┘                 └─────────────────┘
```

## 🚀 Quick Start (Development)

### Option 1: Run Both Together
```bash
# Install all dependencies
npm run setup

# Start both frontend and backend
npm run dev:full
```

### Option 2: Run Separately
```bash
# Terminal 1: Start Backend
npm run backend:start

# Terminal 2: Start Frontend (separated mode)
npm run start:separated
```

## 📁 Project Structure

```
Library-Management-System-AI/
├── src/
│   ├── app/                    # Angular frontend
│   ├── backend-api/           # Node.js backend (can be moved)
│   └── environments/          # Environment configurations
├── package.json               # Frontend dependencies
└── DEPLOYMENT_GUIDE.md       # This file
```

## 🔧 Environment Configurations

### Frontend Environments

1. **Development** (`environment.ts`)
   - API URL: `http://localhost:3000/api/v1`
   - Used when: `ng serve`

2. **Separated** (`environment.separated.ts`)
   - API URL: `http://localhost:3000/api/v1`
   - Used when: `ng serve --configuration=separated`

3. **Production** (`environment.prod.ts`)
   - API URL: `https://your-backend-domain.com/api/v1`
   - Used when: `ng build --configuration=production`

### Backend Environment

Copy `src/backend-api/.env.example` to `src/backend-api/.env` and configure:

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

## 🚢 Deployment Scenarios

### Scenario 1: Same Server Deployment

Both frontend and backend on the same server:

```bash
# Build frontend for production
npm run build

# Start backend
cd src/backend-api
npm start

# Serve frontend (using a web server like nginx)
# Point nginx to serve files from dist/ folder
```

### Scenario 2: Separated Deployment

Frontend and backend on different servers:

#### Backend Server:
```bash
# Copy backend-api folder to backend server
scp -r src/backend-api/ user@backend-server:/path/to/backend/

# On backend server
cd /path/to/backend/backend-api
npm install
cp .env.example .env
# Edit .env with production values
npm start
```

#### Frontend Server:
```bash
# Update environment.prod.ts with backend server URL
# Build for production
npm run build

# Copy dist folder to frontend server
scp -r dist/ user@frontend-server:/var/www/html/

# Configure web server (nginx/apache) to serve from dist/
```

### Scenario 3: Docker Deployment

#### Backend Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY src/backend-api/package*.json ./
RUN npm install
COPY src/backend-api/ ./
EXPOSE 3000
CMD ["npm", "start"]
```

#### Frontend Dockerfile:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html/
EXPOSE 80
```

#### Docker Compose:
```yaml
version: '3.8'
services:
  backend:
    build: 
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=database
      - ALLOWED_ORIGINS=http://localhost:4200
    
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "4200:80"
    depends_on:
      - backend
```

## 🔗 API Communication

The frontend communicates with the backend through the `ApiService`:

```typescript
// Automatic environment-based URL configuration
constructor(private apiService: ApiService) {}

// All API calls go through the service
this.apiService.getWeather().subscribe(data => {
  // Handle response
});
```

## 🛠️ Moving Backend to Separate Folder

To move the backend to a completely separate project:

1. **Copy the backend folder:**
   ```bash
   cp -r src/backend-api/ ../backend-separate/
   ```

2. **Update frontend environment:**
   ```typescript
   // In environment files, update apiUrl to point to new backend location
   apiUrl: 'http://your-backend-server:3000/api/v1'
   ```

3. **Update backend CORS:**
   ```javascript
   // In backend server.js, update ALLOWED_ORIGINS
   ALLOWED_ORIGINS=http://your-frontend-server:4200
   ```

## 🔍 Testing Separated Deployment

1. **Test Backend Independently:**
   ```bash
   cd src/backend-api
   npm start
   # Visit http://localhost:3000 - should show "Backend API Server is running!"
   ```

2. **Test Frontend Connection:**
   ```bash
   npm run start:separated
   # Check browser console for connection status
   ```

3. **Test API Endpoints:**
   ```bash
   # Test weather API
   curl http://localhost:3000/api/v1/weather
   
   # Test health check
   curl http://localhost:3000/
   ```

## 🚨 Troubleshooting

### CORS Issues
- Ensure backend `ALLOWED_ORIGINS` includes frontend URL
- Check browser console for CORS errors
- Verify both servers are running

### Connection Issues
- Check if backend is running on correct port
- Verify environment configuration
- Check firewall settings for separated deployment

### API Errors
- Check backend logs for errors
- Verify database connection
- Ensure API keys are configured

## 📝 Production Checklist

- [ ] Update environment.prod.ts with production API URL
- [ ] Configure production database credentials
- [ ] Set up HTTPS for both frontend and backend
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Test all API endpoints in production environment
