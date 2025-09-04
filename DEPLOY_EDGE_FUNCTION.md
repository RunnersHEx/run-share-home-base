# Deploy Edge Function Instructions

## Prerequisites
1. Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

## Deployment Steps

### Step 1: Login to Supabase
```bash
supabase login
```

### Step 2: Link to your project (run from project root)
```bash
cd D:\upwork\mygit_running
supabase link --project-ref tufikuyzllmrfinvmltt
```

### Step 3: Deploy the Edge Function
```bash
supabase functions deploy delete-user
```

### Alternative: Deploy all functions
```bash
supabase functions deploy
```

## Verify Deployment

### Check in Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/tufikuyzllmrfinvmltt
2. Navigate to Edge Functions
3. You should see `delete-user` function listed

### Test the function:
```bash
supabase functions invoke delete-user --data '{"user_id":"test","confirmation_text":"test"}'
```

## Environment Variables (if needed)
If your function needs additional environment variables:
```bash
supabase secrets set VARIABLE_NAME=value
```

## Troubleshooting

### If link fails:
```bash
supabase projects list
# Find your project and use the correct reference
```

### If deploy fails:
1. Check you're in the correct directory
2. Verify the function file exists at `supabase/functions/delete-user/index.ts`
3. Check Supabase CLI is logged in: `supabase status`

### If function errors:
1. Check logs in Supabase Dashboard > Edge Functions > delete-user > Logs
2. Verify environment variables are set
3. Check function permissions

## Quick Commands Summary
```bash
# Navigate to project
cd D:\upwork\mygit_running

# Login (if not already)
supabase login

# Link project (if not already)
supabase link --project-ref tufikuyzllmrfinvmltt

# Deploy the function
supabase functions deploy delete-user

# Check status
supabase functions list
```
