# Admin Dashboard Implementation Guide

## Overview

A complete admin panel has been built for the affiliate platform, allowing administrators to manage all platform aspects including users, products, transactions, and withdrawals. The system features a modern dark-themed interface with role-based access control.

## 🎯 Architecture

### Frontend Structure

```
frontend/src/
├── app/
│   ├── admin/
│   │   ├── page.tsx                 # Dashboard with metrics
│   │   ├── users/
│   │   │   └── page.tsx             # User management
│   │   ├── products/
│   │   │   └── page.tsx             # Product approval management
│   │   ├── transactions/
│   │   │   └── page.tsx             # Transaction viewing
│   │   ├── withdrawals/
│   │   │   └── page.tsx             # Withdrawal approval
│   │   ├── vendors/
│   │   │   └── page.tsx             # Vendor management (stub)
│   │   ├── affiliates/
│   │   │   └── page.tsx             # Affiliate management (stub)
│   │   └── components/
│   │       └── AdminSidebar.tsx     # Navigation sidebar
│   └── components/
│       └── AdminSidebar.tsx         # Shared admin sidebar
├── hooks/
│   └── useAdmin.ts                  # Admin data fetching hooks
└── ...
```

### Backend Structure

```
backend/app/Http/Controllers/Admin/
├── DashboardController.php          # Dashboard metrics
├── UserController.php               # User management
├── ProductController.php            # Product approval
├── TransactionController.php        # Transaction viewing
├── WithdrawalController.php         # Withdrawal approval
└── ReportsController.php            # Reports (placeholder)
```

## 🚀 Core Features

### 1. Admin Dashboard (`/admin`)
- **Real-time Metrics:**
  - App Gross Revenue (total transaction amount)
  - Total Transactions Count
  - Active Vendors Count
  - Vendor Earnings (total vendor sales)
  - Affiliate Earnings (total commissions)
  - Unpaid Affiliate Balance
  - Unpaid Vendor Balance
  - Active Affiliates Count
  - Total Customers Count
  - Approved Products Count
  - Pending Withdrawals Count
  - Total Paid Out Amount

- **Quick Actions:** Links to management pages
- **User Statistics:** Active users, products, etc.

### 2. User Management (`/admin/users`)
- View all platform users with pagination
- Filter by:
  - User Type (admin, vendor, affiliate, customer)
  - Status (active, inactive, banned, pending, suspended, rejected)
  - Search by name or email
- Update user status and type
- Per-page pagination controls

### 3. Product Approval (`/admin/products`)
- Approve/reject vendor products
- Filter products by approval status:
  - All
  - Pending (awaiting approval)
  - Approved (published)
  - Rejected (not accepted)
- Reject products with reason modal
- View product details:
  - Name
  - Price
  - Commission Rate
  - Status with color-coded badges
  - Submission date
  - Rejection reason (if applicable)

### 4. Transaction Viewing (`/admin/transactions`)
- View all platform transactions
- Filter by:
  - Transaction type (sale, commission)
  - Status (pending, completed, failed)
  - Search by transaction ID
- Pagination support
- Display:
  - Transaction ID
  - Amount
  - Type (color-coded)
  - Status (color-coded)
  - Date

### 5. Withdrawal Management (`/admin/withdrawals`)
- Approve or reject pending withdrawal requests
- Filter by:
  - Status (pending, approved, rejected, completed)
  - Search by user
- Approval tracking:
  - Approved By (admin user)
  - Approved At (timestamp)
- Rejection tracking:
  - Rejected By (admin user)
  - Rejected At (timestamp)
  - Rejection Reason
- Display:
  - User ID
  - Amount
  - Payment Method
  - Status (color-coded)
  - Requested Date
  - Action buttons (Approve/Reject)

### 6. Admin Navigation (`AdminSidebar`)
- Logo and branding
- 7 main navigation items:
  1. Dashboard
  2. Users
  3. Products
  4. Transactions
  5. Withdrawals
  6. Vendors (stub)
  7. Affiliates (stub)
- Current page highlighting
- Role-based rendering (only shows for admin/superadmin)

## 🔐 Security & Authorization

### Role-Based Access Control
- All admin routes protected with `role:admin` middleware
- Admin pages verify user type before rendering
- Protected routes redirect unauthorized users to `/dashboard`
- User types: `admin`, `superadmin` (full access)

### Backend Authorization
- All controllers check `Auth::user()` existence
- Verify user type is `admin` or `superadmin`
- Return 403 Unauthorized for non-admin users
- Sanctum token authentication required

