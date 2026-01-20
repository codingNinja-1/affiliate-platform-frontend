# 🚀 Getting Started - Affiliate Platform

## ⚡ 5-Minute Quick Start

### 1. Start Backend Server
```bash
cd backend
php artisan serve
# Backend runs on http://127.0.0.1:8000
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### 3. Visit Demo Page
```
Open: http://localhost:3000/demo
```

### 4. Run Automated Test
```
Click: "Run Full Test" button
Wait: ~5 seconds for results
Check: Real-time test results display
```

**Done! ✅** Your complete affiliate platform is working.

---

## 📊 What Just Happened?

The automated test:
1. ✅ Loaded all products from the database
2. ✅ Tracked an affiliate click with analytics
3. ✅ Recorded a purchase and created commission
4. ✅ Created real database records

Check your database to verify:
- New `affiliate_clicks` record (with device/browser/OS info)
- New `transactions` record (purchase recorded)
- New `commissions` record (₦750 commission pending)

---

## 🔐 Test Accounts

Use these credentials throughout the platform:

### Affiliate Account
```
Email:          affiliate@example.com
Password:       Affiliate@123
Referral Code:  AFFILIATE001
```

### Admin Account
```
Email:          admin@example.com
Password:       Admin@123
```

### Vendor Account
```
Email:          vendor@example.com
Password:       Vendor@123
```

---

## 🛍️ Available Products

All 4 products are pre-approved and ready to sell:

| # | Product | Price | Commission |
|---|---------|-------|------------|
| 1 | Premium Website Template | ₦5,000 | 15% |
| 2 | E-commerce Platform | ₦15,000 | 20% |
| 3 | Mobile App Kit | ₦8,000 | 18% |
| 4 | Cloud API | ₦12,000 | 25% |

---

## 🎯 Manual Testing Walkthrough

### Step 1: Login as Affiliate
1. Go to http://localhost:3000/login
2. Enter: `affiliate@example.com` / `Affiliate@123`
3. Click "Sign in"

### Step 2: View Affiliate Links
1. Click "Referral links" in sidebar
2. See all products with your referral code (AFFILIATE001)
3. Example link: `/products/premium-website-template?ref=AFFILIATE001`

### Step 3: Test a Product Page
1. Click on any product name from the links page
2. See full product details
3. Notice your referral code is displayed
4. Click "Buy Now" (simulates customer purchase)

### Step 4: Verify Database
1. Check your database for 3 new records:
   - **affiliate_clicks** - The tracked click
   - **transactions** - The purchase
   - **commissions** - Your ₦750 commission (pending)

### Step 5: Approve Commission (as Admin)
1. Login as admin@example.com / Admin@123
2. Go to Dashboard → Commissions
3. See pending commission
4. Click "Approve"
5. Commission now shows as "approved"

---

## 📍 Key URLs

### Frontend
- **Demo/Testing:** http://localhost:3000/demo
- **Login:** http://localhost:3000/login
- **Affiliate Links:** http://localhost:3000/links (after login)
- **Dashboard:** http://localhost:3000/dashboard (after login)
- **Product:** http://localhost:3000/products/premium-website-template?ref=AFFILIATE001

### Backend API
- **Base:** http://127.0.0.1:8000/api
- **Track Click:** GET `/api/track/AFFILIATE001/1`
- **Record Purchase:** POST `/api/purchases`
- **Get Products:** GET `/api/products`

---

## 📚 Documentation

Read these files in order for complete understanding:

1. **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Navigation guide
2. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick lookups (5 min)
3. **[SYSTEM_COMPLETE.md](SYSTEM_COMPLETE.md)** - Complete overview (15 min)
4. **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** - Visual diagrams (20 min)
5. **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Full testing guide (25 min)
6. **[README_IMPLEMENTATION.md](README_IMPLEMENTATION.md)** - Technical details (20 min)

---

## 🧪 Testing with APIs

### Test Click Tracking
```bash
curl -X GET "http://127.0.0.1:8000/api/track/AFFILIATE001/1" \
  -H "Accept: application/json"

# Response:
{
  "success": true,
  "message": "Click tracked successfully",
  "redirect_url": "/products/premium-website-template?ref=AFFILIATE001"
}
```

### Test Purchase Recording
```bash
curl -X POST "http://127.0.0.1:8000/api/purchases" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "amount": 5000,
    "ref": "AFFILIATE001",
    "payment_method": "credit_card",
    "payment_reference": "TXN123456"
  }'

# Response:
{
  "success": true,
  "message": "Purchase recorded successfully",
  "transaction": { ...transaction details... }
}
```

### Test Get Products
```bash
curl -X GET "http://127.0.0.1:8000/api/products" \
  -H "Accept: application/json"

# Returns array of all 4 products
```

---

## 💰 How Commissions Work

### The Math
```
Product: Premium Website Template (₦5,000)
Commission Rate: 15%

Commission = (5,000 × 15) / 100 = ₦750
```

### The Flow
```
1. Customer clicks affiliate link
   → AffiliateClick recorded with analytics

2. Customer buys product
   → Transaction created
   → Commission calculated automatically (₦750)

3. Commission status = "pending"
   → Admin must review and approve

