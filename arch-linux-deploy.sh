#!/bin/bash

# Arch Linux Deployment Script for Benedicto College Library Management System
# Run this script on your Arch Linux server

set -e  # Exit on any error

echo "=========================================="
echo "Benedicto College Library - Arch Linux Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Variables
PROJECT_DIR="/home/admin/benedictocollege-library"
DOMAIN="benedictocollege-library.org"
NGINX_SITE="/etc/nginx/sites-available/benedictocollege-library"

print_step "Step 1: Updating system and installing dependencies"

# Update system
print_status "Updating system packages..."
sudo pacman -Syu --noconfirm

# Install required packages
print_status "Installing Node.js, npm, nginx, and certbot..."
sudo pacman -S --noconfirm nodejs npm nginx certbot certbot-nginx git

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

print_step "Step 2: Setting up project directory"

# Create project directory
print_status "Creating project directory at $PROJECT_DIR"
mkdir -p $PROJECT_DIR

print_step "Step 3: Configuring firewall"

# Install and configure UFW if not present
if ! command -v ufw &> /dev/null; then
    print_status "Installing UFW firewall..."
    sudo pacman -S --noconfirm ufw
fi

print_status "Configuring firewall rules..."
sudo systemctl enable ufw
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 4200/tcp  # Frontend (optional)
sudo ufw --force enable

print_step "Step 4: Configuring Nginx"

# Enable and start Nginx
print_status "Starting and enabling Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Create sites-available and sites-enabled directories (Arch doesn't have them by default)
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Update main nginx.conf to include sites-enabled
if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
    print_status "Updating nginx.conf to include sites-enabled..."
    sudo sed -i '/http {/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
fi

# Create Nginx site configuration
print_status "Creating Nginx site configuration..."
sudo tee $NGINX_SITE > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration will be added by certbot
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend - Serve static files
    location / {
        root $PROJECT_DIR/dist/Library-Management-System-AI/browser;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache control for HTML files
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Backend API - Proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://$DOMAIN" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root $PROJECT_DIR/dist/Library-Management-System-AI/browser;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf $NGINX_SITE /etc/nginx/sites-enabled/

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

print_step "Step 5: Instructions for project deployment"

print_warning "MANUAL STEPS REQUIRED:"
echo ""
echo "1. Upload your project files to: $PROJECT_DIR"
echo "   You can use scp, rsync, or git clone:"
echo "   scp -r Library-Management-System-AI/ user@your-server:$PROJECT_DIR/"
echo ""
echo "2. Navigate to the project directory and install dependencies:"
echo "   cd $PROJECT_DIR"
echo "   npm install"
echo ""
echo "3. Setup the backend:"
echo "   cd $PROJECT_DIR/backend-api"
echo "   npm install"
echo "   cp .env.example .env"
echo "   nano .env  # Edit with your database credentials"
echo ""
echo "4. Build the frontend:"
echo "   cd $PROJECT_DIR"
echo "   npm run build:prod"
echo ""
echo "5. Start the backend with PM2:"
echo "   cd $PROJECT_DIR/backend-api"
echo "   pm2 start server.js --name 'library-api'"
echo "   pm2 save"
echo "   pm2 startup  # Follow the instructions shown"
echo ""
echo "6. Setup SSL certificate:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "7. Enable automatic SSL renewal:"
echo "   sudo systemctl enable certbot-renew.timer"
echo "   sudo systemctl start certbot-renew.timer"
echo ""

print_step "Step 6: Creating helper scripts"

# Create deployment helper script
cat > $HOME/deploy-library.sh << 'EOF'
#!/bin/bash

# Helper script for deploying updates

PROJECT_DIR="/home/admin/benedictocollege-library"

echo "Deploying Library Management System updates..."

# Build frontend
echo "Building frontend..."
cd $PROJECT_DIR
npm run build:prod

# Restart backend
echo "Restarting backend..."
pm2 restart library-api

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "Deployment complete!"
echo "Frontend: https://benedictocollege-library.org"
echo "Backend: https://benedictocollege-library.org:3000"
EOF

chmod +x $HOME/deploy-library.sh

# Create status check script
cat > $HOME/check-library-status.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "Library Management System Status"
echo "=========================================="

echo "PM2 Processes:"
pm2 status

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "Firewall Status:"
sudo ufw status

echo ""
echo "SSL Certificate Status:"
sudo certbot certificates

echo ""
echo "Disk Usage:"
df -h /home/admin/benedictocollege-library

echo ""
echo "Recent Backend Logs:"
pm2 logs library-api --lines 10 --nostream
EOF

chmod +x $HOME/check-library-status.sh

print_status "Created helper scripts:"
print_status "  - $HOME/deploy-library.sh (for deploying updates)"
print_status "  - $HOME/check-library-status.sh (for checking system status)"

print_step "Deployment script completed!"

echo ""
print_status "System is ready for your Library Management System!"
print_warning "Please follow the manual steps above to complete the deployment."
echo ""
print_status "Useful commands:"
echo "  - Check status: $HOME/check-library-status.sh"
echo "  - Deploy updates: $HOME/deploy-library.sh"
echo "  - View backend logs: pm2 logs library-api"
echo "  - Restart services: pm2 restart library-api && sudo systemctl reload nginx"
echo ""
print_status "Your site will be available at: https://$DOMAIN"
echo "=========================================="
