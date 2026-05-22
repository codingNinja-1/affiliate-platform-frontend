# Paystack Webhook & Subscription Setup

This document explains how to configure Paystack webhooks for subscription payments, test them, and run reconciliation in this project.

1) Migrate database

Run migrations to create the `subscription_payments` table:

```bash
php artisan migrate
```

2) Settings

- Set Paystack keys and mode in your application's `Setting` store (via Admin UI or DB):
  - `paystack_mode` = `test` or `live`
  - `paystack_test_secret_key` and `paystack_test_public_key`
  - `paystack_live_secret_key` and `paystack_live_public_key`

The webhook signature verification uses the secret key configured in `Setting::getValue`.

3) Configure Paystack webhook

- In the Paystack dashboard, set the webhook URL to:

  `https://<your-backend-domain>/api/webhooks/paystack`

- Paystack will send `x-paystack-signature` header. The server verifies HMAC SHA512 using your Paystack secret key.

4) How the flow works

- When a user starts a subscription payment, the backend creates a `subscription_payments` record with a stable `reference` and returns the Paystack `authorization_url`.
- Paystack calls the webhook on completed payments. The webhook verifies the signature, finds the `subscription_payments` record by `reference`, marks it `success`, and activates the user's subscription atomically. The webhook is idempotent.
- If the user is redirected back to the frontend (return URL), the return page should query the public verify endpoint to show status by `reference`.

5) Public verify endpoint (return page)

- The frontend can call:

  `GET /api/subscriptions/public/verify/{reference}`

  This endpoint will verify the transaction with Paystack and activate the subscription if successful. It allows showing status even if the user is logged out.

6) Reconciliation

- An artisan command `subscriptions:reconcile` is provided to verify pending subscription payments older than 5 minutes using Paystack's verify endpoint. The command is scheduled in `app/Console/Kernel.php` to run every 5 minutes.

Run manually:

```bash
php artisan subscriptions:reconcile
```

7) Testing webhooks locally

- Use `ngrok` or similar to expose your local backend to the internet, e.g.:

```bash
ngrok http 8000
```

- Set the forwarded `https` URL in Paystack dashboard for webhook.

- Use Paystack test cards / flows to generate events, or simulate webhook POSTs using the payload Paystack provides in their docs. Make sure to compute `x-paystack-signature` as HMAC SHA512 of the raw JSON body using your secret key.

8) Monitoring & logs

- Webhook warnings or unknown references are logged. Monitor `storage/logs/laravel.log` for entries like "Paystack webhook for unknown subscription reference".

9) Further recommendations

- Add email notifications for subscription activation/failure.
- Enhance frontend to poll the public verify endpoint on the return page until payment transitions from `pending` to `success`/`failed`.
