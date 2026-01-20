# Affiliate Platform - Complete Setup & Testing Guide

## Overview
You now have a complete affiliate marketing system with:
- ✅ Click tracking
- ✅ Product sales pages  
- ✅ Purchase recording
- ✅ Commission calculation
- ✅ Affiliate links generation

## Test Credentials

### Admin Account
- **Email:** admin@example.com
- **Password:** Admin@123

### Vendor Account
- **Email:** vendor@example.com
- **Password:** Vendor@123

### Affiliate Account
- **Email:** affiliate@example.com
- **Password:** Affiliate@123
- **Referral Code:** AFFILIATE001

## Available Products

1. **Premium Website Template** - ₦5,000 (15% commission)
2. **E-commerce Platform** - ₦15,000 (20% commission)
3. **Mobile App Kit** - ₦8,000 (18% commission)
4. **Cloud API** - ₦12,000 (25% commission)

## Step-by-Step Testing Flow

### 1. Login as Affiliate
1. Go to http://localhost:3000/login
2. Enter: affiliate@example.com / Affiliate@123
3. Click "Sign in"

### 2. View Affiliate Links
1. Click "Referral links" in the sidebar (or navigate to /links)
2. You'll see all available products with their affiliate links
3. Each link will have format: `http://localhost:3000/products/{product-slug}?ref=AFFILIATE001`

### 3. Test Click Tracking (Via Backend API)
```bash
# Make a request to track an affiliate click
curl -X GET "http://127.0.0.1:8000/api/track/AFFILIATE001/1" \
  -H "Accept: application/json"

# Response will include:
# {
#   "success": true,
#   "redirect_url": "/products/premium-website-template?ref=AFFILIATE001"
# }
```

### 4. View Product Sales Page
1. Click on any affiliate link from the Referral Links page
2. You'll see the full product details page
3. The referral code will be displayed at the top
4. The affiliate code is automatically passed to the purchase endpoint

### 5. Test Purchase Recording
1. On the product sales page, click "Buy Now"
2. This will:
   - Create a Transaction record in the database
   - Find the matching AffiliateClick
   - Mark the click as converted
   - Create a Commission record (pending admin approval)
   - Update affiliate stats

### 6. Verify Commission in Admin Dashboard
1. Login as admin@example.com / Admin@123
2. Go to Commissions section
3. You'll see the new commission record marked as "pending"
4. Click "Approve" to mark it as approved

## Database Flow

### Click Tracking Flow
```
User clicks affiliate link
  ↓
GET /api/track/{referralCode}/{productId}
  ↓
TrackingController records AffiliateClick
  ├─ affiliate_id
  ├─ product_id
  ├─ device_type (mobile/tablet/desktop)
  ├─ browser (Chrome/Firefox/Safari/Edge)
  ├─ os (Windows/macOS/Linux/Android/iOS)
  ├─ ip_address
  ├─ user_agent
  ├─ referrer
  └─ country
  ↓
Returns redirect URL to frontend
```

### Purchase & Commission Flow
```
Customer clicks "Buy Now" on product page
  ↓
POST /api/purchases with:
  ├─ product_id
  ├─ customer_email
  ├─ customer_name
  ├─ amount
  ├─ ref (referral code)
  └─ payment_method
  ↓
PurchaseController:
  ├─ Creates Transaction record
  ├─ Finds matching AffiliateClick
  ├─ Marks AffiliateClick.converted = true
  ├─ Calculates commission: (amount × commission_rate) / 100
  ├─ Creates Commission record (status: pending)
  └─ Updates Affiliate stats
  ↓
Admin reviews and approves commission
```

## API Endpoints

### Public Endpoints (No Auth Required)

#### Track Affiliate Click
```
GET /api/track/{referralCode}/{productId}

Example:
GET /api/track/AFFILIATE001/1

Response:
{
  "success": true,
  "message": "Click tracked successfully",
  "redirect_url": "/products/premium-website-template?ref=AFFILIATE001"
}
```

#### Record Purchase
```
POST /api/purchases

Body:
{
  "product_id": 1,
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "amount": 5000,
  "ref": "AFFILIATE001",
  "payment_method": "credit_card",
  "payment_reference": "TXN123456"
}

Response:
{
  "success": true,
  "message": "Purchase recorded successfully",
  "transaction": {
    "id": "uuid",
    "product_id": 1,
    "customer_email": "customer@example.com",
    "amount": 5000,
    "status": "completed",
    ...
  }
}
```

#### Get Products
```
GET /api/products

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Premium Website Template",
      "slug": "premium-website-template",
      "price": 5000,
      "commission_rate": 15,
      ...
    }
  ]
}
```

#### Get Single Product
```
GET /api/products/{slug}

Example:
GET /api/products/premium-website-template

Response:
{
  "success": true,
  "data": { product details... }
}
```

### Protected Endpoints (Auth Required)

#### Get Affiliate Products
```
GET /api/affiliate/products

Headers:
Authorization: Bearer {token}

Response:
{
  "data": [ products... ]
}
```

## File Locations

### Frontend
- **Affiliate Links Page:** `/frontend/src/app/links/page.tsx`
- **Product Sales Page:** `/frontend/src/app/products/[slug]/page.tsx`
- **App Layout:** `/frontend/src/app/components/AppLayout.tsx`

### Backend
- **Tracking Controller:** `/backend/app/Http/Controllers/TrackingController.php`
- **Purchase Controller:** `/backend/app/Http/Controllers/PurchaseController.php`
- **Product Controller:** `/backend/app/Http/Controllers/ProductController.php`
- **Routes:** `/backend/routes/api.php`
- **Models:** `/backend/app/Models/`
  - `AffiliateClick.php`
  - `Commission.php`
  - `Transaction.php`
  - `Product.php`
  - `Affiliate.php`

## Commission Status Workflow

```
Commission Created (pending)
  ↓
Admin reviews in dashboard
  ↓
Admin clicks "Approve"
  ↓
Commission status = "approved"
  ↓
Affiliate can withdraw approved commissions
```

## Troubleshooting

### Products not showing on affiliate links page
- Check browser console for API errors
- Verify backend is running: `php artisan serve`
- Check CORS configuration in `/backend/config/cors.php`
- Verify database has products seeded

### Purchase not creating commission
- Check AffiliateClick table - ensure click was recorded
- Verify referral_code matches affiliate's referral_code
- Check if transaction was created successfully
- Verify Commission model relationships

### Hydration errors on frontend
- Clear browser cache
- Hard refresh (Ctrl+Shift+R on Windows)
- Check AppLayout.tsx uses useEffect for localStorage reads

## Commission Calculation Example

```
Product: Premium Website Template
Commission Rate: 15%
Purchase Amount: ₦5,000

Commission = (5000 × 15) / 100 = ₦750
```

## Next Steps / Future Enhancements

1. **Payment Gateway Integration**
   - Replace demo purchase with real payment processor (Stripe, Paystack, etc.)
   - Webhook validation for payment confirmations

2. **Affiliate Dashboard**
   - Real-time commission tracking
   - Click-to-conversion analytics
   - Earnings withdrawal system

3. **Advanced Analytics**
   - Click heatmaps
   - Conversion rate by device/browser
   - Geographic distribution

4. **Notification System**
   - Email notifications for new sales
   - Commission approval alerts
   - Withdrawal confirmations

5. **Multi-tier Commissions**
   - Different rates for different affiliate tiers
   - Volume-based bonuses
