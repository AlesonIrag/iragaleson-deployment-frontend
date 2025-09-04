# 🔧 Subdomain CORS Fix Guide

## 🚫 Problem Identified

**Issue:** Frontend and backend on different subdomains can't communicate
- **Frontend:** `benedictocollege-library.org`
- **Backend:** `api.benedictocollege-library.org`
- **Error:** Login credentials not working due to CORS blocking

## ✅ Solution Applied

### 1. **Updated Frontend Environment**
**File:** `src/environments/environment.prod.ts`

**Before:**
```typescript
apiUrl: 'https://benedictocollege-library.org:3000/api/v1',
backendUrl: 'https://benedictocollege-library.org:3000',
```

**After:**
```typescript
apiUrl: 'https://api.benedictocollege-library.org/api/v1',
backendUrl: 'https://api.benedictocollege-library.org',
```

### 2. **Updated Backend CORS Configuration**
**File:** `backend-api/.env`

**Before:**
```
ALLOWED_ORIGINS=...,https://benedictocollege-library.org:4200
```

**After:**
```
ALLOWED_ORIGINS=...,https://benedictocollege-library.org,https://api.benedictocollege-library.org
```

### 3. **Updated Static File CORS**
**File:** `backend-api/server.js`

Added both domains to the upload CORS configuration.

## 🚀 Deployment Steps

### Step 1: Restart Backend Server
```bash
# On your backend server (api.benedictocollege-library.org)
cd backend-api
npm restart
# or
pm2 restart all
```

### Step 2: Deploy Updated Frontend
```bash
# Build with new configuration
npm run build:prod

# Deploy the dist/Library-Management-System-AI/browser/ folder
# to benedictocollege-library.org
```

### Step 3: Verify DNS Configuration
Ensure both subdomains point to correct servers:
```
benedictocollege-library.org → Frontend Server
api.benedictocollege-library.org → Backend Server
```

## 🔍 Testing the Fix

### 1. **Test Backend Directly**
```bash
# Should return API info
curl https://api.benedictocollege-library.org/api

# Should return health status
curl https://api.benedictocollege-library.org/
```

### 2. **Test CORS Headers**
```bash
# Check if CORS headers are present
curl -H "Origin: https://benedictocollege-library.org" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.benedictocollege-library.org/api/v1/auth
```

### 3. **Test Frontend Connection**
1. Open browser console on `https://benedictocollege-library.org`
2. Try to login with valid credentials
3. Check Network tab for API calls
4. Verify no CORS errors in console

## 🛠️ Troubleshooting

### Issue: Still Getting CORS Errors
**Check:**
1. Backend server restarted with new .env
2. Frontend rebuilt and deployed
3. Browser cache cleared
4. Correct domains in CORS configuration

### Issue: API Calls Going to Wrong URL
**Check:**
1. Frontend environment.prod.ts has correct API URL
2. Frontend was rebuilt after changes
3. Correct build deployed to frontend server

### Issue: 404 on API Calls
**Check:**
1. Backend server running on api.benedictocollege-library.org
2. DNS pointing to correct server
3. Firewall/proxy configuration

## 📊 Current Configuration Summary

### Frontend (benedictocollege-library.org)
```typescript
// Points to API subdomain
apiUrl: 'https://api.benedictocollege-library.org/api/v1'
backendUrl: 'https://api.benedictocollege-library.org'
```

### Backend (api.benedictocollege-library.org)
```bash
# Allows requests from frontend domain
ALLOWED_ORIGINS=https://benedictocollege-library.org,https://api.benedictocollege-library.org
```

## 🔒 Security Considerations

### 1. **HTTPS Only**
- Both domains use HTTPS
- No mixed content warnings
- Secure cookie transmission

### 2. **Specific Origins**
- Only allow specific domains
- No wildcard (*) origins in production
- Credentials enabled for authentication

### 3. **Headers Configuration**
```javascript
// Allowed headers for API requests
allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
```

## 🎯 Quick Verification Commands

```bash
# 1. Check backend is running
curl https://api.benedictocollege-library.org/

# 2. Check frontend loads
curl https://benedictocollege-library.org/

# 3. Test API endpoint
curl https://api.benedictocollege-library.org/api/v1/weather

# 4. Check CORS preflight
curl -X OPTIONS https://api.benedictocollege-library.org/api/v1/auth \
     -H "Origin: https://benedictocollege-library.org" \
     -H "Access-Control-Request-Method: POST"
```

## 📞 Next Steps

1. **Deploy the updated frontend** to benedictocollege-library.org
2. **Restart the backend** on api.benedictocollege-library.org
3. **Test login functionality** 
4. **Monitor browser console** for any remaining errors

The configuration is now properly set up for subdomain communication! 🎉
