# Affiliate Platform - System Architecture Diagram

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      AFFILIATE PLATFORM                         │
│                    Complete System Flow                         │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: AFFILIATE PREPARES
═══════════════════════════════

    ┌──────────────────┐
    │   Affiliate      │
    │  logs in with:   │
    │ affiliate@       │ 
    │ example.com      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  /links Page                      │
    │  ✓ Fetches all approved products  │
    │  ✓ Gets user's referral_code      │
    │  ✓ Generates affiliate links      │
    │  ✓ Shows copy functionality       │
    └──────────────────────────────────┘
             │
             │ Affiliate copies link:
             │ /products/premium-template?ref=AFFILIATE001
             │
             ▼
    ┌──────────────────────────────────┐
    │  Affiliate shares link             │
    │  (Email, Social, Blog, etc)       │
    └──────────────────────────────────┘


PHASE 2: CUSTOMER VISITS
═════════════════════════════

    ┌──────────────────────────────────┐
    │  Customer clicks affiliate link   │
    │  /products/premium-template?ref=  │
    │            AFFILIATE001           │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  GET /api/track/AFFILIATE001/1    │
    │  TrackingController               │
    │  ├─ Validates affiliate exists    │
    │  ├─ Validates product exists      │
    │  └─ Records AffiliateClick        │
    │      ├─ device_type (mobile/...)  │
    │      ├─ browser (Chrome/...)      │
    │      ├─ os (Windows/...)          │
    │      ├─ ip_address                │
    │      ├─ user_agent                │
    │      ├─ referrer                  │
    │      └─ country                   │
    └────────┬─────────────────────────┘
             │
             │ Returns JSON:
             │ redirect_url: "/products/..."
             │
             ▼
    ┌──────────────────────────────────┐
    │  Product Sales Page               │
    │  (/products/[slug])               │
    │  ├─ Shows product details         │
    │  ├─ Shows price (₦5,000)          │
    │  ├─ Shows description             │
    │  ├─ Displays referral code        │
    │  │  "AFFILIATE001"                │
    │  └─ Shows "Buy Now" button        │
    └──────────────────────────────────┘


PHASE 3: CUSTOMER PURCHASES
═════════════════════════════

    ┌──────────────────┐
    │  Customer clicks │
    │  "Buy Now"       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  POST /api/purchases              │
    │  Request body:                    │
    │  {                                │
    │    product_id: 1,                 │
    │    customer_email: "...",         │
    │    customer_name: "...",          │
    │    amount: 5000,                  │
    │    ref: "AFFILIATE001",           │
    │    payment_method: "cc"           │
    │  }                                │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  PurchaseController               │
    │  ├─ Validates input data          │
    │  │                                │
    │  ├─ Creates TRANSACTION            │
    │  │  └─ amount: 5000               │
    │  │  └─ status: completed          │
    │  │                                │
    │  ├─ Finds matching AffiliateClick │
    │  │  └─ Marks converted: true      │
    │  │                                │
    │  ├─ Calculates COMMISSION          │
    │  │  └─ (5000 × 15%) = 750         │
    │  │                                │
    │  ├─ Creates COMMISSION             │
    │  │  └─ amount: 750                │
    │  │  └─ status: pending            │
    │  │                                │
    │  └─ Updates Affiliate stats       │
    │     ├─ total_sales++             │
    │     ├─ conversion_rate updated    │
    │     └─ tier updated               │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  Response to customer:            │
    │  {                                │
    │    success: true,                 │
    │    message: "Purchase recorded",  │
    │    transaction: { ... }           │
    │  }                                │
    └──────────────────────────────────┘


PHASE 4: ADMIN REVIEWS & APPROVES
═════════════════════════════════════

    ┌──────────────────────────────────┐
    │  Admin logs in                    │
    │  admin@example.com                │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  Admin Dashboard → Commissions    │
    │  ├─ Sees pending commission       │
    │  │  └─ Amount: ₦750               │
    │  │  └─ Affiliate: AFFILIATE001    │
    │  │  └─ Product: Premium Template  │
    │  │  └─ Status: pending            │
    │  │                                │
    │  └─ Clicks "Approve" button       │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  Commission Status Updated        │
    │  └─ pending → approved            │
    │                                   │
    │  Commission Ready for Withdrawal  │
    └──────────────────────────────────┘


