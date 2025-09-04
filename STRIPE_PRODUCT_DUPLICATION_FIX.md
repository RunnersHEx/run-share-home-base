# Stripe Product Duplication Fix

## Problem Identified ❌

Your current Stripe implementation was creating **duplicate products for every subscription**. This happens because the `create-subscription` function was using `price_data` with inline `product_data`, which creates a new Stripe Product and Price for each checkout session.

**Impact:**
- If 100 users subscribe, you get 100 identical products in Stripe dashboard
- Cluttered Stripe dashboard
- Difficult to manage products and analytics
- Potential confusion for customer support

## Solution Implemented ✅

### 1. Fixed `create-subscription/index.ts`
- **Before:** Used `price_data` with inline product creation
- **After:** Uses predefined price IDs with `getOrCreateAnnualPrice()` helper function
- **Result:** Only ONE product will exist, reused for all subscriptions

### 2. Added Product Management Helper
- `getOrCreateAnnualPrice()` function checks for existing products/prices
- Creates product/price only if they don't exist
- Returns the price ID for reuse

### 3. Created Setup Function
- New function: `setup-stripe-products/index.ts`
- Can be called once to pre-create products and get their IDs
- Also creates a monthly price for future use

## How It Works Now 🔄

1. **First Subscription:**
   - Checks if "Membresía RunnersHEx" product exists
   - If not, creates product and annual price (€59)
   - Uses this price for checkout

2. **Subsequent Subscriptions:**
   - Finds existing product and price
   - Reuses the same price ID
   - **No duplicate products created**

## Deployment Instructions 📋

### Option 1: Automatic Fix (Recommended)
The fix is already implemented in your code. Just redeploy the `create-subscription` function:

```bash
# Deploy the updated function
supabase functions deploy create-subscription
```

### Option 2: Pre-setup Products (Optional)
If you want to pre-create the products before any subscriptions:

```bash
# Deploy the setup function
supabase functions deploy setup-stripe-products

# Call it once to create products
curl -X POST https://your-project.supabase.co/functions/v1/setup-stripe-products \\
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Cleanup Existing Duplicates 🧹

If you already have duplicate products in Stripe:

### 1. Manual Cleanup (Recommended)
1. Go to your Stripe Dashboard → Products
2. Find all duplicate "Membresía RunnersHEx" products
3. Keep ONE product (the newest or most complete one)
4. Archive the duplicates (don't delete - this could affect existing subscriptions)

### 2. API Cleanup Script
```javascript
// Run this in your Stripe dashboard or local script
const stripe = require('stripe')('sk_test_...');

async function cleanupDuplicateProducts() {
  const products = await stripe.products.list({ active: true, limit: 100 });
  
  const runnerProducts = products.data.filter(p => 
    p.name === "Membresía RunnersHEx"
  );
  
  console.log(`Found ${runnerProducts.length} runner products`);
  
  // Keep the first one, archive the rest
  for (let i = 1; i < runnerProducts.length; i++) {
    await stripe.products.update(runnerProducts[i].id, { active: false });
    console.log(`Archived product: ${runnerProducts[i].id}`);
  }
}

// Run it
cleanupDuplicateProducts();
```

## Verification ✅

To verify the fix is working:

1. **Check Stripe Dashboard:**
   - Should see only ONE "Membresía RunnersHEx" product
   - Multiple subscriptions should use the same product

2. **Test New Subscriptions:**
   - Create a test subscription
   - Check that no new product is created in Stripe

3. **Monitor Logs:**
   - New logs will show "Found existing product" instead of "Created new product"

## Benefits of This Fix 🎯

- **Clean Dashboard:** Only one product per membership type
- **Better Analytics:** All subscriptions grouped under one product
- **Easier Management:** Consistent product and pricing structure
- **Future-Proof:** Easy to add monthly plans or modify existing ones
- **Support-Friendly:** Clear product organization for customer service

## Future Enhancements 🚀

With this structure in place, you can easily:
- Add monthly subscription options
- Create different membership tiers
- Implement promotional pricing
- Add freemium plans
- Better track subscription analytics

## Environment Variables 📝

No additional environment variables needed. The fix uses your existing:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Notes 📌

- **Existing Subscriptions:** Not affected, they'll continue working normally
- **Webhooks:** No changes needed to webhook handling
- **Database:** No database changes required
- **User Experience:** No impact on user experience
- **Testing:** Safe to test in development environment first

The fix is **backward-compatible** and **non-breaking** - it only prevents future duplicate product creation while maintaining all existing functionality.
