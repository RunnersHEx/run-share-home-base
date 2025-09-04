# Admin Setup Instructions

## Issue Fixed: Foreign Key References

✅ **Fixed:** `admin_users` table now correctly references `profiles.id` instead of `auth.users(id)`

## Quick Admin Setup

To set up admin access, run this SQL query in your Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.admin_users (email) 
VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;

-- Verify it was added
SELECT * FROM public.admin_users;

-- Test the admin function
SELECT public.is_admin('your-email@example.com');
```

## What Changed

1. **Fixed Foreign Keys:**
   - `admin_users.user_id` now references `public.profiles(id)` 
   - `account_deletions.deleted_by_admin_id` now references `public.profiles(id)`

2. **Removed Setup UI:**
   - Removed AdminSetupCard component
   - Removed automatic setup logic
   - Back to clean, production-ready code

3. **Migration Files:**
   - Updated: `20250812000001-account-deletion-tracking.sql`
   - Updated: `20250101000001-setup-admin-panel.sql`

## To Deploy

```bash
supabase db push
```

Then manually add your admin user with the SQL query above.
