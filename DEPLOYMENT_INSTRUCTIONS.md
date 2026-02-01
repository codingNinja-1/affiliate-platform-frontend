# Hostinger SSH Deployment Instructions

## Prerequisites
- SSH access to Hostinger (credentials from hPanel → Settings → SSH Access)
- PuTTY or any SSH client installed

## Hostinger SSH Connection Details
Get these from your hPanel:
1. **Host:** `snow-mantis-616662.hostingersite.com` (or your server IP)
2. **Port:** 22 (or custom port if configured)
3. **Username:** Usually starts with `u` followed by numbers (e.g., `u123456789`)
4. **Password:** Your Hostinger SSH password

## Step-by-Step Deployment via SSH

### 1. Connect via SSH
```bash
# Using PowerShell or command line
ssh username@snow-mantis-616662.hostingersite.com
# Enter password when prompted
```

### 2. Navigate to Your Deployment Directory
```bash
# Assuming backend is in public_html/affiliate-backend or similar
cd public_html/affiliate-backend
# or
cd public_html/api
```

### 3. Pull Latest Backend Changes
```bash
# Check current branch and status
git status
git branch

# Make sure you're on the correct branch (usually main or master)
git checkout master  # or main

# Pull the latest changes from GitHub
git pull origin master
```

### 4. Install Dependencies
```bash
# Install/update Composer dependencies
composer install --optimize-autoloader --no-dev
```

### 5. Clear Cache
```bash
# Clear all caches to ensure latest code is used
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan cache:clear
```

### 6. Database Migrations (if needed)
```bash
# Run any pending migrations
php artisan migrate --force
```

### 7. Verify Deployment
```bash
# Check if API is responding
curl https://snow-mantis-616662.hostingersite.com/api/products

# Or visit in browser:
# https://snow-mantis-616662.hostingersite.com/api/products
```

---

## What Was Changed in This Update

### Backend Changes Deployed:
1. **Fixed Vendor Dashboard Controller** 
   - Now fetches real vendor data from database instead of hardcoded values
   - Properly calculates pending payouts from pending withdrawals
   - File: `app/Http/Controllers/Vendor/DashboardController.php`

2. **Added Affiliate Settings Routes**
   - New routes for affiliate currency preferences
   - File: `routes/api.php`
   - Routes added:
     - `GET /api/affiliate/settings` - Get affiliate settings
     - `POST /api/affiliate/settings/currency` - Update currency preference

### Frontend Changes Deployed to GitHub:
1. **Password Visibility Toggle** - Eye icon on login page
2. **Currency Selection for Affiliates** - Now affiliates can change display currency
3. **Withdrawal Buttons** - Added to both affiliate and vendor dashboards
4. **Hot Products Billboard** - Shows top-performing products on affiliate dashboard

---

## Quick Reference Command
One-liner to deploy all changes:
```bash
cd public_html/affiliate-backend && git pull origin master && composer install --optimize-autoloader --no-dev && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan cache:clear
```

---

## If You Encounter Issues

### Git SSL Certificate Issues
```bash
git config --global http.sslVerify false
git pull origin master
```

### Permission Denied on Storage
```bash
chmod -R 775 storage bootstrap/cache
```

### Composer Out of Memory
```bash
php -d memory_limit=512M /usr/bin/composer install --optimize-autoloader --no-dev
```

### Check Logs
```bash
tail -f storage/logs/laravel.log
```

---

## Contact Support
If deployment fails, check:
1. Hostinger server logs: `tail -f storage/logs/laravel.log`
2. Web server error logs in hPanel
3. Database connection in `.env` file
4. Composer and PHP versions match requirements
