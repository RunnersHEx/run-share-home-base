@echo off
echo 🔧 Fixing User Activation System - Final Solution
echo.

REM Change to project directory  
cd /d "%~dp0"

echo 📁 Current directory: %CD%

REM Apply the single migration that fixes the issue
echo ⚡ Applying the user activation fix...
npx supabase db push

if %ERRORLEVEL% neq 0 (
    echo ❌ Error applying migration. Please check your Supabase configuration.
    pause
    exit /b 1
)

echo.
echo ✅ Migration applied successfully!
echo.
echo 🧪 Testing the fix:
echo 1. Go to Admin Panel ^> User Management
echo 2. Click "Desactivar" or "Activar" on any user
echo 3. The 500 error should now be fixed!
echo.
echo 📋 What was fixed:
echo - Removed problematic INSERT into user_notifications from admin_toggle_user_status function
echo - Function now only handles user status toggle and admin messages
echo - Notifications are handled by frontend NotificationService using direct table access
echo - No breaking changes to existing functionality
echo.
echo 🎉 User activation system should now work correctly!
echo.
pause
