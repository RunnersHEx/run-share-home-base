# 🔒 Admin Storage Access Fix - CORRECTED

## Problem
Admin users cannot view verification documents uploaded by other users due to:
1. Row Level Security (RLS) policies on the Supabase storage bucket
2. **NEW:** "column reference user_id is ambiguous" SQL error

**Errors:** 
- `StorageApiError: Object not found` 
- `StorageApiError: column reference "user_id" is ambiguous`

## Root Cause
The original fix created SQL ambiguity when Supabase tried to resolve table references in storage policies. The `is_admin_user()` function caused conflicts with existing table columns.

## ✅ Corrected Solution

### Step 1: Apply Corrected Migration
Run the updated migration script:

**Windows:**
```bash
./fix-admin-storage-access.bat
```

**Linux/Mac:**
```bash
chmod +x fix-admin-storage-access.sh
./fix-admin-storage-access.sh
```

**Manual Migration (Alternative):**
```bash
npx supabase db push
```

### Step 2: Verify Fix
1. Go to Admin Panel → Document Verification tab
2. Try to view documents from any user
3. Documents should now load properly without SQL errors

## What the Corrected Migration Does

The migration `20250812000012-fix-admin-storage-ambiguity.sql`:

1. **Removes Problematic Policies:** Drops the original policies that caused SQL ambiguity
2. **Creates Simplified Function:** `is_admin_user_storage()` - Cleaner admin check without conflicts
3. **Single Comprehensive Policy:** `Admin full access to verification docs` - One policy for all operations
4. **Fixes SQL Ambiguity:** Uses proper table prefixes and function naming

## Key Changes Made

### Before (Problematic):
```sql
-- Caused ambiguous column reference
CREATE FUNCTION is_admin_user(user_id uuid)
-- Multiple separate policies
```

### After (Fixed):
```sql
-- Clean function without parameter conflicts
CREATE FUNCTION public.is_admin_user_storage()
-- Single comprehensive policy
CREATE POLICY "Admin full access to verification docs"
```

## Verification

After applying the fix, admin users will be able to:
- ✅ View all verification documents
- ✅ Create signed URLs for any document
- ✅ Manage verification status with full document access

## Troubleshooting

### Migration Fails
```bash
# Check Supabase connection
npx supabase status

# Login to Supabase
npx supabase login

# Check environment variables
cat .env.local
```

### Still Can't Access Documents
1. Verify you're logged in as an admin user
2. Check that your user exists in `admin_users` table
3. Refresh the admin panel page
4. Check browser console for detailed error messages

### Error Messages in Admin Panel
The updated admin panel now shows helpful error messages:
- "Documento no encontrado" - File doesn't exist
- "Acceso denegado - ejecuta la migración" - Migration needed
- "Error inesperado" - Other technical issues

## Files Modified

- ✅ `supabase/migrations/20250812000012-fix-admin-storage-ambiguity.sql` - **NEW** corrected migration
- ✅ `src/components/admin/AdminVerificationPanel.tsx` - **CLEANED** removed debugging code
- ✅ `fix-admin-storage-access.bat` - **UPDATED** Windows script
- ✅ `fix-admin-storage-access.sh` - **UPDATED** Linux/Mac script
- ❌ `supabase/migrations/20250812000011-fix-admin-storage-access.sql` - Replaced by corrected version

## Security Notes

- Admin access is restricted to users in the `admin_users` table
- Regular users still cannot access each other's documents
- All access is properly logged and audited
- Storage policies follow least-privilege principle
