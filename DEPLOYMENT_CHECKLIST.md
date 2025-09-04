# 🚀 Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Configuration Check
- [ ] Run `node validate-production.js` - all checks pass
- [ ] Run `check-production-config.bat` - all checks pass
- [ ] Backend `.env` file contains `benedictocollege-library.org` in CORS
- [ ] Production environment points to correct backend URL
- [ ] Database is accessible and configured

### ✅ Build Check
- [ ] `npm run build:prod` completes successfully
- [ ] `dist/Library-Management-System-AI/browser/` folder exists
- [ ] `index.html` exists in build folder
- [ ] Static assets (JS, CSS) are present

### ✅ Dependencies
- [ ] `http-server` is installed globally
- [ ] Backend dependencies are installed (`cd backend-api && npm install`)
- [ ] All required environment variables are set

## Deployment Options

### Option 1: Quick Fix (Temporary)
**Use this if you need immediate access:**

1. **Stop current servers**
2. **Start with allowed hosts:**
   ```bash
   # Backend
   cd backend-api && npm start
   
   # Frontend (with domain allowed)
   ng serve --host 0.0.0.0 --disable-host-check
   ```

### Option 2: Proper Production (Recommended)
**Use this for stable production deployment:**

1. **Build and validate:**
   ```bash
   npm run build:prod
   node validate-production.js
   ```

2. **Start production servers:**
   ```bash
   ./start-production.bat
   ```

3. **Verify services:**
   - Frontend: http://localhost:4200
   - Backend: http://localhost:3000

## Cloudflare Configuration

### DNS Settings
```
Type: A
Name: @
Content: <your-server-ip>
Proxy: ✅ Enabled

Type: A
Name: www  
Content: <your-server-ip>
Proxy: ✅ Enabled
```

### Port Forwarding (if needed)
- Port 80 → 4200 (Frontend)
- Port 443 → 4200 (Frontend SSL)
- Port 3000 → 3000 (Backend API)

### Cloudflare Page Rules
```
URL: benedictocollege-library.org/*
Settings:
- Cache Level: Standard
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 2 hours
```

## Testing Checklist

### ✅ Frontend Tests
- [ ] Homepage loads: `https://benedictocollege-library.org`
- [ ] Navigation works (no 404 on refresh)
- [ ] Static assets load (CSS, JS, images)
- [ ] No console errors in browser

### ✅ Backend Tests
- [ ] API health check: `https://benedictocollege-library.org:3000`
- [ ] Weather API: `https://benedictocollege-library.org:3000/api/v1/weather`
- [ ] CORS headers present in responses
- [ ] Database connections working

### ✅ Integration Tests
- [ ] Frontend can connect to backend
- [ ] Login functionality works
- [ ] API calls succeed (check browser network tab)
- [ ] No CORS errors in console

## Troubleshooting Guide

### Issue: "allowedHosts" Error
**Symptoms:** Vite error about blocked host
**Solution:** 
1. Stop `ng serve`
2. Use `start-production.bat` instead
3. Serve static files, not development server

### Issue: CORS Errors
**Symptoms:** API calls fail with CORS error
**Solution:**
1. Check backend `.env` has correct `ALLOWED_ORIGINS`
2. Restart backend server
3. Verify headers in browser network tab

### Issue: 404 on Page Refresh
**Symptoms:** Angular routes return 404
**Solution:**
1. Ensure `_redirects` file exists in `public/`
2. Configure server to serve `index.html` for all routes
3. Check nginx/apache configuration

### Issue: API Calls to Wrong URL
**Symptoms:** Network errors, wrong endpoints
**Solution:**
1. Check `src/environments/environment.prod.ts`
2. Rebuild: `npm run build:prod`
3. Restart frontend server

## Performance Checklist

### ✅ Optimization
- [ ] Gzip compression enabled
- [ ] Static assets cached (1 year)
- [ ] HTML files not cached
- [ ] CDN enabled (Cloudflare)
- [ ] Images optimized

### ✅ Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] No sensitive data in frontend
- [ ] Environment variables secured

## Monitoring

### ✅ Health Checks
- [ ] Frontend health: `https://benedictocollege-library.org/health`
- [ ] Backend health: `https://benedictocollege-library.org:3000`
- [ ] Database connectivity
- [ ] API response times

### ✅ Logs
- [ ] Backend logs accessible
- [ ] Error tracking configured
- [ ] Performance monitoring
- [ ] Uptime monitoring

## Rollback Plan

### If Deployment Fails:
1. **Revert to development mode:**
   ```bash
   npm run start:separated
   ```

2. **Check logs:**
   - Browser console
   - Backend server logs
   - Cloudflare logs

3. **Common fixes:**
   - Rebuild: `npm run build:prod`
   - Restart servers: `./start-production.bat`
   - Check configuration: `node validate-production.js`

## Quick Commands Reference

```bash
# Full deployment
npm run build:prod && ./start-production.bat

# Check configuration
node validate-production.js

# Test backend only
cd backend-api && npm start

# Test frontend only (static)
npx http-server dist/Library-Management-System-AI/browser -p 4200

# Emergency development mode
npm run start:separated
```

## Support Contacts

- **Technical Issues:** Check browser console and backend logs
- **Cloudflare Issues:** Check Cloudflare dashboard
- **DNS Issues:** Verify DNS propagation with online tools

---

**Remember:** Always test in a staging environment before deploying to production!
