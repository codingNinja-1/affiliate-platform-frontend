# Affiliate Platform - Cron Job Setup

## Balance Update Cron Job

The system includes an automated command to recalculate affiliate and vendor balances.

### Command Usage

```bash
# Update all balances (affiliates and vendors)
php artisan balances:update

# Update only affiliates
php artisan balances:update --type=affiliates

# Update only vendors
php artisan balances:update --type=vendors
```

### Automated Schedule

The command is scheduled to run **every hour** automatically via Laravel's scheduler.

### Setup Cron Job (Production)

Add this single cron entry to your server:

```bash
* * * * * cd /path/to/affiliate-platform/backend && php artisan schedule:run >> /dev/null 2>&1
```

This will run Laravel's scheduler every minute, which will then execute the `balances:update` command hourly.

### What It Does

1. **For Affiliates:**
   - Calculates total earnings from approved commissions
   - Subtracts total withdrawn amount
   - Updates the balance field

2. **For Vendors:**
   - Calculates total earnings from completed transactions
   - Subtracts total withdrawn amount
   - Updates the balance field

### Manual Test

Run the command manually to test:

```bash
cd backend
php artisan balances:update
```

You should see output like:
```
Updating affiliate balances...
Updated 5 affiliate balances
Updating vendor balances...
Updated 3 vendor balances
```
