# Hostinger Deployment Guide

## Part 1: Deploy Laravel Backend to Hostinger

### Step 1: Purchase Hostinger Plan
1. Go to https://www.hostinger.com
2. Choose **Premium Web Hosting** or **Business Web Hosting** (supports Laravel)
3. Get a domain or use existing one
4. Complete purchase

### Step 2: Setup Database on Hostinger
1. Login to **Hostinger hPanel**
2. Go to **Databases** → **MySQL Databases**
3. Click **Create New Database**
4. Database Name: `affiliate_platform`
5. Username: `affiliate_user`
6. Password: Create strong password
7. Save credentials!

### Step 3: Upload Laravel Files via FTP/SFTP

**Option A: Using FileZilla (Recommended)**
1. Download FileZilla: https://filezilla-project.org
2. Get SFTP credentials from hPanel → **Files** → **FTP Accounts**
3. Connect:
   - Host: `ftp.yourdomain.com`
   - Username: `u123456789`
   - Password: Your SFTP password
   - Port: 21 (FTP) or 22 (SFTP)

4. Upload structure:
   ```
   public_html/
   ├── affiliate-backend/  (Upload entire backend folder here)
   │   ├── app/
   │   ├── bootstrap/
   │   ├── config/
   │   ├── database/
   │   ├── public/
   │   ├── routes/
   │   ├── storage/
   │   ├── vendor/
   │   ├── .env
   │   ├── artisan
   │   └── composer.json
   ```

**Option B: Using Hostinger File Manager**
1. Go to hPanel → **Files** → **File Manager**
2. Navigate to `public_html`
3. Create folder `affiliate-backend`
4. Upload all backend files (use ZIP for faster upload)

### Step 4: Configure .env on Hostinger
1. Open File Manager → Navigate to `affiliate-backend`
2. Find `.env` file (or copy from `.env.example`)
3. Edit with these settings:

```env
APP_NAME="AffiliateHub"
APP_ENV=production
APP_KEY=base64:YOUR_KEY_HERE  # Run php artisan key:generate locally first
APP_DEBUG=false  # IMPORTANT: Set to false in production!
APP_URL=https://yourdomain.com

FRONTEND_URL=https://your-vercel-app.vercel.app

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u123456789_affiliate_platform
DB_USERNAME=u123456789_affiliate_user
DB_PASSWORD=your_database_password

# Use your existing mail settings
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=admin@timilehinaruaji.com.ng
MAIL_PASSWORD=Adedamola001$
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="admin@timilehinaruaji.com.ng"
MAIL_FROM_NAME="AffiliateHub"

# Paystack settings (copy from local .env)
PAYSTACK_PUBLIC_KEY=your_key
PAYSTACK_SECRET_KEY=your_secret
```

### Step 5: Install Composer Dependencies via SSH

**Enable SSH in Hostinger:**
1. Go to hPanel → **Advanced** → **SSH Access**
2. Enable SSH
3. Note credentials

**Connect via SSH:**
```bash
ssh u123456789@yourdomain.com
# Enter password

# Navigate to backend folder
cd public_html/affiliate-backend

# Install dependencies
composer install --optimize-autoloader --no-dev

# Run migrations
php artisan migrate --force

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage symlink
php artisan storage:link

# Set correct permissions
chmod -R 775 storage bootstrap/cache
```

### Step 6: Point Domain to Backend API

**Option A: Use Subdomain (Recommended)**
1. In hPanel → **Domains** → **Subdomains**
2. Create: `api.yourdomain.com`
3. Point to `/public_html/affiliate-backend/public`

**Option B: Use Main Domain**
1. In hPanel → **Domains** → Select your domain
2. Change document root to `/public_html/affiliate-backend/public`

### Step 7: Enable HTTPS
1. hPanel → **Security** → **SSL**
2. Enable **Free SSL Certificate** (Let's Encrypt)
3. Wait 5-10 minutes for activation

---

## Part 2: Deploy Next.js Frontend to Vercel

### Step 1: Prepare Frontend for Production
Update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Step 2: Push to GitHub
```bash
cd frontend
git init
git add .
git commit -m "Initial deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/affiliate-frontend.git
git push -u origin main
```

### Step 3: Deploy to Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **New Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (or select frontend folder)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   
6. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com/api`

7. Click **Deploy**
8. Wait 2-3 minutes

### Step 4: Get Vercel URL
After deployment, Vercel gives you: `https://your-project.vercel.app`

### Step 5: Update Laravel Backend with Frontend URL
Go back to Hostinger File Manager:
1. Edit `affiliate-backend/.env`
2. Update: `FRONTEND_URL=https://your-project.vercel.app`
3. Save
4. SSH in and run: `php artisan config:cache`

### Step 6: (Optional) Add Custom Domain to Vercel
1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add: `app.yourdomain.com`
3. Add DNS records in Hostinger:
   - Type: `CNAME`
   - Name: `app`
   - Value: `cname.vercel-dns.com`

---

## Part 3: Testing & Final Checks

### Test Backend API
Visit: `https://api.yourdomain.com/api/products`
Should return JSON response

### Test Frontend
Visit: `https://your-project.vercel.app`
Should load the affiliate platform

### Test Full Flow
1. Register as vendor
2. Create product
3. Register as affiliate
4. Generate affiliate link
5. Make test purchase with Paystack
6. Verify email received
7. Check commission recorded

---

## Troubleshooting

### "500 Internal Server Error"
- Check Laravel logs: `storage/logs/laravel.log`
- Verify file permissions: `chmod -R 775 storage bootstrap/cache`
- Check `.env` configuration
- Clear cache: `php artisan cache:clear`

### Database Connection Error
- Verify DB credentials in `.env`
- Check database exists in Hostinger MySQL
- Ensure DB host is `localhost`

### CORS Errors in Frontend
Backend should have CORS configured in `config/cors.php`:
```php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:3000')
],
```

### Migrations Fail
Run via SSH:
```bash
php artisan migrate:fresh --force --seed
```

---

## Maintenance Commands

### Update Backend
```bash
ssh u123456789@yourdomain.com
cd public_html/affiliate-backend
git pull origin main  # If using Git
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Update Frontend
Just push to GitHub:
```bash
git add .
git commit -m "Update"
git push
# Vercel auto-deploys on push
```

### View Logs
```bash
# Laravel logs
ssh u123456789@yourdomain.com
cd public_html/affiliate-backend
tail -f storage/logs/laravel.log

# PHP errors
# Check via hPanel → Error Logs
```

---

## Costs
- **Hostinger Premium Hosting:** ~$3-7/month
- **Domain:** ~$10/year
- **Vercel Frontend:** FREE (for personal/small projects)
- **Total:** ~$5-10/month

---

## Security Checklist
- [x] Set `APP_DEBUG=false` in production
- [x] Use strong DB passwords
- [x] Enable HTTPS/SSL
- [x] Restrict `.env` file access
- [x] Keep Laravel & dependencies updated
- [x] Use Paystack LIVE keys (not test keys)
- [x] Set proper CORS origins
- [x] Enable 2FA on Hostinger account
