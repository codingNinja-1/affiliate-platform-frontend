# Automatic Withdrawal System - Setup Guide

## Overview
This feature enables instant automatic payouts to users (vendors and affiliates) when they request withdrawals. Payments are processed immediately through Paystack's Transfer API.

## How It Works

1. **User Requests Withdrawal**: User submits withdrawal with bank details
2. **Immediate Processing**: System automatically:
   - Creates Paystack transfer recipient (if first time)
   - Initiates bank transfer via Paystack API
   - Deducts balance from user account
3. **Real-time Response**: User gets instant confirmation
4. **Funds Transfer**: Money arrives in user's bank account within minutes
5. **Automatic Rollback**: If transfer fails, balance is automatically refunded

## Setup Instructions

### 1. Get Paystack API Keys

1. Sign up at [Paystack](https://paystack.com)
2. Go to Settings → API Keys & Webhooks
3. Copy your:
   - **Test Public Key** (starts with `pk_test_`)
   - **Test Secret Key** (starts with `sk_test_`)
   - **Live Public Key** (starts with `pk_live_`)
   - **Live Secret Key** (starts with `sk_live_`)

### 2. Configure Environment Variables

Update your `.env` file:

```env
# Paystack Configuration
PAYSTACK_TEST_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_TEST_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_LIVE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
PAYSTACK_LIVE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
PAYSTACK_MODE=test  # Use 'live' for production
```

### 3. Fund Your Paystack Account

**Important**: Automatic withdrawals work from your Paystack balance.

#### For Test Mode:
- Paystack provides test balance automatically
- No real money involved

#### For Live Mode:
1. Log in to your Paystack Dashboard
2. Go to **Balances** → **Fund Account**
3. Fund your Paystack balance (minimum ₦10,000 recommended)
4. This balance will be used for all withdrawal payouts

### 4. Run Database Migration

```bash
cd backend
php artisan migrate
```

This adds the following columns to `withdrawals` table:
- `recipient_code` - Stores Paystack recipient ID for faster future transfers
- `transfer_code` - Stores Paystack transfer transaction ID
- `bank_code` - Stores bank code for transfers
- `payout_response` - Stores full API response
- `processed_at` - Timestamp of payout

### 5. Update Admin Settings

In your admin panel:
1. Go to **Settings → Payment**
2. Enter your Paystack keys
3. Set mode to `test` or `live`
4. Save settings

## Testing

### Test in Development

1. Set `PAYSTACK_MODE=test` in `.env`
2. Use test API keys
3. Request a withdrawal with test bank details:
   - **Bank**: Any Nigerian bank
   - **Account Number**: `0123456789`
   - **Account Name**: `Test User`

4. Paystack will simulate the transfer without moving real money

### Test Bank Codes (Test Mode)
- Access Bank: `044`
- GTBank: `058`
- Zenith Bank: `057`
- First Bank: `011`

### Moving to Production

1. Ensure you have:
   - Live Paystack API keys configured
   - Funded Paystack balance (minimum ₦10,000)
   - Verified business account with Paystack

2. Update `.env`:
   ```env
   PAYSTACK_MODE=live
   ```

3. Test with small amounts first (₦1,000 - ₦5,000)

## Features

### Automatic Bank Verification
- System automatically looks up bank codes from bank names
- Validates account numbers before transfer
- Prevents failed transfers due to incorrect details

### Smart Recipient Management
- First withdrawal: Creates Paystack recipient
- Subsequent withdrawals: Reuses recipient code
- Faster processing for repeat users

### Automatic Error Handling
- Failed transfers automatically refund user balance
- All errors logged for admin review
- User receives clear error messages

### Security
- Balance is deducted before transfer attempt
- Prevents double withdrawal attempts
- Only one pending withdrawal per user allowed
- All transactions logged with full audit trail

## API Endpoints

### Get Bank List
```http
GET /api/banks
Authorization: Bearer {token}
```

Returns list of all supported Nigerian banks with codes.

### Verify Account Number
```http
POST /api/banks/verify-account
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_number": "0123456789",
  "bank_code": "058"
}
```

Returns account name if valid.

### Request Withdrawal
```http
POST /api/vendor/withdrawals
POST /api/affiliate/withdrawals
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 5000,
  "bank_name": "GTBank",
  "account_name": "John Doe",
  "account_number": "0123456789"
}
```

Processes instant payout and returns withdrawal details.

## Monitoring

### Check Withdrawal Status

All withdrawals are logged in the `withdrawals` table with:
- `status`: `pending`, `approved`, or `rejected`
- `transfer_code`: Paystack transfer reference
- `payout_response`: Full API response
- `processed_at`: Processing timestamp

### View Logs

```bash
cd backend
tail -f storage/logs/laravel.log | grep "Automatic withdrawal"
```

### Common Issues

#### "Insufficient balance"
- Check your Paystack balance in dashboard
- Fund your account if balance is low

#### "Bank not found"
- Bank name mismatch
- User should select from dropdown (use `/api/banks` endpoint)

#### "Recipient creation failed"
- Invalid account number
- Account doesn't exist
- Use account verification endpoint first

#### "Transfer failed"
- Insufficient Paystack balance
- Invalid recipient details
- Bank service temporarily unavailable
- Check `payout_response` field for details

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive config
3. **Monitor withdrawals** regularly in dashboard
4. **Set up alerts** for failed transfers
5. **Keep minimum balance** in Paystack (₦50,000+ recommended)
6. **Test thoroughly** in test mode before going live
7. **Implement rate limiting** on withdrawal endpoints
8. **Set daily withdrawal limits** per user if needed

## Support

- Paystack Documentation: https://paystack.com/docs/transfers/single-transfers
- Paystack Support: support@paystack.com
- Test your integration: https://paystack.com/docs/payments/test-payments

## Next Steps

Consider adding:
1. **Email notifications** when transfers succeed/fail
2. **SMS notifications** for high-value transfers
3. **Admin dashboard** to view all transfers
4. **Withdrawal limits** based on user tier
5. **Scheduled withdrawals** for specific times
6. **Multi-currency support** (USD, GBP, etc.)
7. **Webhook handler** for async transfer status updates