### Frontend Protection
- `useAuth()` hook checks authentication status
- Route-level redirects in useEffect hooks
- Token stored in localStorage
- Automatic logout on unauthorized responses

## 📊 Data Models & Types

### Dashboard Metrics (useAdminDashboard)
```typescript
interface AdminDashboardMetrics {
  app_gross_revenue: number;
  total_transactions: number;
  active_vendors: number;
  vendor_earnings: number;
  affiliate_earnings: number;
  unpaid_affiliate_balance: number;
  unpaid_vendor_balance: number;
  active_affiliates: number;
  total_customers: number;
  approved_products: number;
  pending_withdrawals: number;
  total_paid_out: number;
}
```

### Admin User (useAdminUsers)
```typescript
interface AdminUser {
  id: number;
  email: string;
  name: string;
  user_type: string;
  status: string;
  created_at: string;
}
```

### Admin Transaction (useAdminTransactions)
```typescript
interface AdminTransaction {
  id: number;
  transaction_id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}
```

### Admin Withdrawal (useAdminWithdrawals)
```typescript
interface AdminWithdrawal {
  id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}
```

## 🔌 API Endpoints

### Dashboard
```
GET /api/admin/dashboard
```
Returns dashboard metrics (no parameters)

### Users Management
```
GET /api/admin/users                          # List users with pagination
GET /api/admin/users/{id}                    # Get user details
PUT/PATCH /api/admin/users/{id}              # Update user status/type
```

Query Parameters:
- `type`: Filter by user_type (vendor, affiliate, customer, admin)
- `status`: Filter by status (active, inactive, banned, pending, suspended, rejected)
- `search`: Search by name or email
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 50)

### Products Management
```
GET /api/admin/products                      # List products
GET /api/admin/products/{id}                # Get product details
POST /api/admin/products/{id}/approve        # Approve product
POST /api/admin/products/{id}/reject         # Reject product
```

Query Parameters for GET:
- `status`: Filter by approval_status (pending, approved, rejected)
- `search`: Search by name or product_id
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 50)

### Transactions Management
```
GET /api/admin/transactions                  # List transactions
GET /api/admin/transactions/{id}            # Get transaction details
```

Query Parameters:
- `type`: Filter by type (vendor_sale, commission)
- `status`: Filter by status (pending, completed, failed)
- `search`: Search by transaction_id
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 50)

### Withdrawals Management
```
GET /api/admin/withdrawals                   # List withdrawals
POST /api/admin/withdrawals/{id}/approve     # Approve withdrawal
POST /api/admin/withdrawals/{id}/reject      # Reject withdrawal
```

Query Parameters for GET:
- `status`: Filter by status (pending, completed, rejected)
- `search`: Search by user
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 50)

## 🎨 UI/UX Design

### Color Scheme
- **Background:** Slate-950 (very dark)
- **Cards:** Slate-900
- **Text:** White (primary), Gray-300 (secondary), Gray-400 (tertiary)
- **Accents:**
  - Blue-600: Primary actions, active states
  - Green-600: Approve actions
  - Red-600: Reject/danger actions
  - Yellow-500: Pending status

### Components
- **Tables:** Full-width with hover effects, sortable headers
- **Status Badges:** Color-coded (green for approved, yellow for pending, red for rejected)
- **Buttons:** Consistent sizing, hover states, disabled states
- **Forms:** Dark-themed inputs, validation feedback
- **Modals:** Overlay with centered dialog, backdrop

### Responsive Design
- Fixed sidebar on larger screens
- Mobile-friendly navigation
- Scalable tables with horizontal scroll
- Touch-friendly button sizes

## 📱 Frontend Hooks

### useAdmin.ts (Custom Hooks)

#### useAdminDashboard()
```typescript
const { 
  metrics, 
  loading, 
  error 
} = useAdminDashboard();
```

#### useAdminUsers(filters?)
```typescript
const { 
  users, 
  pagination, 
  loading, 
  error, 
  refetch 
} = useAdminUsers({ type, status, search, page });
```

#### useAdminTransactions(filters?)
```typescript
const { 
  transactions, 
  pagination, 
  loading, 
  error, 
  refetch 
} = useAdminTransactions({ type, status, search, page });
```

#### useAdminWithdrawals(filters?)
```typescript
const { 
  withdrawals, 
  pagination, 
  loading, 
  error, 
  refetch 
} = useAdminWithdrawals({ status, search, page });
```

