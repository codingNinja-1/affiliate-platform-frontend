@echo off
REM Simple SSH deployment to Hostinger using SCP

setlocal enabledelayedexpansion

set SSH_HOST=82.198.227.1
set SSH_PORT=65002
set SSH_USER=u615005912
set BACKEND_REMOTE=domains/snow-mantis-616662.hostingersite.com/public_html/backend

echo.
echo 🚀 DEPLOYING BACKEND TO HOSTINGER
echo Host: %SSH_HOST%:%SSH_PORT%
echo User: %SSH_USER%
echo.

REM Step 1: Upload backend files
echo 📦 Uploading backend files...
echo.

cd backend
for /r %%F in (*) do (
    set "file=%%~nxF"
    set "path=%%~dpF"
    set "path=!path:%cd%=!"
    echo Uploading !file!...
    scp -P %SSH_PORT% "%%F" "%SSH_USER%@%SSH_HOST%:%BACKEND_REMOTE%/!path!" > nul 2>&1
)
cd ..

if errorlevel 1 (
    echo ❌ Upload failed
    exit /b 1
)

echo ✅ Backend uploaded
echo.

REM Step 2: Run setup commands
echo 🔧 Setting up backend on server...
echo.

ssh -p %SSH_PORT% %SSH_USER%@%SSH_HOST% ^
  "cd %BACKEND_REMOTE% && ^
   echo Installing Composer dependencies... && ^
   composer install --optimize-autoloader --no-dev && ^
   echo Caching config... && ^
   php artisan config:cache && ^
   echo Caching routes... && ^
   php artisan route:cache && ^
   echo Caching views... && ^
   php artisan view:cache && ^
   echo Setting permissions... && ^
   chmod -R 755 storage bootstrap/cache && ^
   echo ✅ Backend ready!"

echo.
echo ═══════════════════════════════════════
echo ✅ DEPLOYMENT COMPLETE
echo ═══════════════════════════════════════
echo.
echo 📋 Next steps:
echo 1. SSH in: ssh -p 65002 u615005912@82.198.227.1
echo 2. Run migrations:
echo    cd domains/snow-mantis-616662.hostingersite.com/public_html/backend
echo    php artisan migrate --force
echo 3. Generate VAPID keys:
echo    php artisan vapid:generate
echo.

pause
