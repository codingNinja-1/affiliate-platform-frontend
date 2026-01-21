# Currency Conversion Feature

## Overview
The affiliate platform now supports multi-currency conversion, allowing affiliates to view their earnings in their preferred currency while all transactions remain in the base currency (NGN).

## Features Implemented

### Backend
1. **Currency Rates Management**
   - Database table: `currency_rates`
   - Model: `App\Models\CurrencyRate`
   - API endpoints for CRUD operations (Admin only)
   - Conversion service with caching

2. **Affiliate Currency Preference**
   - Added `preferred_currency` field to affiliates table
   - Affiliates can set their display currency
   - Real-time conversion of balances and earnings

3. **API Endpoints**
   - `GET /api/admin/currency-rates` - List all rates
   - `POST /api/admin/currency-rates` - Create new rate
   - `PUT /api/admin/currency-rates/{id}` - Update rate
   - `DELETE /api/admin/currency-rates/{id}` - Delete rate
   - `POST /api/admin/currency/convert` - Convert amount
   - `GET /api/admin/currencies` - Get supported currencies
   - `GET /api/affiliate/settings` - Get affiliate settings including currency
   - `POST /api/affiliate/settings/currency` - Update currency preference
   - `GET /api/affiliate/converted-amounts` - Get amounts in preferred currency

### Frontend
1. **Admin Panel**
   - Currency Rates page at `/admin/currency-rates`
   - Add/Edit/Delete currency rates
   - Set active/inactive status
   - View conversion rates

2. **Affiliate Dashboard**
   - Currency selector dropdown
   - Real-time currency switching
   - Displays conversion rate
   - Shows amounts in selected currency
   - Commissions displayed in preferred currency

## Usage

### For Admins
1. Navigate to `/admin/currency-rates`
2. Click "Add Rate" to create new conversion rates
3. Enter:
   - From Currency (3-letter code, e.g., USD)
   - To Currency (3-letter code, e.g., NGN)
   - Exchange Rate (e.g., 1550.00)
   - Optional description
   - Active status

### For Affiliates
1. Go to dashboard
2. Click the currency selector (top of stats section)
3. Choose preferred currency from dropdown
4. All amounts will be converted and displayed
5. Original currency (NGN) still shown for pending balances

## Technical Details

### Currency Conversion Logic
- Base currency: NGN (Nigerian Naira)
- Conversions use cached rates for performance
- Supports direct and inverse rate calculations
- If USD->NGN doesn't exist but NGN->USD does, inverse is calculated

### Supported Currencies (Default Seeds)
- NGN (Nigerian Naira) - Base currency
- USD (US Dollar)
- GBP (British Pound)
- EUR (Euro)

### Cache Strategy
- Rates cached for 1 hour
- Cache cleared when rates updated
- Automatic fallback to database if cache misses

## Setup Instructions

1. **Run Migrations**
   ```bash
   cd backend
   php artisan migrate
   ```

2. **Seed Default Rates (Optional)**
   ```bash
   php artisan db:seed --class=CurrencyRateSeeder
   ```

3. **Configure Cache** (if using Redis/Memcached)
   Update `.env`:
   ```
   CACHE_DRIVER=redis
   ```

## API Examples

### Create Currency Rate
```bash
POST /api/admin/currency-rates
Authorization: Bearer {token}
Content-Type: application/json

{
  "from_currency": "USD",
  "to_currency": "NGN",
  "rate": 1550.00,
  "description": "US Dollar to Nigerian Naira",
  "is_active": true
}
```

### Update Affiliate Currency
```bash
POST /api/affiliate/settings/currency
Authorization: Bearer {token}
Content-Type: application/json

{
  "currency": "USD"
}
```

### Get Converted Amounts
```bash
GET /api/affiliate/converted-amounts
Authorization: Bearer {token}
```

## Notes
- All database amounts remain in NGN
- Conversions are display-only
- Withdrawals still processed in NGN
- Admins can add any currency pair
- System automatically finds inverse rates
