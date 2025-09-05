# Stripe Environment Variables Setup

## Required Environment Variables for Supabase Edge Functions

You need to set these environment variables in your Supabase dashboard under **Project Settings > Edge Functions**:

### 1. STRIPE_SECRET_KEY
- **Value**: Your Stripe secret key (starts with `sk_live_` for production or `sk_test_` for testing)
- **Where to find**: Stripe Dashboard > Developers > API Keys
- **Used by**: `create-subscription`, `stripe-webhook`, `manage-subscription`, `get-payment-session` functions

### 2. STRIPE_WEBHOOK_SECRET
- **Value**: Your Stripe webhook endpoint secret (starts with `whsec_`)
- **Where to find**: Stripe Dashboard > Developers > Webhooks > [Your webhook endpoint] > Signing secret
- **Used by**: `stripe-webhook` function for verifying webhook authenticity

## How to Set Environment Variables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** (gear icon in sidebar)
3. Click on **Edge Functions** in the left menu
4. Add the environment variables:
   ```
   STRIPE_SECRET_KEY=sk_test_or_live_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## Webhook Endpoint Configuration

### In Stripe Dashboard:
1. Go to **Developers > Webhooks**
2. Click **+ Add endpoint**
3. Set endpoint URL to: `https://[your-supabase-project-ref].supabase.co/functions/v1/stripe-webhook`
4. Select events to send:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** and use it as `STRIPE_WEBHOOK_SECRET`

## Testing the Integration

### For Development:
1. Use Stripe test mode keys (`sk_test_...`)
2. Use Stripe CLI for webhook testing:
   ```bash
   stripe listen --forward-to https://[your-supabase-project-ref].supabase.co/functions/v1/stripe-webhook
   ```

### For Production:
1. Use Stripe live mode keys (`sk_live_...`)
2. Configure the webhook endpoint in Stripe dashboard
3. Monitor webhook delivery in Stripe dashboard

## Security Notes

- ⚠️ **Never commit these keys to version control**
- ✅ Environment variables in Supabase are secure and encrypted
- ✅ Keys are only accessible by your Edge Functions
- ✅ Webhook secret ensures only Stripe can call your webhook endpoint

## Environment Variable Format

In Supabase Edge Functions environment variables section:
```
STRIPE_SECRET_KEY=sk_test_51ABC...xyz
STRIPE_WEBHOOK_SECRET=whsec_ABC...xyz
```

Replace the example values with your actual Stripe keys.
