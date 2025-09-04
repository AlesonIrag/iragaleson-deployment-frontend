# 🖥️ Same-Server Deployment Guide

## 📋 Overview

Deploy both frontend and backend on the same server under `benedictocollege-library.org`. This is the most straightforward setup for your library management system.

## 🏗️ Architecture

```
benedictocollege-library.org (Your Server)
├── Frontend (Port 80/443) - Static files from /home/admin/
├── Backend API (Port 3000) - Node.js server
└── Database (Local or external)
```

## ✅ Current Configuration

### **Frontend Environment:**
```typescript
apiUrl: 'https://benedictocollege-library.org:3000/api/v1'
backendUrl: 'https://benedictocollege-library.org:3000'
```

### **Backend CORS:**
```bash
ALLOWED_ORIGINS=https://benedictocollege-library.org,https://benedictocollege-library.org:3000
```

## 🚀 Deployment Steps

### **Step 1: Prepare Your Server**

#### **Install Required Software:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (18.x LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install SSL certificate tool
sudo apt install certbot python3-certbot-nginx -y
```

### **Step 2: Upload Your Project**

```bash
# On your server, create project directory
mkdir -p /home/admin/benedictocollege-library

# Upload your entire project directory
# Use SCP, SFTP, or Git clone
scp -r Library-Management-System-AI/ user@your-server:/home/admin/benedictocollege-library/
```

### **Step 3: Setup Backend**

```bash
# Navigate to backend directory
cd /home/admin/benedictocollege-library/backend-api

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
nano .env  # Edit with your database credentials

# Test backend
npm start
# Should show: "🚀 Server running on 0.0.0.0:3000"
```

### **Step 4: Setup Frontend**

```bash
# Navigate to project root
cd /home/admin/benedictocollege-library

# Install frontend dependencies
npm install

# Build for production
npm run build:prod

# Built files will be in: dist/Library-Management-System-AI/browser/
```

### **Step 5: Configure Nginx**

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/benedictocollege-library
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name benedictocollege-library.org www.benedictocollege-library.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name benedictocollege-library.org www.benedictocollege-library.org;
    
    # SSL Configuration (will be added by certbot)
    
    # Frontend - Serve static files
    location / {
        root /home/admin/benedictocollege-library/dist/Library-Management-System-AI/browser;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # Backend API - Proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/benedictocollege-library/dist/Library-Management-System-AI/browser;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/benedictocollege-library /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### **Step 6: Setup SSL Certificate**

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d benedictocollege-library.org -d www.benedictocollege-library.org

# Test auto-renewal
sudo certbot renew --dry-run
```

### **Step 7: Setup Process Management**

```bash
# Navigate to backend directory
cd /home/admin/benedictocollege-library/backend-api

# Start backend with PM2
pm2 start server.js --name "library-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

## 🔧 Alternative Port Configuration

### **Option A: Standard Ports (Recommended)**
- **Frontend:** Port 80/443 (via Nginx)
- **Backend:** Port 3000 (proxied by Nginx)
- **Access:** https://benedictocollege-library.org

### **Option B: Direct Port Access**
- **Frontend:** Port 4200
- **Backend:** Port 3000
- **Access:** https://benedictocollege-library.org:4200

For Option B, update your production script:

```bash
# Start both services
cd /home/admin/benedictocollege-library
./start-production.bat
```

## 🔍 Testing Your Deployment

### **Test Frontend:**
```bash
curl https://benedictocollege-library.org
# Should return HTML content
```

### **Test Backend:**
```bash
curl https://benedictocollege-library.org:3000/
# Should return: {"success":true,"message":"🚀 Backend API Server is running!"}

curl https://benedictocollege-library.org:3000/api/v1/weather
# Should return weather data
```

### **Test Communication:**
1. Visit https://benedictocollege-library.org
2. Try to login with valid credentials
3. Check browser console for errors
4. Verify API calls in Network tab

## 🛠️ Troubleshooting

### **Issue: Frontend Loads but API Calls Fail**

**Check:**
1. Backend is running: `pm2 status`
2. Port 3000 is accessible: `curl localhost:3000`
3. Firewall allows port 3000: `sudo ufw allow 3000`
4. CORS configuration includes your domain

### **Issue: "allowedHosts" Error**

**Solution:** You're using the production build, so this shouldn't happen. If it does:
1. Ensure you're serving static files, not running `ng serve`
2. Use the production script: `./start-production.bat`

### **Issue: SSL Certificate Problems**

**Check:**
1. Domain points to your server IP
2. Ports 80 and 443 are open
3. Nginx configuration is correct
4. Run certbot again if needed

### **Issue: Database Connection Failed**

**Check:**
1. Database service is running
2. Credentials in `.env` are correct
3. Database allows connections from localhost
4. Check backend logs: `pm2 logs library-api`

## 📊 Monitoring

### **Check Services:**
```bash
# Check PM2 processes
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check backend logs
pm2 logs library-api

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **Restart Services:**
```bash
# Restart backend
pm2 restart library-api

# Restart Nginx
sudo systemctl restart nginx

# Restart all
pm2 restart all && sudo systemctl restart nginx
```

## 🔒 Security Checklist

- ✅ **SSL Certificate** installed and auto-renewing
- ✅ **Firewall** configured (UFW or iptables)
- ✅ **SSH Key** authentication (disable password login)
- ✅ **Regular Updates** scheduled
- ✅ **Database** secured with strong passwords
- ✅ **Environment Variables** protected (not in Git)
- ✅ **CORS** properly configured
- ✅ **Rate Limiting** enabled in backend

## 🎯 Final Architecture

```
Internet → Cloudflare → Your Server (benedictocollege-library.org)
                        ├── Nginx (Port 80/443)
                        │   ├── Frontend (Static Files)
                        │   └── API Proxy → Backend (Port 3000)
                        ├── Node.js Backend (Port 3000)
                        └── Database (Local/External)
```

## 📞 Quick Commands

```bash
# Deploy new frontend changes
npm run build:prod
sudo systemctl reload nginx

# Deploy new backend changes
cd backend-api
pm2 restart library-api

# Check everything is working
curl https://benedictocollege-library.org
curl https://benedictocollege-library.org:3000/api
```

This setup gives you full control over your deployment while keeping everything on one server! 🚀
