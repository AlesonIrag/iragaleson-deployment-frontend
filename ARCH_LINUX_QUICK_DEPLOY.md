# 🐧 Arch Linux Quick Deployment Guide

## 🚀 One-Script Deployment

I've created an automated deployment script for Arch Linux that handles most of the setup for you.

### **Step 1: Run the Deployment Script**

```bash
# Make the script executable
chmod +x arch-linux-deploy.sh

# Run the deployment script
./arch-linux-deploy.sh
```

**This script will:**
- ✅ Update your Arch Linux system
- ✅ Install Node.js, npm, nginx, certbot
- ✅ Install PM2 globally
- ✅ Configure firewall (UFW)
- ✅ Setup Nginx with proper configuration
- ✅ Create helper scripts for management

### **Step 2: Upload Your Project**

```bash
# Upload your entire project directory to the server
scp -r Library-Management-System-AI/ user@your-server:/home/admin/benedictocollege-library/

# Or use rsync
rsync -avz Library-Management-System-AI/ user@your-server:/home/admin/benedictocollege-library/

# Or clone from Git (if you have it in a repository)
cd /home/admin/benedictocollege-library
git clone https://github.com/yourusername/Library-Management-System-AI.git .
```

### **Step 3: Setup Backend**

```bash
# Navigate to project directory
cd /home/admin/benedictocollege-library

# Install frontend dependencies
npm install

# Navigate to backend
cd backend-api

# Install backend dependencies
npm install

# Configure environment variables
cp .env.example .env
nano .env  # Edit with your database credentials
```

**Required .env variables:**
```bash
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name

# Server
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://benedictocollege-library.org,https://benedictocollege-library.org:3000

# Email (for notifications)
EMAIL_USER=benedictocollege.library@gmail.com
EMAIL_PASS=your_gmail_app_password

# API Keys
OPENWEATHER_API_KEY=e4f68ec96d6203c0ad97aa4ef8d4668d
```

### **Step 4: Build and Start Services**

```bash
# Build frontend
cd /home/admin/benedictocollege-library
npm run build:prod

# Start backend with PM2
cd backend-api
pm2 start server.js --name "library-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown by PM2
```

### **Step 5: Setup SSL Certificate**

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d benedictocollege-library.org -d www.benedictocollege-library.org

# Enable automatic renewal
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔧 Arch Linux Specific Commands

### **Package Management:**
```bash
# Update system
sudo pacman -Syu

# Install packages
sudo pacman -S package-name

# Search for packages
pacman -Ss search-term

# Remove packages
sudo pacman -R package-name
```

### **Service Management:**
```bash
# Enable service
sudo systemctl enable service-name

# Start service
sudo systemctl start service-name

# Check status
sudo systemctl status service-name

# Restart service
sudo systemctl restart service-name

# View logs
sudo journalctl -u service-name
```

### **Firewall (UFW):**
```bash
# Check status
sudo ufw status

# Allow port
sudo ufw allow port-number

# Enable/disable
sudo ufw enable
sudo ufw disable
```

## 🛠️ Helper Scripts Created

The deployment script creates two helper scripts in your home directory:

### **1. Deploy Updates Script:**
```bash
~/deploy-library.sh
```
**Use this when you make changes to your code:**
- Builds frontend
- Restarts backend
- Reloads Nginx

### **2. Status Check Script:**
```bash
~/check-library-status.sh
```
**Use this to check system health:**
- PM2 process status
- Nginx status
- Firewall status
- SSL certificate status
- Disk usage
- Recent logs

## 🔍 Testing Your Deployment

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

### **Test API:**
```bash
curl https://benedictocollege-library.org/api/v1/weather
# Should return weather data
```

## 🚨 Troubleshooting

### **Backend won't start:**
```bash
# Check logs
pm2 logs library-api

# Common issues:
# 1. Database connection failed
# 2. Port 3000 already in use
# 3. Missing environment variables
```

### **Frontend shows 404:**
```bash
# Check Nginx configuration
sudo nginx -t

# Check if files exist
ls -la /home/admin/benedictocollege-library/dist/Library-Management-System-AI/browser/

# Reload Nginx
sudo systemctl reload nginx
```

### **SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### **Database connection issues:**
```bash
# For MySQL/MariaDB
sudo systemctl status mariadb
sudo mysql -u root -p

# For PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql
```

## 📊 Monitoring

### **View Logs:**
```bash
# Backend logs
pm2 logs library-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -f
```

### **Performance Monitoring:**
```bash
# System resources
htop

# Disk usage
df -h

# Network connections
ss -tulpn
```

## 🎯 Expected Results

After successful deployment:

- ✅ **Frontend:** https://benedictocollege-library.org
- ✅ **Backend API:** https://benedictocollege-library.org/api/v1/*
- ✅ **Direct Backend:** https://benedictocollege-library.org:3000
- ✅ **Login functionality** working
- ✅ **No CORS errors** in browser console
- ✅ **SSL certificate** installed and working

## 📞 Quick Commands Reference

```bash
# Check everything
~/check-library-status.sh

# Deploy updates
~/deploy-library.sh

# Restart backend
pm2 restart library-api

# Reload Nginx
sudo systemctl reload nginx

# View backend logs
pm2 logs library-api

# Check SSL
sudo certbot certificates
```

Your Library Management System will be fully operational on Arch Linux! 🎉
