@echo off
echo ========================================
echo Production Configuration Check
echo ========================================

echo.
echo [1] Checking frontend build...
if exist "dist\Library-Management-System-AI\browser\index.html" (
    echo ✓ Frontend build exists
) else (
    echo ✗ Frontend build missing - run 'npm run build:prod'
)

echo.
echo [2] Checking backend configuration...
if exist "backend-api\.env" (
    echo ✓ Backend .env file exists
    echo   Checking CORS configuration...
    findstr /C:"benedictocollege-library.org" backend-api\.env >nul
    if %errorlevel% equ 0 (
        echo ✓ Domain configured in CORS
    ) else (
        echo ✗ Domain not found in CORS configuration
    )
) else (
    echo ✗ Backend .env file missing
)

echo.
echo [3] Checking required dependencies...
where http-server >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ http-server is installed
) else (
    echo ✗ http-server not found - run 'npm install -g http-server'
)

echo.
echo [4] Checking ports...
netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo ! Port 3000 is in use
) else (
    echo ✓ Port 3000 is available
)

netstat -an | findstr ":4200" >nul
if %errorlevel% equ 0 (
    echo ! Port 4200 is in use
) else (
    echo ✓ Port 4200 is available
)

echo.
echo ========================================
echo Configuration check complete
echo ========================================
pause
