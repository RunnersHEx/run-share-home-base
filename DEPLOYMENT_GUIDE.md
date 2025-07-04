# Production Deployment Configuration Guide

## Environment Variables Required

### For Lovable.dev Deployment
Navigate to Project Settings → Environment Variables and add:

```
VITE_SUPABASE_URL=https://tufikuyzllmrfinvmltt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZmlrdXl6bGxtcmZpbnZtbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDk2MTUsImV4cCI6MjA2NTQ4NTYxNX0.5HmCwwu6MV_0swNIV92vC-IQXyT1aCMUcN-qJW_V0Bg
VITE_ENVIRONMENT=production
```

### For Vercel/Netlify Deployment
Add these environment variables in your deployment dashboard:

```
VITE_SUPABASE_URL=https://tufikuyzllmrfinvmltt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZmlrdXl6bGxtcmZpbnZtbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDk2MTUsImV4cCI6MjA2NTQ4NTYxNX0.5HmCwwu6MV_0swNIV92vC-IQXyT1aCMUcN-qJW_V0Bg
VITE_ENVIRONMENT=production
```

### For Supabase Edge Functions
In Supabase Dashboard → Edge Functions → Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_... (your live Stripe secret key)
STRIPE_WEBHOOK_SECRET=whsec_... (your webhook endpoint secret)
SUPABASE_SERVICE_ROLE_KEY=... (your service role key)
```

## Security Checklist

✅ API keys moved to environment variables
✅ Environment validation implemented
✅ Production logging configured
✅ .env.local added to .gitignore
✅ Runtime validation for missing environment variables

## Build Commands

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Deployment Steps

1. **Update Environment Variables**: Set all required environment variables in your deployment platform
2. **Test Build**: Run `npm run build` locally to ensure everything compiles
3. **Deploy**: Push to your deployment platform
4. **Verify**: Check that the application starts without environment validation errors

## Monitoring

The application will now:
- Fail fast if critical environment variables are missing
- Log properly with timestamps in production
- Only show debug logs in development environment
- Validate configuration on startup

## Next Steps

After deployment:
1. Test user registration and login
2. Verify Stripe payments work with production webhook
3. Check that all features work as expected
4. Monitor for any runtime errors