PHASE 5: AFFILIATE RECEIVES EARNINGS
════════════════════════════════════════

    ┌──────────────────────────────────┐
    │  Affiliate logs in                │
    │  sees ₦750 in approved            │
    │  commissions                      │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  Affiliate requests withdrawal    │
    │  └─ Amount: ₦750                  │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  Admin approves withdrawal        │
    │  └─ System processes payment      │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  Affiliate receives ₦750          │
    │  ✓ Withdrawal completed           │
    └──────────────────────────────────┘

```

---

## Database Records Created per Transaction

```
ONE COMPLETE AFFILIATE SALE CREATES:
═══════════════════════════════════

1. AFFILIATE_CLICK
   ├─ id: uuid
   ├─ affiliate_id: 1 (AFFILIATE001)
   ├─ product_id: 1
   ├─ device_type: "mobile/tablet/desktop"
   ├─ browser: "Chrome/Firefox/Safari"
   ├─ os: "Windows/macOS/Linux"
   ├─ ip_address: "192.168.x.x"
   ├─ user_agent: full user agent string
   ├─ referrer: HTTP referrer
   ├─ country: "NG"
   ├─ converted: true (marked after purchase)
   ├─ transaction_id: (linked to transaction)
   └─ created_at: timestamp

2. TRANSACTION
   ├─ id: uuid
   ├─ product_id: 1
   ├─ customer_email: "customer@example.com"
   ├─ customer_name: "John Doe"
   ├─ amount: 5000
   ├─ payment_method: "credit_card"
   ├─ payment_reference: "TXN123456"
   ├─ status: "completed"
   ├─ transaction_date: timestamp
   └─ created_at: timestamp

3. COMMISSION
   ├─ id: uuid
   ├─ user_id: 2 (affiliate's user_id)
   ├─ product_id: 1
   ├─ transaction_id: (linked to transaction)
   ├─ affiliate_click_id: (linked to click)
   ├─ amount: 750 (calculated: 5000 × 15%)
   ├─ status: "pending" (admin must approve)
   ├─ commission_date: timestamp
   └─ created_at: timestamp

PLUS UPDATES TO:
├─ affiliates.total_sales += 1
├─ affiliates.conversion_rate = recalculated
└─ affiliates.tier = updated based on performance
```

---

## API Endpoint Calls Sequence

```
REQUEST 1: Track Click
═══════════════════════

GET /api/track/AFFILIATE001/1 HTTP/1.1
Host: 127.0.0.1:8000
Accept: application/json

RESPONSE:
{
  "success": true,
  "message": "Click tracked successfully",
  "redirect_url": "/products/premium-website-template?ref=AFFILIATE001"
}

DATABASE: AffiliateClick record created ✓

────────────────────────────────────────

REQUEST 2: Record Purchase
═════════════════════════

POST /api/purchases HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "product_id": 1,
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "amount": 5000,
  "ref": "AFFILIATE001",
  "payment_method": "credit_card",
  "payment_reference": "TXN123456"
}

RESPONSE:
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

DATABASE: 
├─ Transaction created ✓
├─ Commission created ✓
├─ AffiliateClick marked converted ✓
└─ Affiliate stats updated ✓
```

---

## Commission Calculation Formula

```
COMMISSION AMOUNT = (PURCHASE AMOUNT × COMMISSION RATE) / 100

EXAMPLE:
Product: Premium Website Template
Purchase Amount: ₦5,000
Commission Rate: 15%

COMMISSION = (5,000 × 15) / 100
COMMISSION = 750,000 / 100
COMMISSION = ₦750

