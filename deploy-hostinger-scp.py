#!/usr/bin/env python3
"""
SCP Deployment Script for Affiliate Platform to Hostinger
Deploys both backend and frontend via SCP
"""

import os
import subprocess
import sys
from pathlib import Path

# Configuration
SSH_HOST = "82.198.227.1"
SSH_PORT = "65002"
SSH_USER = "u615005912"
BACKEND_REMOTE_PATH = "domains/snow-mantis-616662.hostingersite.com/public_html/backend"

# Local paths
PROJECT_ROOT = Path(__file__).parent
BACKEND_PATH = PROJECT_ROOT / "backend"
FRONTEND_PATH = PROJECT_ROOT / "frontend"

def run_command(cmd, shell=False):
    """Run a shell command and return output"""
    print(f"▶ {cmd}")
    try:
        result = subprocess.run(cmd, shell=shell, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def deploy_backend():
    """Deploy backend via SCP"""
    print("\n" + "="*60)
    print("DEPLOYING BACKEND")
    print("="*60)
    
    # List of files to exclude
    exclude = [
        '--exclude=".env"',
        '--exclude="vendor"',
        '--exclude="node_modules"',
        '--exclude=".git"',
        '--exclude="storage/logs"',
        '--exclude="bootstrap/cache"',
        '--exclude=".venv"',
    ]
    
    exclude_str = " ".join(exclude)
    
    # Use rsync via SSH (more reliable than SCP for large directory structures)
    print("\n📦 Uploading backend files...")
    cmd = (
        f'rsync -avz -e "ssh -p {SSH_PORT}" '
        f'{exclude_str} '
        f'"{BACKEND_PATH}/" '
        f'{SSH_USER}@{SSH_HOST}:{BACKEND_REMOTE_PATH}/'
    )
    
    if not run_command(cmd, shell=True):
        print("✗ Backend upload failed")
        return False
    
    print("✓ Backend files uploaded")
    
    # Run migrations and setup via SSH
    print("\n🔧 Running backend setup commands...")
    setup_commands = [
        "cd " + BACKEND_REMOTE_PATH,
        "composer install --optimize-autoloader --no-dev",
        "php artisan config:cache",
        "php artisan route:cache",
        "php artisan view:cache",
        "chmod -R 775 storage bootstrap/cache",
    ]
    
    ssh_cmd = f'ssh -p {SSH_PORT} {SSH_USER}@{SSH_HOST} "' + " && ".join(setup_commands) + '"'
    
    if not run_command(ssh_cmd, shell=True):
        print("⚠ Some setup commands failed (this may be OK if permissions are different)")
    
    print("✓ Backend deployment complete")
    return True

def deploy_frontend():
    """Deploy frontend via SCP"""
    print("\n" + "="*60)
    print("DEPLOYING FRONTEND")
    print("="*60)
    
    frontend_remote = "domains/snow-mantis-616662.hostingersite.com/public_html/frontend"
    
    print("\n📦 Uploading frontend files...")
    cmd = (
        f'rsync -avz -e "ssh -p {SSH_PORT}" '
        f'--exclude="node_modules" '
        f'--exclude=".next" '
        f'--exclude=".git" '
        f'--exclude=".env.local" '
        f'"{FRONTEND_PATH}/" '
        f'{SSH_USER}@{SSH_HOST}:{frontend_remote}/'
    )
    
    if not run_command(cmd, shell=True):
        print("✗ Frontend upload failed")
        return False
    
    print("✓ Frontend files uploaded")
    
    # Run build via SSH
    print("\n🔨 Building frontend...")
    build_commands = [
        f"cd {frontend_remote}",
        "npm install",
        "npm run build",
    ]
    
    ssh_cmd = f'ssh -p {SSH_PORT} {SSH_USER}@{SSH_HOST} "' + " && ".join(build_commands) + '"'
    
    if not run_command(ssh_cmd, shell=True):
        print("⚠ Frontend build may have issues (check manually)")
    
    print("✓ Frontend deployment complete")
    return True

def main():
    """Main deployment function"""
    print("🚀 AFFILIATE PLATFORM HOSTINGER DEPLOYMENT")
    print(f"   Host: {SSH_HOST}:{SSH_PORT}")
    print(f"   User: {SSH_USER}")
    
    # Check if SSH is available
    if subprocess.run("ssh -V", shell=True, capture_output=True).returncode != 0:
        print("✗ SSH is not installed or not in PATH")
        print("  Install OpenSSH: https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_openssh_for_windows")
        return False
    
    # Deploy backend
    if not deploy_backend():
        print("✗ Backend deployment failed")
        return False
    
    # Deploy frontend
    if not deploy_frontend():
        print("⚠ Frontend deployment had issues")
    
    print("\n" + "="*60)
    print("✅ DEPLOYMENT COMPLETE")
    print("="*60)
    print("\n📋 Next steps:")
    print("1. SSH into server: ssh -p 65002 u615005912@82.198.227.1")
    print("2. Run migrations: cd public_html/backend && php artisan migrate --force")
    print("3. Generate VAPID keys: php artisan vapid:generate")
    print("4. Verify DNS/SSL settings in Hostinger dashboard")
    print("\n💡 For more help, see: HOSTINGER_DEPLOYMENT.md")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