## 🗄️ Database Changes

### New Migration
File: `database/migrations/2026_01_07_100000_add_rejection_columns_to_withdrawals.php`

Changes to `withdrawals` table:
- `rejected_at` (timestamp, nullable) - When withdrawal was rejected
- `rejected_by` (foreign key, nullable) - Admin user who rejected it

### Model Updates
**Withdrawal.php**
- Added `rejected_at` and `rejected_by` to `$fillable`
- Added `rejected_at` to `$casts` as datetime
- Added `rejectedBy()` relationship method

**Product.php**
- Already contains `approval_status`, `rejection_reason`, `approved_at`, `approved_by`
- No new changes needed

## 🔄 Authentication Flow

1. User logs in at `/login`
2. Backend returns token + user data
3. Frontend stores token in localStorage
4. Each request includes `Authorization: Bearer {token}` header
5. Backend validates token using Sanctum
6. Middleware checks user role
7. Admin pages verify user type before rendering

## 📋 Implementation Checklist

✅ Admin Dashboard with real metrics
✅ User Management page
✅ Product Approval system
✅ Transaction Viewing
✅ Withdrawal Approval with rejection
✅ Admin Navigation Sidebar
✅ Role-based access control
✅ Backend API endpoints
✅ Database migrations
✅ Error handling and validation
✅ Pagination support
✅ Search and filtering
✅ Responsive UI design
✅ TypeScript type safety
✅ Frontend build verification

## 🧪 Testing the Admin Panel

### 1. Login as Admin
```bash
# Use any account with user_type = 'admin' or 'superadmin'
# Login at http://localhost:3000/login
```

### 2. Access Admin Dashboard
```
Navigate to: http://localhost:3000/admin
```

### 3. Test Each Section
- **Dashboard:** Verify metrics load correctly
- **Users:** Filter by type/status, test pagination
- **Products:** Approve/reject test products
- **Transactions:** View and filter transactions
- **Withdrawals:** Approve/reject withdrawal requests

### 4. Verify API Calls
```bash
# Test dashboard endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://127.0.0.1:8000/api/admin/dashboard

# Test users endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://127.0.0.1:8000/api/admin/users?page=1&per_page=10

# Test product approval
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://127.0.0.1:8000/api/admin/products/1/approve
```

## 🚀 Future Enhancements

1. **Vendor Management Page** - Full vendor profile viewing and management
2. **Affiliate Management Page** - Affiliate tracking and performance analytics
3. **Reports Dashboard** - Advanced analytics and reporting
4. **Bulk Actions** - Bulk approve/reject products
5. **Admin Activity Logs** - Track all admin actions
6. **User Analytics** - User behavior and engagement metrics
7. **Commission Management** - Adjust commission rates per vendor/affiliate
8. **Payment Processing** - Integrate payment gateway for withdrawals
9. **Email Notifications** - Notify users of approvals/rejections
10. **Export Features** - Export users, transactions, withdrawals as CSV/PDF

## 📚 Files Modified/Created

### Created
- `frontend/src/hooks/useAdmin.ts`
- `frontend/src/app/components/AdminSidebar.tsx`
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/admin/users/page.tsx` (refactored)
- `frontend/src/app/admin/products/page.tsx` (refactored)
- `frontend/src/app/admin/transactions/page.tsx`
- `frontend/src/app/admin/withdrawals/page.tsx`
- `frontend/src/app/admin/vendors/page.tsx`
- `frontend/src/app/admin/affiliates/page.tsx`
- `backend/database/migrations/2026_01_07_100000_add_rejection_columns_to_withdrawals.php`

### Modified
- `frontend/src/app/components/AppLayout.tsx` - Added AdminSidebar conditional rendering
- `backend/app/Http/Controllers/Admin/DashboardController.php`
- `backend/app/Http/Controllers/Admin/UserController.php`
- `backend/app/Http/Controllers/Admin/TransactionController.php`
- `backend/app/Http/Controllers/Admin/ProductController.php`
- `backend/app/Http/Controllers/Admin/WithdrawalController.php`
- `backend/app/Models/Withdrawal.php`
- `backend/routes/api.php`
- `frontend/tsconfig.json` - Added path alias for @/app

## 🔗 Related Documentation

- [System Architecture](SYSTEM_ARCHITECTURE.md)
- [API Documentation](GETTING_STARTED.md)
- [Database Schema](SYSTEM_COMPLETE.md)
- [Testing Guide](TESTING_GUIDE.md)
