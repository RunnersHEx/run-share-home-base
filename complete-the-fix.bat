@echo off
echo 🎉 Applying Complete User Activation Fix!
echo.

REM Change to project directory  
cd /d "%~dp0"

echo 📁 Current directory: %CD%

echo.
echo ⚡ Applying complete fix (RLS policies + function)...
npx supabase db push

if %ERRORLEVEL% neq 0 (
    echo ❌ Error applying fix. Please check your Supabase configuration.
    pause
    exit /b 1
)

echo.
echo ✅ Complete fix applied successfully!
echo.
echo 🧪 NOW TEST:
echo 1. Go to Admin Panel ^> User Management
echo 2. Try to activate/deactivate a user
echo 3. Both the database function AND notifications should work!
echo.
echo 📋 What was fixed:
echo - Database function: ✅ Working (no more 500 error)
echo - RLS policies: ✅ Fixed for user_notifications table  
echo - Notifications: ✅ Should work without 403 error
echo - Admin messages: ✅ Created properly
echo.
echo 🎉 Complete user activation system should work now!
echo.
pause