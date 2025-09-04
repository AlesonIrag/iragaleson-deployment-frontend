# Cloudflare Deployment Guide for Library Management System

## 🚀 Overview

This guide explains how to properly deploy your Library Management System to Cloudflare, serving static files instead of running development servers.

## ⚠️ Current Issue

**Problem:** You're getting the error:
```
Blocked request. This host ("benedictocollege-library.org") is not allowed.
To allow this host, add "benedictocollege-library.org" to `server.allowedHosts` in vite.config.js.
```

**Root Cause:** You're running the Angular development server (`ng serve`) in production, which has security restrictions.

**Solution:** Serve built static files instead of running the development server.

## 🔧 Production Setup

### Option A: Using Cloudflare Pages (Recommended)

#### 1. Prepare Your Repository
```bash
# Build the production version
npm run build:prod

# Verify the build
node validate-production.js
```

#### 2. Cloudflare Pages Configuration
- **Framework preset:** None (or Angular if available)
- **Build command:** `npm run build:prod`
- **Build output directory:** `dist/Library-Management-System-AI/browser`
- **Root directory:** `/` (leave empty)

#### 3. Environment Variables in Cloudflare Pages
```
NODE_VERSION=18
NPM_VERSION=9
```

#### 4. Custom Headers (Optional)
Add these in Cloudflare Pages settings:
```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### Option B: Using Cloudflare Workers/VPS

#### 1. Server Setup
```bash
# On your server, clone the repository
git clone <your-repo-url>
cd Library-Management-System-AI

# Install dependencies
npm install
cd backend-api && npm install && cd ..

# Build for production
npm run build:prod
```

#### 2. Start Production Servers
```bash
# Use the production script
./start-production.bat

# Or manually:
# Backend (Port 3000)
cd backend-api && npm start

# Frontend (Port 4200) - serving static files
npx http-server dist/Library-Management-System-AI/browser -p 4200 -c-1 --cors -a 0.0.0.0
```

## 🌐 Domain Configuration

### DNS Settings in Cloudflare
```
Type: A
Name: @
Content: <your-server-ip>
Proxy: Enabled (orange cloud)

Type: A  
Name: www
Content: <your-server-ip>
Proxy: Enabled (orange cloud)
```

### Port Configuration
- **Frontend:** Port 4200 (serving static files)
- **Backend:** Port 3000 (API server)

### Cloudflare Proxy Settings
If using ports other than 80/443, you may need to:
1. Use Cloudflare Tunnel (recommended)
2. Or configure port forwarding: 80 → 4200, 443 → 4200

## 🔒 Security Configuration

### 1. Firewall Rules
Allow incoming connections on:
- Port 3000 (Backend API)
- Port 4200 (Frontend)
- Port 22 (SSH)

### 2. Cloudflare Security
- Enable "Under Attack Mode" if needed
- Configure rate limiting
- Set up WAF rules

## 📁 File Structure for Deployment

```
Production Deployment:
├── dist/Library-Management-System-AI/browser/  ← Serve this folder
│   ├── index.html
│   ├── main-*.js
│   ├── styles-*.css
│   └── assets/
├── backend-api/                                ← Run this as API server
│   ├── server.js
│   ├── .env
│   └── ...
└── start-production.bat                        ← Use this script
```

## 🚀 Deployment Steps

### Step 1: Prepare for Deployment
```bash
# Check configuration
./check-production-config.bat

# Validate setup
node validate-production.js

# Build for production
npm run build:prod
```

### Step 2: Deploy to Cloudflare

#### For Cloudflare Pages:
1. Connect your GitHub repository
2. Set build command: `npm run build:prod`
3. Set output directory: `dist/Library-Management-System-AI/browser`
4. Deploy

#### For Cloudflare Workers/VPS:
1. Upload files to your server
2. Run production script: `./start-production.bat`
3. Configure reverse proxy (nginx/apache) if needed

### Step 3: Configure Backend
1. Update backend CORS in `.env`:
   ```
   ALLOWED_ORIGINS=https://benedictocollege-library.org,https://benedictocollege-library.org:4200
   ```
2. Restart backend server

### Step 4: Test Deployment
```bash
# Test frontend
curl https://benedictocollege-library.org

# Test backend
curl https://benedictocollege-library.org:3000

# Test API
curl https://benedictocollege-library.org:3000/api/v1/weather
```

## 🔧 Troubleshooting

### Issue: "allowedHosts" Error
**Cause:** Running development server in production
**Solution:** Use static file serving instead

### Issue: CORS Errors
**Cause:** Backend not allowing frontend domain
**Solution:** Update `ALLOWED_ORIGINS` in backend `.env`

### Issue: 404 on Refresh
**Cause:** Angular routing not configured
**Solution:** Ensure `_redirects` file exists with `/* /index.html 200`

### Issue: API Calls Failing
**Cause:** Wrong API URL in production environment
**Solution:** Check `src/environments/environment.prod.ts`

## 📊 Performance Optimization

### 1. Enable Cloudflare Caching
- Cache static assets (JS, CSS, images)
- Set appropriate cache headers

### 2. Enable Compression
- Gzip/Brotli compression
- Minification

### 3. CDN Configuration
- Use Cloudflare's global CDN
- Optimize images

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:prod
      - uses: cloudflare/pages-action@1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: library-management
          directory: dist/Library-Management-System-AI/browser
```

## 📞 Support

If you encounter issues:
1. Run `node validate-production.js` to check configuration
2. Check browser console for errors
3. Verify backend logs
4. Test API endpoints directly

## 🎯 Quick Commands

```bash
# Check everything is ready
node validate-production.js

# Start production servers
./start-production.bat

# Build only
npm run build:prod

# Test backend
cd backend-api && npm start
```
