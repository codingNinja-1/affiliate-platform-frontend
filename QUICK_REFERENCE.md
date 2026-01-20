# Affiliate Platform - Quick Reference

## 🚀 Quick Start

```bash
# Terminal 1: Start Backend
cd backend
php artisan serve

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Visit: http://localhost:3000/demo
```

## 📊 Test Accounts

| Role | Email | Password | Code |
|------|-------|----------|------|
| Admin | admin@example.com | Admin@123 | - |
| Vendor | vendor@example.com | Vendor@123 | - |
| Affiliate | affiliate@example.com | Affiliate@123 | AFFILIATE001 |

## 🛍️ Test Products

| Product | Price | Commission | Slug |
|---------|-------|------------|------|
| Premium Website Template | ₦5,000 | 15% | premium-website-template |
| E-commerce Platform | ₦15,000 | 20% | ecommerce-platform |
| Mobile App Kit | ₦8,000 | 18% | mobile-app-kit |
| Cloud API | ₦12,000 | 25% | cloud-api |

## 📍 Key URLs

### Frontend
- **Demo/Testing:** http://localhost:3000/demo
- **Login:** http://localhost:3000/login
- **Affiliate Links:** http://localhost:3000/links
- **Dashboard:** http://localhost:3000/dashboard
- **Product Page:** http://localhost:3000/products/[slug]?ref=[CODE]

### Backend
- **API Base:** http://127.0.0.1:8000/api
- **Track Click:** GET `/api/track/{referralCode}/{productId}`
- **Record Purchase:** POST `/api/purchases`
- **Get Products:** GET `/api/products`
- **Get Product:** GET `/api/products/{slug}`

## 🔄 Commission Flow

```
Click → AffiliateClick record
Buy → Transaction record
↓ → Commission created (pending)
Admin approves
↓ → Commission status = approved
Affiliate can withdraw
```

## 💰 Commission Math

```
Commission = (Purchase Amount × Commission Rate) / 100

Example:
Amount: ₦5,000
Rate: 15%
Commission = (5000 × 15) / 100 = ₦750
```

## 📝 API Endpoints

### Track Click (Public)
```
GET /api/track/AFFILIATE001/1

Response:
{
  "success": true,
  "message": "Click tracked successfully",
  "redirect_url": "/products/premium-website-template?ref=AFFILIATE001"
}
```

### Record Purchase (Public)
```
POST /api/purchases

Body:
{
  "product_id": 1,
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "amount": 5000,
  "ref": "AFFILIATE001",
  "payment_method": "credit_card"
}

Response:
{
  "success": true,
  "message": "Purchase recorded successfully",
  "transaction": { ...transaction data... }
}
```

### Get Products (Public)
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

### Get Single Product (Public)
```
GET /api/products/premium-website-template

Response:
{
  "success": true,
  "data": { ...product details... }
}
```

## 🔧 Database Tables

### affiliate_clicks
- Tracks every click from affiliate link
- Fields: id, affiliate_id, product_id, device_type, browser, os, ip_address, user_agent, referrer, country, converted, transaction_id, created_at

### transactions
- Records every purchase
- Fields: id, product_id, customer_email, customer_name, amount, payment_method, payment_reference, status, transaction_date, created_at

### commissions
- Tracks affiliate earnings
- Fields: id, user_id, product_id, transaction_id, affiliate_click_id, amount, status, commission_date, created_at

## 🎯 Testing Checklist

- [ ] Backend running (`php artisan serve`)
- [ ] Frontend running (`npm run dev`)
- [ ] Can access demo page (http://localhost:3000/demo)
- [ ] Can login with affiliate account
- [ ] Can view affiliate links
- [ ] Can copy referral link
- [ ] Can visit product page via affiliate link
- [ ] Can complete purchase
- [ ] Commission appears in database as "pending"
- [ ] Admin can approve commission

## 📂 Important Files

### Frontend
- Links Page: `frontend/src/app/links/page.tsx`
- Product Page: `frontend/src/app/products/[slug]/page.tsx`
- Demo Page: `frontend/src/app/demo/page.tsx`
- App Layout: `frontend/src/app/components/AppLayout.tsx`

### Backend
- Tracking: `backend/app/Http/Controllers/TrackingController.php`
- Purchase: `backend/app/Http/Controllers/PurchaseController.php`
- Products: `backend/app/Http/Controllers/ProductController.php`
- Routes: `backend/routes/api.php`
- Models: `backend/app/Models/`
- Seeding: `backend/database/seeders/DatabaseSeeder.php`

## 🐛 Common Issues

### Products not loading
- Check backend is running
- Check CORS config in `backend/config/cors.php`
- Check database has products seeded

### Commission not created
- Check AffiliateClick was recorded
- Check referral code matches
- Check Transaction was created

### Hydration errors
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check AppLayout.tsx uses useEffect for localStorage

### API 404 errors
- Verify routes added to `backend/routes/api.php`
- Check controller names match exactly
- Restart Laravel server after route changes

## 📚 Documentation

- **Full Guide:** See `TESTING_GUIDE.md`
- **Implementation Details:** See `README_IMPLEMENTATION.md`
- **This Quick Ref:** See `QUICK_REFERENCE.md`

## ✅ What's Implemented

- ✅ Click tracking with analytics
- ✅ Product sales pages
- ✅ Purchase recording
- ✅ Commission calculation
- ✅ Admin approval workflow
- ✅ Affiliate links generation
- ✅ Test data & demo page
- ✅ Complete API documentation
- ✅ CORS configuration
- ✅ Error handling & validation

## 🚀 Next Features

- Payment gateway integration
- Email notifications
- Withdrawal system
- Advanced analytics
- Multi-tier commissions
