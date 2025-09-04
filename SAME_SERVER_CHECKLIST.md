# ✅ Same-Server Deployment Checklist

## 🎯 Quick Setup for benedictocollege-library.org

### **Current Configuration:**
- ✅ Frontend points to: `https://benedictocollege-library.org:3000/api/v1`
- ✅ Backend allows: `https://benedictocollege-library.org`
- ✅ Production build ready in: `dist/Library-Management-System-AI/browser/`

## 📋 Deployment Steps

### **Step 1: Server Preparation (Arch Linux)**
```bash
# Update system
sudo pacman -Syu

# Install Node.js and npm
sudo pacman -S nodejs npm

# Install PM2 for backend management
sudo npm install -g pm2

# Install Nginx for frontend serving
sudo pacman -S nginx

# Install SSL certificate tool
sudo pacman -S certbot certbot-nginx

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### **Step 2: Upload Your Project**
```bash
# Create directory
mkdir -p /home/admin/benedictocollege-library

# Upload your entire project folder to:
# /home/admin/benedictocollege-library/
```

### **Step 3: Setup Backend**
```bash
cd /home/admin/benedictocollege-library/backend-api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Add your database credentials

# Start with PM2
pm2 start server.js --name "library-api"
pm2 save
pm2 startup  # Follow instructions
```

### **Step 4: Setup Frontend**
```bash
cd /home/admin/benedictocollege-library

# Install dependencies & build
npm install
npm run build:prod

# Built files are now in: dist/Library-Management-System-AI/browser/
```

### **Step 5: Configure Nginx**
```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/benedictocollege-library
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name benedictocollege-library.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name benedictocollege-library.org;
    
    # Frontend - Static files
    location / {
        root /home/admin/benedictocollege-library/dist/Library-Management-System-AI/browser;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API - Proxy to port 3000
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/benedictocollege-library /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 6: Setup SSL (Arch Linux)**
```bash
# Get SSL certificate (certbot already installed in Step 1)
sudo certbot --nginx -d benedictocollege-library.org

# Enable automatic renewal
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔍 Testing

### **Test Backend:**
```bash
curl http://localhost:3000/
# Should return: {"success":true,"message":"🚀 Backend API Server is running!"}
```

### **Test Frontend:**
```bash
curl https://benedictocollege-library.org
# Should return HTML content
```

### **Test API through Nginx:**
```bash
curl https://benedictocollege-library.org/api/v1/weather
# Should return weather data
```

## 🚨 Common Issues & Solutions

### **Issue: API calls fail with CORS error**
**Solution:**
```bash
# Check backend CORS configuration
grep ALLOWED_ORIGINS /home/admin/benedictocollege-library/backend-api/.env

# Should include: https://benedictocollege-library.org
# Restart backend: pm2 restart library-api
```

### **Issue: Frontend shows 404 on refresh**
**Solution:**
```bash
# Check Nginx configuration has:
# try_files $uri $uri/ /index.html;

# Reload Nginx: sudo systemctl reload nginx
```

### **Issue: Backend not starting**
**Solution:**
```bash
# Check logs
pm2 logs library-api

# Common fixes:
# 1. Check database connection
# 2. Verify .env file exists
# 3. Check port 3000 is available
```

### **Issue: SSL certificate problems**
**Solution:**
```bash
# Ensure domain points to your server
# Check ports 80/443 are open
# Re-run certbot if needed
```

## 🔧 Alternative: Simple Port-Based Setup

If you prefer to keep it simple without Nginx:

### **Frontend (Port 4200):**
```bash
cd /home/admin/benedictocollege-library
./start-production.bat
```

### **Access:**
- **Frontend:** https://benedictocollege-library.org:4200
- **Backend:** https://benedictocollege-library.org:3000

### **Firewall (Arch Linux):**
```bash
# Install and configure firewall (if not already done)
sudo pacman -S ufw
sudo systemctl enable ufw
sudo systemctl start ufw

# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Backend API
sudo ufw allow 4200  # Frontend (if using direct port access)

# Enable firewall
sudo ufw enable
```

## 📊 Final Architecture

```
benedictocollege-library.org
├── Nginx (Port 80/443)
│   ├── Frontend (Static files)
│   └── /api/* → Backend (Port 3000)
├── Node.js Backend (Port 3000)
└── Database (Local/External)
```

## 🎯 Success Criteria

- ✅ https://benedictocollege-library.org loads frontend
- ✅ Login functionality works
- ✅ API calls succeed (check browser Network tab)
- ✅ No CORS errors in console
- ✅ Backend accessible at port 3000
- ✅ SSL certificate working

## 📞 Quick Commands

```bash
# Check services
pm2 status
sudo systemctl status nginx

# Restart services
pm2 restart library-api
sudo systemctl reload nginx

# View logs
pm2 logs library-api
sudo tail -f /var/log/nginx/error.log

# Deploy updates
npm run build:prod  # Frontend
pm2 restart library-api  # Backend
```

**Your library management system will be fully functional on benedictocollege-library.org! 🎉**
