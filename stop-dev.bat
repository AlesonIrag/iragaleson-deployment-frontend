@echo off
echo ========================================
echo   Stopping Development Servers
echo ========================================
echo.

echo Stopping Node.js processes...
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js processes stopped
) else (
    echo ℹ️  No Node.js processes were running
)

echo.
echo Stopping Angular CLI processes...
taskkill /f /im ng.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Angular CLI processes stopped
) else (
    echo ℹ️  No Angular CLI processes were running
)

echo.
echo ========================================
echo   Development servers stopped
echo ========================================
echo.
pause