4. Commission status = "approved"
   → Affiliate can withdraw earnings

5. Affiliate receives ₦750
   → Earnings transferred
```

---

## 🎯 What Each Component Does

### Frontend: /links Page
- Shows all available products
- Displays your referral code (AFFILIATE001)
- Generates shareable links
- Copy-to-clipboard button

### Frontend: /products/[slug] Page
- Shows product details (price, description, vendor)
- Displays referral code if in URL
- "Buy Now" button
- Records purchase via API

### Frontend: /demo Page
- One-click testing
- Shows test credentials
- Lists all products
- Real-time test results

### Backend: TrackingController
- Records affiliate clicks
- Captures device/browser/OS info
- Creates AffiliateClick database record
- Returns redirect URL

### Backend: PurchaseController
- Records purchases
- Creates Transaction record
- Finds matching AffiliateClick
- Calculates commission automatically
- Creates Commission record
- Updates affiliate stats

---

## 🔧 Common Tasks

### How to Test the Complete Flow
1. Visit `/demo` page
2. Click "Run Full Test"
3. Check database for 3 new records
4. Login as admin to approve commission

### How to View Your Affiliate Links
1. Login as affiliate
2. Go to `/links`
3. See all products with your referral code
4. Copy any link to share

### How to Check Your Commission
1. Login as admin
2. Go to Commissions section
3. See pending commissions
4. Click "Approve" to accept

### How to View All Products
1. Go to `/products`
2. Or via API: `GET /api/products`
3. All approved products shown

---

## ⚠️ Important Notes

### Test Mode
- This is a **demo/test implementation**
- Purchases are recorded but not charged
- In production, integrate with real payment gateway

### CORS Configuration
- Frontend: http://localhost:3000
- Backend: http://127.0.0.1:8000
- CORS already configured for both

### Database
- Uses existing database connection from .env
- New tables: affiliate_clicks, transactions, commissions
- All tables already have migrations

### Authentication
- Frontend uses localStorage for tokens
- API routes are public (no auth required for tracking/purchases)
- Admin routes require authentication

---

## 🐛 Troubleshooting

### Products Not Loading
```
Check:
1. Backend running? → php artisan serve
2. Database seeded? → php artisan migrate:fresh --seed
3. CORS enabled? → Check backend/config/cors.php
4. API working? → Try curl to /api/products
```

### Commission Not Created
```
Check:
1. Purchase was recorded? → Check transactions table
2. AffiliateClick exists? → Check affiliate_clicks table
3. Referral code matches? → Should be AFFILIATE001
4. Commission created? → Check commissions table
```

### Hydration Errors
```
Fix:
1. Clear browser cache
2. Hard refresh: Ctrl+Shift+R (Windows)
3. Check AppLayout.tsx uses useEffect for localStorage
```

### API 404 Errors
```
Check:
1. Routes added to routes/api.php
2. Controller names match exactly
3. Restart Laravel after route changes
4. Check controller namespace is correct
```

---

## ✅ Verification Checklist

After running automated test, verify:

- [ ] Backend is running on http://127.0.0.1:8000
- [ ] Frontend is running on http://localhost:3000
- [ ] Can access /demo page
- [ ] Can run automated test successfully
- [ ] affiliate_clicks table has new record
- [ ] transactions table has new record
- [ ] commissions table has new record
- [ ] Commission amount is ₦750
- [ ] Commission status is "pending"
- [ ] Can login as affiliate (affiliate@example.com)
- [ ] Can see products on /links page
- [ ] Can login as admin (admin@example.com)
- [ ] Can see and approve commissions

All checked? **You're all set!** ✅

---

## 🚀 Next Steps

### Immediate (This Session)
1. ✅ Run automated test
2. ✅ Verify database records
3. ✅ Manual testing of complete flow
4. ✅ Review documentation

### Short Term (Next)
1. Integration with real payment gateway
2. Email notifications on sales
3. Affiliate withdrawal system
4. Advanced analytics dashboard

### Medium Term
1. Multi-tier commission structure
2. Promotional materials for affiliates
3. Fraud detection system
4. API documentation portal

### Long Term
1. Marketplace for affiliate recruitment
2. Performance tracking and optimization
3. Geographic targeting
4. Commission scaling and bonuses

---

## 💡 Tips

1. **Quick Test:** Visit /demo and click "Run Full Test"
2. **API Testing:** Use curl commands from TESTING_GUIDE.md
3. **Database Verification:** Check tables after test runs
4. **Manual Flow:** Login as affiliate, view links, complete purchase
5. **Documentation:** Start with QUICK_REFERENCE.md for quick lookups

---

## 📞 Reference

- **Quick Lookups:** See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **API Docs:** See [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Architecture:** See [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- **All Docs:** See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

## 🎉 You're Ready!

Your affiliate marketing platform is **fully functional** and ready to test.

### To Start:
1. Run backend: `php artisan serve`
2. Run frontend: `npm run dev`
3. Visit: http://localhost:3000/demo
4. Click: "Run Full Test"
5. Check: Database for new records

**That's it! Enjoy!** 🚀

---

**Questions?** Check the documentation files listed above.
**Need help?** See "Troubleshooting" section in this guide.
**Want more details?** Read [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
