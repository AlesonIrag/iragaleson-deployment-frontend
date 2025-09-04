@echo off
echo ========================================
echo   Library Management System - Separated Mode
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
start "Backend Server" cmd /k "cd src\backend-api && npm start"

echo.
echo [3/3] Starting frontend server (separated mode)...
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "npm run start:separated"

echo.
echo ========================================
echo   Separated deployment mode active...
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo This mode simulates separated deployment
echo where frontend and backend can be on
echo different servers/containers.
echo.
echo Press any key to close this window...
pause > nul
