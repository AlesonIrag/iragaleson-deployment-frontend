# 🚀 Render Deployment Guide for Backend API

## 📋 Overview

Deploy your backend API to Render while keeping your frontend on `benedictocollege-library.org`. This setup provides:
- ✅ Free HTTPS certificates
- ✅ Automatic deployments from Git
- ✅ Environment variable management
- ✅ Built-in monitoring and logs

## 🔧 Pre-Deployment Setup

### ✅ Files Already Configured:
- `backend-api/server.js` - Updated for Render hosting
- `backend-api/render.yaml` - Render service configuration
- `backend-api/.env.render` - Environment template
- `src/environments/environment.prod.ts` - Points to Render URL

## 🚀 Step-by-Step Deployment

### **Step 1: Prepare Your Repository**

1. **Push your backend-api folder to GitHub:**
   ```bash
   # If not already in Git, initialize
   cd backend-api
   git init
   git add .
   git commit -m "Initial backend commit"
   
   # Push to GitHub (create a new repo called 'benedicto-library-api')
   git remote add origin https://github.com/yourusername/benedicto-library-api.git
   git push -u origin main
   ```

### **Step 2: Create Render Account & Service**

1. **Go to [render.com](https://render.com)** and sign up
2. **Connect your GitHub account**
3. **Click "New +" → "Web Service"**
4. **Select your repository:** `benedicto-library-api`
5. **Configure the service:**

   ```
   Name: benedicto-library-api
   Environment: Node
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: . (or leave empty)
   Build Command: npm install
   Start Command: npm start
   ```

### **Step 3: Configure Environment Variables**

In Render dashboard, go to **Environment** tab and add these variables:

#### **Required Variables:**
```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://benedictocollege-library.org

# Database (Update with your actual database)
DB_HOST=your-database-host
DB_USER=your-database-user  
DB_PASS=your-database-password
DB_NAME=your-database-name

# Email Configuration
EMAIL_USER=benedictocollege.library@gmail.com
EMAIL_PASS=your-gmail-app-password

# API Keys
OPENWEATHER_API_KEY=e4f68ec96d6203c0ad97aa4ef8d4668d
```

#### **Optional Variables:**
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
OTP_EXPIRY_MINUTES=10
RESET_TOKEN_EXPIRY_HOURS=1
```

### **Step 4: Deploy & Get Your URL**

1. **Click "Create Web Service"**
2. **Wait for deployment** (5-10 minutes)
3. **Your API will be available at:**
   ```
   https://benedicto-library-api.onrender.com
   ```

### **Step 5: Update Frontend Configuration**

**Already done!** Your frontend now points to:
```typescript
apiUrl: 'https://benedicto-library-api.onrender.com/api/v1'
```

### **Step 6: Test Your Deployment**

```bash
# Test health endpoint
curl https://benedicto-library-api.onrender.com/

# Test API info
curl https://benedicto-library-api.onrender.com/api

# Test weather API
curl https://benedicto-library-api.onrender.com/api/v1/weather
```

## 🔧 Database Options for Render

### **Option 1: Keep Current Database**
If your database is accessible from the internet:
- Use your current database credentials
- Ensure firewall allows Render's IP ranges

### **Option 2: Render PostgreSQL (Recommended)**
```bash
# In Render dashboard:
1. Create new PostgreSQL database
2. Copy connection details to environment variables
3. Update your database configuration
```

### **Option 3: External Database Services**
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL) 
- **MongoDB Atlas**
- **AWS RDS**

## 🔄 Automatic Deployments

Render automatically deploys when you push to your main branch:

```bash
# Make changes to your backend
cd backend-api
# Edit files...

# Commit and push
git add .
git commit -m "Update API"
git push origin main

# Render automatically deploys! 🚀
```

## 🔍 Monitoring & Debugging

### **View Logs:**
1. Go to Render dashboard
2. Click your service
3. Go to "Logs" tab
4. See real-time logs

### **Health Checks:**
Render automatically monitors your `/` endpoint for health.

### **Performance:**
- Free tier: 512MB RAM, shared CPU
- Paid tiers: More resources available

## 🛠️ Troubleshooting

### **Issue: Service Won't Start**
**Check:**
1. `package.json` has correct start script
2. Environment variables are set
3. Database connection is working
4. Check logs in Render dashboard

### **Issue: CORS Errors**
**Check:**
1. `ALLOWED_ORIGINS` includes your frontend domain
2. Frontend points to correct Render URL
3. Both use HTTPS

### **Issue: Database Connection Failed**
**Check:**
1. Database credentials are correct
2. Database allows external connections
3. Firewall settings
4. Connection string format

## 📊 Current Configuration Summary

### **Frontend (benedictocollege-library.org):**
```typescript
apiUrl: 'https://benedicto-library-api.onrender.com/api/v1'
```

### **Backend (Render):**
```bash
URL: https://benedicto-library-api.onrender.com
CORS: https://benedictocollege-library.org
Auto-deploy: Enabled
Health check: /
```

## 💰 Render Pricing

### **Free Tier:**
- ✅ 512MB RAM
- ✅ Shared CPU  
- ✅ 750 hours/month
- ✅ Auto-sleep after 15min inactivity
- ✅ HTTPS included

### **Paid Tiers:**
- 🚀 Always-on services
- 🚀 More RAM/CPU
- 🚀 Custom domains
- 🚀 Priority support

## 🎯 Next Steps

1. **Deploy to Render** following the steps above
2. **Test all API endpoints** 
3. **Update frontend** and deploy to benedictocollege-library.org
4. **Test login functionality**
5. **Monitor logs** for any issues

Your backend will be live at: `https://benedicto-library-api.onrender.com` 🎉
