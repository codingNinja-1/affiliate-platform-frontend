# Withdrawal System & Admin Infrastructure - Complete Research

## 1. WITHDRAWAL-RELATED CONTROLLERS & MODELS

### Controllers
| Path | Purpose |
|------|---------|
| [backend/app/Http/Controllers/Vendor/WithdrawalController.php](backend/app/Http/Controllers/Vendor/WithdrawalController.php) | Handles vendor withdrawal requests & listing |
| [backend/app/Http/Controllers/Affiliate/WithdrawalController.php](backend/app/Http/Controllers/Affiliate/WithdrawalController.php) | Handles affiliate withdrawal requests & listing |
| [backend/app/Http/Controllers/Admin/WithdrawalController.php](backend/app/Http/Controllers/Admin/WithdrawalController.php) | Admin approval/rejection of withdrawals |
| [backend/app/Http/Controllers/BankController.php](backend/app/Http/Controllers/BankController.php) | Bank list & account verification |

### Key Model: Withdrawal
**File**: [backend/app/Models/Withdrawal.php](backend/app/Models/Withdrawal.php)

**Table Fields**:
```
id, uuid, withdrawal_ref, user_id, user_type, amount, currency, payment_method,
bank_name, account_name, account_number, bank_code, status, rejection_reason,
approved_at, approved_by, rejected_at, rejected_by, paid_at, payment_reference,
payment_meta, notes, recipient_code, transfer_code, payout_response, processed_at
```

**Fillable Fields**:
```php
[
    'uuid', 'withdrawal_ref', 'user_id', 'user_type', 'amount', 'currency',
    'payment_method', 'bank_name', 'account_name', 'account_number', 'bank_code',
    'status', 'rejection_reason', 'approved_at', 'approved_by', 'rejected_at',
    'rejected_by', 'paid_at', 'payment_reference', 'payment_meta', 'notes'
]
```

**Casts**:
```php
[
    'amount' => 'decimal:2',
    'payment_meta' => 'array',
    'approved_at' => 'datetime',
    'rejected_at' => 'datetime',
    'paid_at' => 'datetime',
]
```

**Scopes**:
- `scopePending()` - WHERE status = 'pending'
- `scopeApproved()` - WHERE status = 'approved'
- `scopePaid()` - WHERE status = 'paid'

**Relationships**:
- `user()` - belongsTo User::class
- `approvedBy()` - belongsTo User::class on 'approved_by'
- `rejectedBy()` - belongsTo User::class on 'rejected_by' (defined in migration)
- `commissions()` - hasMany Commission::class

### AutomaticWithdrawalService
**File**: [backend/app/Services/AutomaticWithdrawalService.php](backend/app/Services/AutomaticWithdrawalService.php)

**Key Methods**:

#### `processWithdrawal(Withdrawal $withdrawal, User $user): array`
**Location**: Lines 22-64  
**What it does**:
1. Gets bank code from Paystack bank list
2. Creates or retrieves Paystack transfer recipient
3. Initiates transfer via Paystack API
4. Updates withdrawal status to 'approved' on success
5. Returns success/failure response

**Status Updates**:
- SUCCESS: Sets status to 'approved', sets `processed_at = now()`
- FAILURE: Calls `rollbackWithdrawal()` which sets status to 'rejected'

