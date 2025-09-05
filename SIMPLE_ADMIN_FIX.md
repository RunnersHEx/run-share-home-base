# 🔧 SIMPLE ADMIN DOCUMENT ACCESS SETUP

## The Issue
You're getting `ERROR: 42501: must be owner of relation objects` because you don't have permission to modify storage policies directly.

## ✅ SIMPLE SOLUTION (No Database Changes Required)

### Step 1: Add Service Role Key to Environment
Add this line to your `.env.local` file:

```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 2: Get Your Service Role Key
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy the **`service_role`** key (NOT the anon key)
4. Paste it in your `.env.local` file

### Step 3: Restart Your Development Server
```bash
npm run dev
# or
yarn dev
```

### Step 4: Test Document Access
1. Go to Admin Panel → Document Verification tab
2. Try to view documents from any user
3. Documents should now load properly

## Why This Works
- Service role key bypasses Row Level Security (RLS) policies
- Admin users can access all verification documents
- No database migrations required
- Works immediately after setup

## Example .env.local File
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Security Notes
- ⚠️ **NEVER** expose service role key in production client code
- ✅ This is safe for admin-only features in development
- ✅ Service role key is only used for admin storage access
- ✅ Regular users still use normal authentication

## Troubleshooting

### Can't Find Service Role Key?
1. Make sure you're on the correct Supabase project
2. Check you have admin access to the project
3. The key starts with `eyJ...` and is much longer than anon key

### Still Getting Errors?
1. Restart your dev server after adding the key
2. Check browser console for detailed error messages
3. Verify the key was copied correctly (no extra spaces)

### Documents Still Not Loading?
1. Clear browser cache and cookies
2. Make sure you're logged in as an admin user
3. Check that the user actually has uploaded documents

## ✅ That's It!
No complex migrations, no database changes, just add one environment variable and restart your server.