Status: pending (until admin approves)
```

---

## System Components

```
FRONTEND (Next.js 16.1.1)
═══════════════════════════

├─ /login (existing)
│  └─ Authenticate user
│
├─ /links (updated)
│  ├─ GET /api/affiliate/products (existing)
│  ├─ Read affiliate.referral_code from localStorage
│  └─ Generate affiliate links
│
├─ /products (existing)
│  └─ List all public products
│
├─ /products/[slug] (NEW)
│  ├─ Dynamic product page
│  ├─ GET /api/products/{slug}
│  ├─ Display product details
│  ├─ POST /api/purchases (on "Buy Now")
│  └─ Show referral code in URL
│
└─ /demo (NEW)
   ├─ Testing page
   ├─ Automated flow testing
   └─ Displays test credentials

BACKEND (Laravel 11)
═════════════════════

API Routes (public, no auth):
├─ GET /api/track/{referralCode}/{productId}
│  └─ TrackingController@trackClick
│
├─ POST /api/purchases
│  └─ PurchaseController@store
│
├─ GET /api/products
│  └─ ProductController@index
│
└─ GET /api/products/{slug}
   └─ ProductController@show

Database:
├─ affiliate_clicks (tracking)
├─ transactions (purchases)
├─ commissions (earnings)
├─ products (items for sale)
├─ affiliates (affiliate accounts)
├─ users (all users)
└─ ... (other existing tables)

Controllers:
├─ TrackingController (NEW) - click tracking
├─ PurchaseController (NEW) - purchase & commission
└─ ProductController (existing) - product info
```

---

## Test Flow Sequence

```
AUTOMATED TEST FLOW (on /demo page)
═════════════════════════════════════

Step 1: LOAD PRODUCTS
   GET /api/products
   → Response: [4 products with IDs, names, slugs]

Step 2: TRACK CLICK
   GET /api/track/AFFILIATE001/1
   → Records AffiliateClick in database
   → Response: success + redirect_url

Step 3: RECORD PURCHASE
   POST /api/purchases with:
   {
     product_id: 1,
     customer_email: "customer-{timestamp}@example.com",
     customer_name: "Test Customer",
     amount: 5000,
     ref: "AFFILIATE001",
     payment_method: "credit_card"
   }
   → Creates Transaction
   → Creates Commission (₦750)
   → Updates affiliate stats
   → Response: success

Result: 
✓ AffiliateClick created
✓ Transaction created
✓ Commission created (pending)
✓ Ready for admin approval
```

---

## Conversion Status Tracking

```
AFFILIATE_CLICK LIFECYCLE
═════════════════════════

STATE 1: CLICK ONLY
   converted: false
   transaction_id: NULL
   
   ↓ (customer doesn't buy)
   
   → Click expires (no conversion)

STATE 2: CLICK → PURCHASE
   converted: false
   transaction_id: NULL
   
   ↓ (customer makes purchase)
   
   → POST /api/purchases received
   → Transaction created
   
   ↓
   
   converted: true ✓
   transaction_id: {transaction_uuid}
   
   → Commission created
   → Affiliate stats updated
```

---

## Key Statistics Tracked

```
PER AFFILIATE (affiliates table):
══════════════════════════════════

total_clicks: 150        (total affiliate clicks generated)
total_sales: 5           (successful conversions)
conversion_rate: 3.33%   (5 / 150 * 100)
total_earnings: 2,500    (sum of all commissions)
tier: "silver"           (calculated based on performance)

PER PRODUCT (affiliate_clicks table):
═════════════════════════════════════

clicks_by_product: 30    (specific product clicks)
sales_by_product: 1      (conversions for that product)
conversions_pct: 3.33%   (1 / 30 * 100)

PER DEVICE/BROWSER:
═══════════════════

Mobile: 60 clicks
Desktop: 80 clicks
Tablet: 10 clicks

Chrome: 70 clicks
Firefox: 40 clicks
Safari: 30 clicks
Edge: 10 clicks
```

---

This diagram shows the complete affiliate marketing system in action!