**Where it's invoked**:
- [Vendor/WithdrawalController.php line 114](backend/app/Http/Controllers/Vendor/WithdrawalController.php#L114)
- [Affiliate/WithdrawalController.php line 124](backend/app/Http/Controllers/Affiliate/WithdrawalController.php#L124)

**Invocation Pattern** (same in both controllers):
```php
// After creating withdrawal request
$result = $withdrawalService->processWithdrawal($withdrawal, $user);

if (!$result['success']) {
    return response()->json(['success' => false, 'message' => $result['message']], 400);
}
// Continue with notification...
```

**Private Methods**:
- `getOrCreateRecipient()` - Gets/creates Paystack recipient code
- `getBankCode()` - Maps bank name to Paystack bank code
- `isPaystackTransferRestriction()` - Detects account limitations
- `rollbackWithdrawal()` - Refunds balance on failure

---

## 2. ADMIN CONTROLLERS & ENDPOINTS

### Admin WithdrawalController
**File**: [backend/app/Http/Controllers/Admin/WithdrawalController.php](backend/app/Http/Controllers/Admin/WithdrawalController.php)

**Admin Withdrawal Endpoints** (from [routes/api.php](backend/routes/api.php) lines 105-108):
```
GET    /api/admin/withdrawals           - List withdrawals (with filtering)
POST   /api/admin/withdrawals/{id}/approve   - Approve pending withdrawal
POST   /api/admin/withdrawals/{id}/reject    - Reject pending withdrawal (requires 'reason')
```

**Key Methods**:

#### `index(Request $request)`
- Filters by status (query param)
- Filters by user search (first_name, last_name, email)
- Pagination support (page, per_page)
- Returns paginated list with user relationship loaded

#### `approve(Request $request, Withdrawal $withdrawal)`
**Location**: Lines 60-125
- **Guard**: Only admin/superadmin
- **Status Check**: Only processes if `status !== 'pending'`
- **Updates**:
  - Sets `status = 'approved'`
  - Sets `approved_at = now()`
  - Sets `approved_by = Auth::user()->id`
- **Side Effects**:
  - Increments `affiliate.total_withdrawn` or `vendor.total_withdrawn`
  - **Note**: Balance was already deducted at withdrawal creation
- **Notifications**:
  - Sends `WithdrawalApprovedMail` to user
  - Logs to `EmailLog`

#### `reject(Request $request, Withdrawal $withdrawal)`
**Location**: Lines 128-223
- **Guard**: Only admin/superadmin
- **Validation**: Requires `reason` string (max 500 chars)
- **Status Check**: Only processes if `status !== 'pending'`
- **Updates**:
  - Sets `status = 'rejected'`
  - Sets `rejection_reason = $reason`
  - Sets `rejected_at = now()`
  - Sets `rejected_by = Auth::user()->id`
- **Side Effects**:
  - Increments balance back to user's profile
- **Notifications**:
  - Sends `WithdrawalRejectedMail` to user
  - Logs to `EmailLog`

### Admin SettingsController
**File**: [backend/app/Http/Controllers/Admin/SettingsController.php](backend/app/Http/Controllers/Admin/SettingsController.php)

**Settings Endpoints** (from [routes/api.php](backend/routes/api.php) lines 109-110):
```
GET    /api/admin/settings/payment - Get payment settings
POST   /api/admin/settings/payment - Update payment settings
```

**Current Payment Settings**:
- `paystack_test_public_key`
- `paystack_test_secret_key`
- `paystack_live_public_key`
- `paystack_live_secret_key`
- `paystack_mode` (test/live)

### Admin DashboardController
**File**: [backend/app/Http/Controllers/Admin/DashboardController.php](backend/app/Http/Controllers/Admin/DashboardController.php)

**Withdrawal Metrics** (lines 55):
```php
$pendingWithdrawals = Withdrawal::where('status', 'pending')->count();
```

---

## 3. WITHDRAWAL STATUS VALUES & MIGRATIONS

### Status Enum
**Defined in**: [2026_01_05_164545_create_withdrawals_table.php](backend/database/migrations/2026_01_05_164545_create_withdrawals_table.php)

**Possible Status Values**:
```
'pending'    - Initial state, awaiting processing
'processing' - Currently being processed
'approved'   - Approved by admin OR auto-approved by AutomaticWithdrawalService
'rejected'   - Rejected by admin OR failed auto-processing
'paid'       - Successfully paid out (set by later processing)
```

### Migrations Timeline

1. **Initial Creation** - [2026_01_05_164545_create_withdrawals_table.php](backend/database/migrations/2026_01_05_164545_create_withdrawals_table.php)
   - Creates main table with core fields
   - Indexes: `[user_id, status]`, `status`, `withdrawal_ref`

2. **Payment Method** - [2026_01_05_232947_add_payment_method_to_withdrawals_table.php](backend/database/migrations/2026_01_05_232947_add_payment_method_to_withdrawals_table.php)
   - Adds `payment_method` column (default: 'bank_transfer')
   - Makes bank fields nullable for non-bank methods

3. **Rejection Tracking** - [2026_01_07_100000_add_rejection_columns_to_withdrawals.php](backend/database/migrations/2026_01_07_100000_add_rejection_columns_to_withdrawals.php)
   - Adds `rejected_at` timestamp
   - Adds `rejected_by` foreign key to users table

4. **Payout Processing** - [2026_02_01_000001_add_payout_fields_to_withdrawals_table.php](backend/database/migrations/2026_02_01_000001_add_payout_fields_to_withdrawals_table.php)
   - Adds `recipient_code` (Paystack recipient)
   - Adds `transfer_code` (Paystack transfer ID)
   - Adds `bank_code` (Paystack bank code)
   - Adds `payout_response` (JSON response from Paystack)
   - Adds `processed_at` timestamp

### Admin Withdrawal Rejection Flow

**When Admin Rejects** (via `WithdrawalController.reject()`):
1. Validates rejection reason required
2. Updates withdrawal: `status='rejected', rejected_at=now(), rejected_by=user_id, rejection_reason=$reason`
3. Sends `WithdrawalRejectedMail` with reason
4. **Refunds balance** to affiliate/vendor profile

**When Auto-Processing Fails** (via `AutomaticWithdrawalService.rollbackWithdrawal()`):
1. Sets `status='rejected'`
2. Stores error in `payout_response` as JSON
3. Sets `processed_at=now()`
4. **Refunds balance** to affiliate/vendor profile
5. Does NOT send email (no admin rejection flow)

### Email/Notification Flow

#### WithdrawalProcessingNotification
**File**: [backend/app/Notifications/WithdrawalProcessingNotification.php](backend/app/Notifications/WithdrawalProcessingNotification.php)
- Sent immediately after auto-processing starts
- Template key: `withdrawal_processing`
- Replacements: `{name}`, `{amount}`, `{withdrawal_ref}`, `{bank_name}`, `{account_number}`

#### WithdrawalApprovedMail
**File**: [backend/app/Mail/WithdrawalApprovedMail.php](backend/app/Mail/WithdrawalApprovedMail.php)
- Sent when admin approves withdrawal
- Subject template key: `email_template.withdrawal_approved.subject`
- Body template key: `email_template.withdrawal_approved.body`
- Replacements: `{name}`, `{amount}`, `{withdrawal_ref}`, `{bank_name}`, `{account_number}`

#### WithdrawalRejectedMail
**File**: [backend/app/Mail/WithdrawalRejectedMail.php](backend/app/Mail/WithdrawalRejectedMail.php)
- Sent when admin rejects withdrawal
- Subject template key: `email_template.withdrawal_rejected.subject`
- Body template key: `email_template.withdrawal_rejected.body`
- Replacements: `{name}`, `{amount}`, `{withdrawal_ref}`, `{reason}`
- Includes admin-provided rejection reason

---

## 4. CONFIGURATION & SETTINGS STORAGE

### Settings Model
**File**: [backend/app/Models/Setting.php](backend/app/Models/Setting.php)

**Table**: `settings`

**Schema**:
```
id, key (unique), value, type, group, timestamps
```

**Supported Types**:
- `'string'` - Stored as text
- `'boolean'` - Stored as text, cast via FILTER_VALIDATE_BOOLEAN
- `'integer'` - Stored as text, cast to int
- `'json'` - Stored as JSON string, decoded to array

**Storage Methods**:
```php
Setting::getValue(string $key, $default = null)       // Get single setting
Setting::setValue(string $key, $value, string $type, string $group)  // Set/update
Setting::getByGroup(string $group): array             // Get all by group
```

### Database Integration
**Migration**: [2026_01_08_120000_create_settings_table.php](backend/database/migrations/2026_01_08_120000_create_settings_table.php)

**Initial Settings** (Payment group):
```php
[
    'paystack_test_public_key'  => '' (type: string, group: payment)
    'paystack_test_secret_key'  => '' (type: string, group: payment)
    'paystack_live_public_key'  => '' (type: string, group: payment)
    'paystack_live_secret_key'  => '' (type: string, group: payment)
    'paystack_mode'             => 'test' (type: string, group: payment)
]
```

### PaystackService Integration
**File**: [backend/app/Services/PaystackService.php](backend/app/Services/PaystackService.php)

**Constructor** (Lines 14-25):
```php
public function __construct()
{
    $mode = Setting::getValue('paystack_mode', 'test');
    
    if ($mode === 'live') {
        $this->secretKey = Setting::getValue('paystack_live_secret_key', '');
        $this->publicKey = Setting::getValue('paystack_live_public_key', '');
    } else {
        $this->secretKey = Setting::getValue('paystack_test_secret_key', '');
        $this->publicKey = Setting::getValue('paystack_test_public_key', '');
    }
}
```

**Reads Settings On Every Instantiation** - This is key for dynamic configuration without restart

---

## 5. AUTOMATIC PROCESSING ARCHITECTURE

### Where Automatic Processing Happens

**Entry Points** (both vendor & affiliate):
1. User calls `POST /api/vendor/withdrawals` or `POST /api/affiliate/withdrawals`
2. Controller validates request & creates Withdrawal record with `status='pending'`
3. **Immediately calls** `$withdrawalService->processWithdrawal($withdrawal, $user)`
4. Processing happens synchronously (not queued)

**Processing Flow**:
```
User Request
    ↓
Create Withdrawal (status=pending)
    ↓
Call AutomaticWithdrawalService.processWithdrawal()
    ├─ Get bank code from Paystack
    ├─ Create recipient on Paystack
    ├─ Initiate transfer on Paystack
    ├─ Update withdrawal (status=approved, processed_at=now)
    └─ Send confirmation email
    ↓
IF SUCCESS: Return 201 with withdrawal data
IF FAILURE: Rollback withdrawal (status=rejected, refund balance)
```

### Current Flow Without Toggle

```
Withdrawal Request
    ↓
[HARDCODED] Call AutomaticWithdrawalService.processWithdrawal()
    ↓
Auto-process OR Rollback immediately
```

**Result**: All withdrawals are immediately processed. There is no way to:
- Disable automatic processing
- Route to manual admin approval instead
- Queue for later batch processing

---

## 6. TESTING & DEBUGGING SCRIPTS

### Check Withdrawal Status
**File**: [backend/check_withdrawal.php](backend/check_withdrawal.php)

Simple CLI script to check specific withdrawal and list all pending:
```bash
php check_withdrawal.php
```

### Test Withdrawals
**File**: [backend/test_withdrawals.php](backend/test_withdrawals.php)

Comprehensive vendor/affiliate balance and withdrawal debugging:
- Shows vendor/affiliate profile balance
- Lists all withdrawals for user
- Shows pending withdrawal calculation
- Uses withdrawal relationships

### Commands Directory
**Path**: [backend/app/Console/Commands/](backend/app/Console/Commands/)

**Existing Commands**:
- `FixWithdrawalBalances.php` - Manual balance reconciliation
- `UpdateAdminEmail.php` - Admin email update
- `UpdateAffiliateBalances.php` - Balance recalculation

---

## 7. KEY CODE PATTERNS

### From Vendor WithdrawalController.store()
**Location**: [Lines 113-115](backend/app/Http/Controllers/Vendor/WithdrawalController.php#L113-L115)

```php
// Immediately process automatic withdrawal
$result = $withdrawalService->processWithdrawal($withdrawal, $user);

if (!$result['success']) {
    return response()->json([
        'success' => false,
        'message' => $result['message'],
    ], 400);
}
```

### From AutomaticWithdrawalService.processWithdrawal()
**Success Path** (Lines 50-55):
```php
$withdrawal->update([
    'transfer_code' => $transferResponse['data']['transfer_code'] ?? null,
    'payout_response' => json_encode($transferResponse),
    'status' => 'approved',
    'processed_at' => now(),
]);
```

**Failure Path** (Lines 167-169):
```php
$withdrawal->update([
    'status' => 'rejected',
    'payout_response' => json_encode(['error' => $reason]),
    'processed_at' => now(),
]);
```

### From Admin WithdrawalController.approve()
**Location**: [Lines 77-95](backend/app/Http/Controllers/Admin/WithdrawalController.php#L77-L95)

```php
if ($withdrawal->status !== 'pending') {
    return response()->json([
        'success' => false,
        'message' => 'Only pending withdrawals can be approved.',
    ], 400);
}

$withdrawal->update([
    'status' => 'approved',
    'approved_at' => now(),
    'approved_by' => $user->id,
]);

// Update total_withdrawn for the user's profile
if ($withdrawal->user_type === 'affiliate') {
    $affiliate = Affiliate::where('user_id', $withdrawal->user_id)->first();
    if ($affiliate) {
        $affiliate->increment('total_withdrawn', $withdrawal->amount);
    }
}
```

---

## 8. CRITICAL OBSERVATION: DUAL APPROVAL PATHS

**Current System Has CONFLICTING Approval Logic**:

1. **Auto-Approval** (AutomaticWithdrawalService):
   - Sets `status='approved'` immediately on successful Paystack processing
   - Does NOT set `approved_by` or `approved_at`
   - Happens synchronously in user request

2. **Admin Approval** (Admin WithdrawalController.approve()):
   - Sets `status='approved'` only if `status=='pending'`
   - Sets `approved_by` and `approved_at` when admin approves
   - Increments `total_withdrawn` counter

**Logic Issue**: 
- After auto-approval sets status to 'approved', admin.approve() will reject: `Only pending withdrawals can be approved`
- This means **auto-approved withdrawals CANNOT be manually approved by admin**
- There's no flow where both `approved_by` and auto-processing both fire

---

## 9. PROPOSED SOLUTION ARCHITECTURE

### Adding an "Automatic Withdrawals" Toggle

**New Setting Key**:
```
Key: 'enable_automatic_withdrawals'
Type: 'boolean'
Group: 'payment'
Default: true
```

**Updated SettingsController** to manage this toggle:
```php
// Get
$settings = Setting::getByGroup('payment');
// Includes enable_automatic_withdrawals: true/false

// Update
Setting::setValue('enable_automatic_withdrawals', $enabled, 'boolean', 'payment');
```

**Updated Withdrawal Processing Logic** (in both controllers):
```php
// Only auto-process if enabled
$autoWithdrawalsEnabled = Setting::getValue('enable_automatic_withdrawals', true);

if ($autoWithdrawalsEnabled) {
    $result = $withdrawalService->processWithdrawal($withdrawal, $user);
    // Handle result...
} else {
    // Mark as pending for admin approval
    return response()->json([
        'success' => true,
        'message' => 'Withdrawal request submitted for admin approval',
        'data' => $withdrawal,
    ], 201);
}
```

**Admin Dashboard Update**:
- Show pending withdrawals count by status
- Add bulk approval/rejection
- Link to manual settings toggle

---

## 10. FILE DEPENDENCY MAP

```
AutomaticWithdrawalService (central hub)
├── Uses: PaystackService (bank codes, recipient creation, transfer)
├── Uses: Withdrawal model
├── Used by: Vendor/WithdrawalController.store()
├── Used by: Affiliate/WithdrawalController.store()
├── Used by: BankController (for bank listings)
└── Creates: WithdrawalProcessingNotification

Admin WithdrawalController
├── Reads: Withdrawal model (pending statuses)
├── Creates: WithdrawalApprovedMail
├── Creates: WithdrawalRejectedMail
├── Updates: Affiliate model (balance, total_withdrawn)
├── Updates: Vendor model (balance, total_withdrawn)
└── Logs: EmailLog

Settings Model
├── Storage: settings table
├── Used by: PaystackService
├── Used by: Admin SettingsController
├── Email templates referenced by: WithdrawalApprovedMail, WithdrawalRejectedMail
└── Payment config read by: All withdrawal-related code

Routes (routes/api.php)
├── POST /vendor/withdrawals → Vendor/WithdrawalController.store()
├── POST /affiliate/withdrawals → Affiliate/WithdrawalController.store()
├── POST /admin/withdrawals/{id}/approve → Admin/WithdrawalController.approve()
├── POST /admin/withdrawals/{id}/reject → Admin/WithdrawalController.reject()
└── GET /admin/settings/payment → Admin/SettingsController.getPaymentSettings()
```

---

## SUMMARY FOR IMPLEMENTATION

**To add automatic withdrawal toggle:**

1. **Add setting** to database via migration or Settings::setValue()
   - Key: `enable_automatic_withdrawals` (boolean, payment group)

2. **Modify webhook/entry points**:
   - [Vendor/WithdrawalController.php line 113](backend/app/Http/Controllers/Vendor/WithdrawalController.php#L113)
   - [Affiliate/WithdrawalController.php line 123](backend/app/Http/Controllers/Affiliate/WithdrawalController.php#L123)
   - Wrap `processWithdrawal()` call in toggle check

3. **Extend Admin SettingsController** to manage toggle
   - Add to getPaymentSettings()
   - Add to validation in updatePaymentSettings()

4. **Update Admin Withdrawal UI** to show automatic vs pending
   - Add filter for withdrawal source (auto vs manual)

5. **Ensure backward compatibility**:
   - Default toggle to `true` (current behavior)
   - When disabled, withdrawals go to pending → admin review

