@echo off
echo 🔧 Fixing RLS Issue for Admin Function
echo.

REM Change to project directory  
cd /d "%~dp0"

echo 📁 Current directory: %CD%

echo.
echo ⚡ Applying RLS bypass fix for admin function...
npx supabase db push

if %ERRORLEVEL% neq 0 (
    echo ❌ Error applying fix. Please check your Supabase configuration.
    pause
    exit /b 1
)

echo.
echo ✅ RLS bypass fix applied!
echo.
echo 🧪 NOW TEST:
echo 1. Go to Admin Panel ^> User Management
echo 2. Try to activate/deactivate a user
echo 3. The "Step 2: Get user profile" error should be fixed!
echo.
echo 📋 What was fixed:
echo - Added SET row_security = off to bypass RLS for admin function
echo - Fixed admin_id foreign key constraint using auth.uid()
echo - Simplified variable handling to avoid RECORD issues  
echo - Function can now read any user's profile for admin operations
echo.
echo 🎉 User activation should work now!
echo.
pause