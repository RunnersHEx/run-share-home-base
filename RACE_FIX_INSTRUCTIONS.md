# RACE MANAGEMENT FUNCTIONS - QUICK FIX

## IMMEDIATE SOLUTION

The race deletion is failing because the SQL functions don't exist in your database yet.

### Step 1: Apply Minimal Functions (Test)
1. Go to https://supabase.com/dashboard
2. Open your project
3. Go to **SQL Editor**
4. Copy the contents of `test-race-functions-minimal.sql`
5. Paste and click **RUN**

### Step 2: Test Delete Function
- Try deleting a race in admin panel
- If it works, proceed to Step 3
- If it fails, check the browser console for the exact error

### Step 3: Apply Full Functions (Complete Solution)
1. In the same SQL Editor
2. Copy the contents of `create-race-functions.sql`
3. Paste and click **RUN**

## WHAT THESE FUNCTIONS DO

### `admin_delete_race()`
- Permanently deletes a race
- Cancels all bookings
- Refunds points to guests
- Sends notifications to host and guests

### `admin_update_race_status()`
- Activates/deactivates races (toggles is_active)
- Sends notifications to host
- Does NOT delete the race

## TROUBLESHOOTING

If you get errors when applying the SQL:

1. **"function already exists"** - That's OK, it means it's working
2. **"permission denied"** - Make sure you're logged in as the project owner
3. **"syntax error"** - Copy the exact SQL again, don't modify it

## IMMEDIATE TEST

After applying the minimal functions, the delete button should work immediately.
The deactivate/activate buttons should also work properly.

Let me know if you need help with any step!
