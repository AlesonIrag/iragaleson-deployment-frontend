@echo off
echo ========================================
echo   Library Management System - Dev Setup
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm run setup
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Starting backend server...
start "Backend Server" cmd /k "cd backend-api && npm start"

echo.
echo [3/3] Starting frontend server...
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "ng serve --host 0.0.0.0"

echo.
echo ========================================
echo   Development servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo Press any key to close this window...
pause > nul
